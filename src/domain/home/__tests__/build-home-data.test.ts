/**
 * Everything Home is true about.
 *
 * The whole point of building this outside the screen is that these can be asserted without a
 * simulator — particularly the ones that depend on what time it is at the studio, which are
 * exactly the ones nobody catches by looking at a screenshot taken at 2pm.
 */
import type { BasicConfig } from '@/api/schemas/basic-config';
import type { ScheduleEvent } from '@/api/schemas/schedule';

import { buildGreeting, buildHomeData, describeBookingDay, greetingFor } from '../build-home-data';

function config(overrides: Partial<BasicConfig> = {}): BasicConfig {
  // Trimmed from the real studio 210 response, 2026-08-06.
  return {
    studioName: 'Carlsbad Village Yoga',
    color: '356280',
    colorLogo: 'https://dibs-email-assets.s3.amazonaws.com/images/studio-logos/cvyoga.png',
    heroUrl: 'https://dibs-email-assets.s3.amazonaws.com/images/studio-images/cvyoga_hero.png',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    studioIsLive: true,
    ...overrides,
  } as BasicConfig;
}

function event(startsAt: string, overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    eventid: Number(startsAt.replace(/\D/g, '').slice(-8)),
    start_date: startsAt,
    end_date: null,
    name: 'Flow',
    eventtype: 'class',
    seats: 16,
    spots_booked: 1,
    price_dibs: 22,
    ...overrides,
  } as ScheduleEvent;
}

const BASE = { showInstructor: true };

describe('greetingFor', () => {
  it('changes with the hour', () => {
    expect(greetingFor(6)).toBe('Good morning');
    expect(greetingFor(11)).toBe('Good morning');
    expect(greetingFor(12)).toBe('Good afternoon');
    expect(greetingFor(16)).toBe('Good afternoon');
    expect(greetingFor(17)).toBe('Good evening');
    expect(greetingFor(23)).toBe('Good evening');
  });
});

describe('buildHomeData — the greeting', () => {
  it("uses the STUDIO's clock, not UTC", () => {
    // 2026-08-06T02:00Z is 19:00 the previous evening in Los Angeles. Reading the UTC hour
    // would greet a client with "Good morning" at 7pm.
    const data = buildHomeData({
      config: config(),
      events: [],
      firstName: 'Elan',
      ...BASE,
      now: new Date('2026-08-06T02:00:00.000Z'),
    });
    expect(data.greeting).toBe('Good evening,\nElan');
  });

  it('greets a signed-out client without inventing a name', () => {
    const data = buildHomeData({
      config: config(),
      events: [],
      ...BASE,
      now: new Date('2026-08-05T16:00:00.000Z'),
    });
    expect(data.greeting).toBe('Welcome');
  });

  it('labels today in the studio day', () => {
    const data = buildHomeData({
      config: config(),
      events: [],
      ...BASE,
      now: new Date('2026-08-06T02:00:00.000Z'), // still Aug 5 in California
    });
    expect(data.todayLabel).toBe('Wednesday, August 5');
  });
});

describe('buildHomeData — the class list', () => {
  const afternoon = new Date('2026-08-05T22:30:00.000Z'); // 15:30 Pacific

  it("shows today's remaining classes and says so", () => {
    const data = buildHomeData({
      config: config(),
      events: [event('2026-08-05T06:00:00.000Z'), event('2026-08-05T18:00:00.000Z')],
      ...BASE,
      now: afternoon,
    });
    expect(data.classesLabel).toBe('today');
    expect(data.classes.map((c) => c.startsAt)).toEqual(['2026-08-05T18:00:00.000Z']);
  });

  it('falls back to what is coming up once the studio day is over', () => {
    // Otherwise Home is an empty state all evening, whose only action is a screen that does not
    // exist yet — a dead end at exactly the hour people plan tomorrow.
    const lateNight = new Date('2026-08-06T06:30:00.000Z'); // 23:30 Pacific
    const data = buildHomeData({
      config: config(),
      events: [
        event('2026-08-05T18:00:00.000Z'),
        event('2026-08-06T09:00:00.000Z'),
        event('2026-08-06T18:00:00.000Z'),
        event('2026-08-07T09:00:00.000Z'),
        event('2026-08-07T18:00:00.000Z'),
      ],
      ...BASE,
      now: lateNight,
    });
    expect(data.classesLabel).toBe('upcoming');
    expect(data.classes).toHaveLength(3);
    expect(data.classes[0].startsAt).toBe('2026-08-06T09:00:00.000Z');
  });

  it('is genuinely empty when the studio has posted nothing', () => {
    const data = buildHomeData({ config: config(), events: [], ...BASE, now: afternoon });
    expect(data.classes).toEqual([]);
  });

  it('passes the studio currency through to the price labels', () => {
    const data = buildHomeData({
      config: config({ currency: 'USD' }),
      events: [event('2026-08-05T18:00:00.000Z', { price_dibs: 22 })],
      ...BASE,
      now: afternoon,
    });
    expect(data.classes[0].price).toEqual({ kind: 'amount', amountLabel: '$22' });
  });
});

