/**
 * The client half of the price agreement.
 *
 * These numbers are pinned against the SERVER's `price-class-for-client.js` golden-master suite —
 * the studio-88 $22 class at 8.25% is the same fixture in both repos. If the two ever disagree,
 * every booking trips the mismatch refusal, so a failure here is a cross-repo drift alarm, not a
 * cosmetic one.
 */
import { describe, expect, it } from '@jest/globals';

import type { ScheduleEvent } from '@/api/schemas/schedule';

import { chargeFromServerBreakdown, resolveClassCharge } from '../class-charge';

const classEvent = (overrides: Partial<ScheduleEvent> = {}): ScheduleEvent =>
  ({
    eventid: 180384062,
    start_date: '2026-08-18T10:30:00.000Z',
    name: 'Beginner BASIC Ballet',
    price_dibs: 22,
    free_class: false,
    location: { tax_rate: 8.25 },
    ...overrides,
  }) as ScheduleEvent;

describe('resolveClassCharge', () => {
    it('adds tax to the list price, in integer cents', () => {
        const charge = resolveClassCharge(classEvent());

        expect(charge).toMatchObject({
            status: 'chargeable',
            subtotalCents: 2200,
            listPriceCents: 2200,
            isDiscounted: false,
            // 2200 * 8.25 / 100 = 181.5 → 182. Matches the server's Math.round exactly; a
            // one-cent drift here refuses every booking with `price_changed`.
            taxCents: 182,
            totalCents: 2382,
        });
    });

    it('labels the drop-in without cents and the total WITH them', () => {
        const charge = resolveClassCharge(classEvent());

        // A quoted price drops trailing zeroes; a figure being charged does not — "$23.8" would
        // read as an approximation of somebody's money.
        expect(charge.subtotalLabel).toBe('$22');
        expect(charge.taxLabel).toBe('$1.82');
        expect(charge.totalLabel).toBe('$23.82');
    });

    it("takes the backend's discounted price, never re-deriving one", () => {
        const charge = resolveClassCharge(
            classEvent({
                pricing_rule: {
                    original_price: 22,
                    discounted_price: 16.5,
                    rule_name: 'Weekday Mid-Morning',
                },
            }),
        );

        expect(charge.subtotalCents).toBe(1650);
        expect(charge.listPriceCents).toBe(2200);
        expect(charge.isDiscounted).toBe(true);
        // Tax on the DISCOUNTED price: 1650 * 8.25 / 100 = 136.125 → 136.
        expect(charge.taxCents).toBe(136);
        expect(charge.totalCents).toBe(1786);
    });

    it('charges no tax when the location publishes none', () => {
        const charge = resolveClassCharge(classEvent({ location: { tax_rate: 0 } }));

        expect(charge.taxCents).toBe(0);
        expect(charge.totalCents).toBe(2200);
    });

    it('treats a missing location as no tax rather than throwing', () => {
        const charge = resolveClassCharge(classEvent({ location: null }));

        expect(charge.status).toBe('chargeable');
        expect(charge.totalCents).toBe(2200);
    });

    it('reports a free class as free — bookable, but never by card', () => {
        const charge = resolveClassCharge(classEvent({ free_class: true }));

        expect(charge.status).toBe('free');
        expect(charge.totalCents).toBe(0);
    });

    it.each([
        ['null', null],
        ['zero', 0],
        ['undefined', undefined],
    ])('reports price_dibs = %s as UNKNOWN, never as free', (_label, price_dibs) => {
        // Pass-only and priced-elsewhere classes look exactly like this. Telling somebody the
        // class is free when it is not is worse than saying nothing.
        const charge = resolveClassCharge(classEvent({ price_dibs } as Partial<ScheduleEvent>));

        expect(charge.status).toBe('unknown');
        expect(charge.totalCents).toBe(0);
    });

    it('checks free_class BEFORE the price, like the server does', () => {
        // Several studios leave price_dibs populated on classes they have since flagged free.
        const charge = resolveClassCharge(classEvent({ free_class: true, price_dibs: 22 }));

        expect(charge.status).toBe('free');
    });

    it('labels a non-USD currency correctly', () => {
        expect(resolveClassCharge(classEvent(), 'CAD').totalLabel).toContain('23.82');
    });
});

describe('chargeFromServerBreakdown', () => {
    const breakdown = {
        priceAvailable: true,
        isFree: false,
        listPriceCents: 2200,
        discountedPriceCents: null,
        subtotalCents: 2200,
        taxCents: 182,
        totalCents: 2382,
    };

    it("adopts the SERVER's figures wholesale after a price_changed", () => {
        // The server's number is the one the client is being asked to confirm; reconciling it
        // against whatever the schedule row implied is how the two disagree again.
        const charge = chargeFromServerBreakdown(breakdown);

        expect(charge).toMatchObject({
            status: 'chargeable',
            subtotalCents: 2200,
            taxCents: 182,
            totalCents: 2382,
            totalLabel: '$23.82',
        });
    });

    it('marks a rule-discounted total as discounted', () => {
        const charge = chargeFromServerBreakdown({
            ...breakdown,
            discountedPriceCents: 1650,
            subtotalCents: 1650,
            taxCents: 136,
            totalCents: 1786,
        });

        expect(charge.isDiscounted).toBe(true);
    });

    it('reports a free or unpriced breakdown rather than a $0 charge', () => {
        expect(chargeFromServerBreakdown({ ...breakdown, isFree: true, totalCents: 0 }).status).toBe(
            'free',
        );
        expect(chargeFromServerBreakdown({ ...breakdown, priceAvailable: false }).status).toBe(
            'unknown',
        );
    });
});
