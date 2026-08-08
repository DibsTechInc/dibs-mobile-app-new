/**
 * Studio config + raw schedule → everything Home renders.
 *
 * PURE TypeScript, so the whole of Home's content logic is testable without a simulator: which
 * classes appear, what the greeting says at 6am versus 9pm, whether booking is offered at all.
 *
 * Lives in `domain/` rather than beside the screen because none of it is presentation. The
 * screen decides how a row looks; this decides what is true.
 */
import type { BasicConfig } from '@/api/schemas/basic-config';
import { isAcceptingBookings } from '@/api/schemas/basic-config';
import type { ScheduleEvent } from '@/api/schemas/schedule';
import { toScheduleEntry } from '@/domain/schedule/entry';
import { selectTodaysClasses, selectUpcomingClasses } from '@/domain/schedule/select';
import type { ScheduleEntry } from '@/domain/schedule/types';
import { formatStoredTime, studioNow } from '@/domain/time/studio-now';

export interface UpcomingBooking {
  eventId: number;
  startsAt: string;
  name: string;
  instructor: string | null;
  locationLabel: string | null;
  /**
   * "Today" / "Tomorrow" / "Fri, Aug 8", resolved against the STUDIO's clock.
   *
   * Carried on the data rather than derived in the screen because "today" is a question about
   * the studio's calendar day, and a screen that assumes its answer is how a card ends up
   * saying "Today" about a class next Thursday.
   */
  whenLabel: string;
}

/** "Today" / "Tomorrow" / "Fri, Aug 8" for a stored wall-clock time, in the studio's own day. */
export function describeBookingDay(
  startsAt: string,
  timeZone: string,
  now: Date = new Date(),
): string {
  const today = studioNow(timeZone, now);
  const startDay = startsAt.slice(0, 10);
  const dayAfter = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  if (startDay === today.toISOString().slice(0, 10)) return 'Today';
  if (startDay === dayAfter.toISOString().slice(0, 10)) return 'Tomorrow';
  return formatStoredTime(startsAt, { weekday: 'short', month: 'short', day: 'numeric' });
}

export interface HomeData {
  /**
   * The whole greeting line, already resolved — "Good evening,\nElan" or "Welcome".
   *
   * Built here rather than in the screen because it depends on the STUDIO's clock, not the
   * device's. A hardcoded "Good morning" is the kind of small wrongness that tells a client
   * nobody is minding the app.
   */
  greeting: string;
  /** The studio's own display name, from get-basic-config. */
  studioName: string;
  /** Today in the STUDIO's clock, already formatted. */
  todayLabel: string;
  heroUri: string | null;
  nextBooking: UpcomingBooking | null;
  /** Today's remaining classes, or the next few when today is over. */
  classes: ScheduleEntry[];
  /** Which of those two the list is, so the section can label itself honestly. */
  classesLabel: 'today' | 'upcoming';
  /** False when the studio is offboarded or in soft lockout — booking CTAs come down. */
  acceptingBookings: boolean;
}

export interface BuildHomeDataArgs {
  config: BasicConfig;
  events: ScheduleEvent[];
  /** First name of the signed-in client, or null while browsing signed out. */
  firstName?: string | null;
  nextBooking?: UpcomingBooking | null;
  /** From the white-label build config — 263-style rental studios hide instructor names. */
  showInstructor: boolean;
  /** Injectable for tests. Production always passes the real present. */
  now?: Date;
}

/** How many classes Home shows when it has fallen back to "coming up". */
const UPCOMING_FALLBACK_COUNT = 3;

/**
 * Morning / afternoon / evening by the STUDIO's clock.
 *
 * Boundaries at noon and 17:00 — the ordinary English ones. A client in another timezone gets
 * the studio's greeting, which is the right answer: this is the studio's app, and its schedule
 * is the thing being greeted over.
 */
export function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export interface Greeting {
  /** The large line: "Hi Alicia!" or the studio's name. */
  title: string;
  /** The quiet line under it. Null when the title already said everything. */
  subtitle: string | null;
}

/**
 * The two lines on Home, and the only thing a session changes about that screen.
 *
 * **Signed in it is a person's name, not a time of day.** "Hi Alicia! / Welcome to Everyday
 * Ballet" — which is what the old app said and what Alicia asked to come back (2026-08-07). A
 * time-of-day greeting is a small thing that goes stale: the client who opens the app at 11:58
 * and again at 12:02 is greeted differently for no reason they can see.
 *
 * **Signed out it is the studio's name**, with the date beneath. Naming nobody beats guessing, and
 * a guest opening a branded app should be met by the brand.
 *
 * `greetingFor` is kept because the date line still reads in the studio's clock, and because
 * nothing about it was wrong — it is simply not what Home says any more.
 */
export function buildGreeting({
  firstName,
  studioName,
}: {
  firstName: string | null;
  studioName: string;
}): Greeting {
  if (firstName) {
    return { title: `Hi ${firstName}!`, subtitle: `Welcome to ${studioName}` };
  }

  // "Welcome" over the studio's name — the approved mock, `design/mockups/rework.html`, second
  // phone. The display line stays a greeting in both states and only the second line changes,
  // so signing in reads as the same screen learning your name rather than a different screen.
  //
  // It used to put the studio's NAME on the display line over today's date. Both were wrong on
  // this surface: the name is already the app's icon, its title and the word under the greeting,
  // so setting it in 34px Fraunces spends the largest type on the least new information; and the
  // date answers a question nobody opening a booking app is asking — the schedule screen is one
  // tap away and dates every row. `timeZone` and `now` are gone with it, since neither state
  // depends on the clock any more.
  return { title: 'Welcome', subtitle: studioName };
}

export function buildHomeData({
  config,
  events,
  firstName = null,
  nextBooking = null,
  showInstructor,
  now = new Date(),
}: BuildHomeDataArgs): HomeData {
  const timeZone = config.timezone;
  const nowInStudio = studioNow(timeZone, now);

  const entryOptions = { showInstructor, currency: config.currency };
  const todays = selectTodaysClasses(events, timeZone, now);
  const useToday = todays.length > 0;
  const source = useToday
    ? todays
    : selectUpcomingClasses(events, timeZone, UPCOMING_FALLBACK_COUNT, now);

  const timeOfDay = greetingFor(nowInStudio.getUTCHours());

  return {
    // A signed-out client gets "Welcome" — naming nobody is better than guessing.
    greeting: firstName ? `${timeOfDay},\n${firstName}` : 'Welcome',
    studioName: config.studioName,
    todayLabel: formatStoredTime(nowInStudio, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    heroUri: config.heroUrl ?? null,
    nextBooking,
    classes: source.map((event) => toScheduleEntry(event, entryOptions)),
    classesLabel: useToday ? 'today' : 'upcoming',
    acceptingBookings: isAcceptingBookings(config),
  };
}