describe('buildHomeData — branding and lifecycle', () => {
  it('takes the hero from the live config, so a studio can change it without a release', () => {
    const data = buildHomeData({
      config: config(),
      events: [],
      ...BASE,
      now: new Date('2026-08-05T16:00:00.000Z'),
    });
    expect(data.heroUri).toBe(
      'https://dibs-email-assets.s3.amazonaws.com/images/studio-images/cvyoga_hero.png',
    );
  });

  it('has no hero rather than a broken one when the studio has not set a photo', () => {
    const data = buildHomeData({
      config: config({ heroUrl: null }),
      events: [],
      ...BASE,
      now: new Date('2026-08-05T16:00:00.000Z'),
    });
    expect(data.heroUri).toBeNull();
  });

  it('takes booking CTAs down when the studio is not live', () => {
    const data = buildHomeData({
      config: config({ studioIsLive: false }),
      events: [],
      ...BASE,
      now: new Date('2026-08-05T16:00:00.000Z'),
    });
    expect(data.acceptingBookings).toBe(false);
  });

  it('assumes live when the backend does not send the flag', () => {
    // An older backend that omits the field must not lock every studio out of its own app.
    const data = buildHomeData({
      config: config({ studioIsLive: undefined }),
      events: [],
      ...BASE,
      now: new Date('2026-08-05T16:00:00.000Z'),
    });
    expect(data.acceptingBookings).toBe(true);
  });
});

describe('describeBookingDay', () => {
  const afternoon = new Date('2026-08-05T22:30:00.000Z'); // 15:30 Pacific on Aug 5

  it('says Today and Tomorrow in the studio day', () => {
    expect(describeBookingDay('2026-08-05T18:00:00.000Z', 'America/Los_Angeles', afternoon)).toBe(
      'Today',
    );
    expect(describeBookingDay('2026-08-06T09:00:00.000Z', 'America/Los_Angeles', afternoon)).toBe(
      'Tomorrow',
    );
  });

  it('names the day for anything further out', () => {
    expect(describeBookingDay('2026-08-08T09:00:00.000Z', 'America/Los_Angeles', afternoon)).toBe(
      'Sat, Aug 8',
    );
  });
});

describe('buildGreeting', () => {
  const TZ = 'America/New_York';
  const NOON_ET = new Date('2026-08-07T16:00:00.000Z');

  it('greets a signed-in client by name, not by time of day', () => {
    // "Hi Alicia! / Welcome to Everyday Ballet" — what the old app said, restored 2026-08-07. A
    // time-of-day greeting goes stale within minutes: 11:58 and 12:02 are greeted differently for
    // no reason the client can see.
    expect(buildGreeting({ firstName: 'Alicia', studioName: 'Everyday Ballet', timeZone: TZ, now: NOON_ET }))
      .toEqual({ title: 'Hi Alicia!', subtitle: 'Welcome to Everyday Ballet' });
  });

  it('is identical morning and evening for the same client', () => {
    const morning = buildGreeting({
      firstName: 'Alicia', studioName: 'Everyday Ballet', timeZone: TZ,
      now: new Date('2026-08-07T13:00:00.000Z'),
    });
    const evening = buildGreeting({
      firstName: 'Alicia', studioName: 'Everyday Ballet', timeZone: TZ,
      now: new Date('2026-08-08T01:00:00.000Z'),
    });
    expect(morning).toEqual(evening);
  });

  it('names the studio for a guest rather than guessing at a person', () => {
    const greeting = buildGreeting({
      firstName: null, studioName: 'Carlsbad Village Yoga', timeZone: 'America/Los_Angeles', now: NOON_ET,
    });
    expect(greeting.title).toBe('Carlsbad Village Yoga');
    expect(greeting.subtitle).toBe('Friday, August 7');
  });

  it("dates the guest line in the STUDIO's clock, not the device's", () => {
    // 03:00 UTC on the 8th is still the evening of the 7th in Los Angeles. A device-clock date
    // would tell a west-coast client it is already tomorrow.
    const greeting = buildGreeting({
      firstName: null, studioName: 'Carlsbad Village Yoga', timeZone: 'America/Los_Angeles',
      now: new Date('2026-08-08T03:00:00.000Z'),
    });
    expect(greeting.subtitle).toBe('Friday, August 7');
  });
});
