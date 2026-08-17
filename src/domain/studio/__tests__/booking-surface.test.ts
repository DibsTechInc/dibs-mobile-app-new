/**
 * Which surface "Book" opens. The matrix that matters: build flags × server flags × legacy
 * fallbacks × no-config-yet — and the rule that a server outage can remove nothing and a server
 * flag can add nothing the build has no code for.
 */
import type { BasicConfig } from '@/api/schemas/basic-config';

import { bookRouteForSurface, resolveBookingSurface } from '../booking-surface';

const CLASSES_BUILD = { classes: true, appointments: false };
const APPTS_BUILD = { classes: false, appointments: true };
const BOTH_BUILD = { classes: true, appointments: true };

function config(overrides: Partial<BasicConfig> = {}): BasicConfig {
  return { studioName: 'Test', color: '1A92E4', timezone: 'America/New_York', ...overrides } as BasicConfig;
}

describe('resolveBookingSurface', () => {
  it('an appointments build + a studio offering appointments → appointments', () => {
    expect(
      resolveBookingSurface(APPTS_BUILD, config({ offersAppointments: true, offersClasses: false })),
    ).toBe('appointments');
  });

  it('a classes build is untouched by appointment flags — the server cannot add a surface the build has no code for', () => {
    expect(
      resolveBookingSurface(CLASSES_BUILD, config({ offersAppointments: true, offersClasses: true })),
    ).toBe('classes');
  });

  it('no config yet (offline first launch) → the build flags stand alone', () => {
    expect(resolveBookingSurface(APPTS_BUILD, null)).toBe('appointments');
    expect(resolveBookingSurface(CLASSES_BUILD, undefined)).toBe('classes');
  });

  it('a server FALSE removes a surface', () => {
    expect(resolveBookingSurface(BOTH_BUILD, config({ offersAppointments: false }))).toBe('classes');
    expect(resolveBookingSurface(BOTH_BUILD, config({ offersClasses: false }))).toBe('appointments');
  });

  it('falls back to the legacy showSchedule / showAppts pair exactly as the backend derives them', () => {
    expect(resolveBookingSurface(BOTH_BUILD, config({ showAppts: false }))).toBe('classes');
    expect(resolveBookingSurface(APPTS_BUILD, config({ showAppts: true }))).toBe('appointments');
    // The modern flag OUTRANKS the legacy one when both are present.
    expect(
      resolveBookingSurface(BOTH_BUILD, config({ offersAppointments: true, showAppts: false })),
    ).toBe('both');
  });

  it('the server erasing EVERYTHING falls back to the build — an app with no way in is worse than a booking that fails politely', () => {
    expect(
      resolveBookingSurface(APPTS_BUILD, config({ offersAppointments: false, offersClasses: false })),
    ).toBe('appointments');
    expect(
      resolveBookingSurface(CLASSES_BUILD, config({ offersClasses: false })),
    ).toBe('classes');
  });

  it('a build with nothing at all is none (findStudioConfigProblems refuses this at build time anyway)', () => {
    expect(resolveBookingSurface({ classes: false, appointments: false }, null)).toBe('none');
  });
});

describe('bookRouteForSurface', () => {
  it('appointments → /book; everything else keeps the schedule', () => {
    expect(bookRouteForSurface('appointments')).toBe('/book');
    expect(bookRouteForSurface('classes')).toBe('/schedule');
    // No live studio runs both; classes wins until one does, and this line is where that lives.
    expect(bookRouteForSurface('both')).toBe('/schedule');
    expect(bookRouteForSurface('none')).toBe('/schedule');
  });
});
