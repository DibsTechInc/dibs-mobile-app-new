/**
 * Home — the app's landing route.
 *
 * ⚠️ Rendering SAMPLE data. The composition, typography and motion are real; the content is
 * placeholder until P1 wires `get-schedule` and the account endpoints. The shape it renders is
 * `HomeData`, so wiring is a swap of the data source, not a rewrite of the screen.
 */
import { studio } from '@/config/studio';
import { HomeScreen } from '@/features/home/HomeScreen';
import type { HomeData } from '@/features/home/types';

/** Stand-in for the P1 query. Times are stored wall-clock strings, as the API returns them. */
const SAMPLE: HomeData = {
  firstName: 'Elan',
  studioName: studio.appName,
  todayLabel: 'Tuesday, August 5',
  heroUri: null,
  nextBooking: {
    eventId: 1,
    startsAt: '2026-08-05T18:00:00.000Z',
    name: 'Vinyasa Flow',
    instructor: studio.display.showInstructor ? 'Elan' : null,
    locationLabel: 'Studio A',
  },
  todaysClasses: [
    {
      eventId: 2,
      startsAt: '2026-08-05T19:30:00.000Z',
      name: 'Restore & Breathe',
      instructor: studio.display.showInstructor ? 'Marisa' : null,
      durationMinutes: 75,
      spotsLeft: 8,
      isFull: false,
      hasWaitlist: false,
      price: { kind: 'covered', label: '10-Class Pass' },
    },
    {
      eventId: 3,
      startsAt: '2026-08-05T20:45:00.000Z',
      name: 'Candlelight Yin',
      instructor: studio.display.showInstructor ? 'David' : null,
      durationMinutes: 60,
      spotsLeft: 3,
      isFull: false,
      hasWaitlist: false,
      price: { kind: 'amount', amountLabel: '$28' },
    },
  ],
  acceptingBookings: true,
};

export default function HomeRoute() {
  // No-ops until P1. Routing a tap to the component gallery would be more confusing than a tap
  // that does nothing while the destination screens do not exist yet.
  return <HomeScreen data={SAMPLE} onOpenClass={() => {}} onSeeFullSchedule={() => {}} />;
}
