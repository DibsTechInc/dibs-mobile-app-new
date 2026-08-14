/**
 * What the profile form will and will not send.
 *
 * PURE TypeScript. The rules live here rather than in the screen so they can be tested, and so
 * the same answers hold if a second surface ever edits a profile.
 */

export interface ProfileDraft {
  firstName: string;
  lastName: string;
  phone: string;
  /** `MM/DD`, as typed. Empty is a real value — a birthday is optional. */
  birthday: string;
}

export type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>;

/**
 * A phone number as the backend wants it: digits only.
 *
 * The service compares `mobilephone` with `===` against other rows to catch duplicates, so
 * "(310) 403-7905" and "3104037905" would read as two different numbers belonging to two
 * different people. Stripping to digits here is what makes that check mean anything.
 *
 * A leading `+` and country code are dropped along with everything else, which matches how the
 * column is populated across the platform ("stored digits-only", per the notification-subscriber
 * schema). US numbers only in practice; both pilot studios are US.
 */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, '');
}

/** "(310) 403-7905" for a 10-digit US number; anything else is shown as typed. */
export function formatPhoneForDisplay(input: string | null | undefined): string {
  const digits = normalizePhone(input ?? '');
  if (digits.length !== 10) return input?.trim() ?? '';
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const MIN_PHONE_DIGITS = 10;

/**
 * A birthday as the platform stores it: `MM/DD`, no year.
 *
 * That format is the widget's, not a decision made here — its profile form places "MM/DD" and
 * `update-client-profile.js` treats that literal string as an unfilled placeholder. Studios use
 * the date for birthday perks, which is why no year is collected: asking a client their age to
 * send them a free class is a worse trade than they signed up for.
 *
 * Typed separators are tolerated (`3-14`, `3.14`, `314`) and normalized, because a date field that
 * rejects a plausible keystroke is a field people give up on.
 */
export function normalizeBirthday(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 3 && digits.length !== 4) return input.trim();
  // 3 digits is unambiguous only one way round: `314` is 3/14, never 31/4.
  const month = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
  const day = digits.length === 3 ? digits.slice(1) : digits.slice(2);
  return `${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
}

/** Days in each month, ignoring leap years — Feb 29 is a real birthday and must be allowed. */
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function birthdayError(input: string): string | undefined {
  const value = input.trim();
  // Optional. Empty clears it, which the service already coerces to null.
  if (!value) return undefined;

  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(normalizeBirthday(value));
  if (!match) return 'Use MM/DD — for example 03/14.';

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12) return 'That month does not exist.';
  // Checked against the actual month rather than a flat 31, so 02/30 is caught. Feb allows 29:
  // there is no year here, so a leap-day birthday has nothing to be checked against.
  if (day < 1 || day > DAYS_IN_MONTH[month - 1]) return 'That day does not exist in that month.';

  return undefined;
}

export function validateProfile(draft: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};

  // A name is not optional: it is what the studio sees on its roster and what the client is
  // greeted by. An empty one turns into a blank row at the front desk.
  if (!draft.firstName.trim()) errors.firstName = 'Please enter your first name.';
  if (!draft.lastName.trim()) errors.lastName = 'Please enter your last name.';

  const digits = normalizePhone(draft.phone);
  // Empty is allowed — a phone number is optional, and the service skips anything short. But a
  // half-typed one is worse than none: the studio would call a number that does not connect, and
  // SMS reminders would silently fail for that client forever.
  if (digits.length > 0 && digits.length < MIN_PHONE_DIGITS) {
    errors.phone = 'That phone number looks incomplete.';
  }

  const birthday = birthdayError(draft.birthday);
  if (birthday) errors.birthday = birthday;

  return errors;
}

export function hasProfileErrors(errors: ProfileErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Has anything actually changed? Saving an unchanged profile is a write nobody asked for. */
export function isProfileDirty(draft: ProfileDraft, original: ProfileDraft): boolean {
  return (
    draft.firstName.trim() !== original.firstName.trim() ||
    draft.lastName.trim() !== original.lastName.trim() ||
    normalizePhone(draft.phone) !== normalizePhone(original.phone) ||
    // Compared NORMALIZED, so typing `3/14` over a stored `03/14` is not a change to save.
    normalizeBirthday(draft.birthday) !== normalizeBirthday(original.birthday)
  );
}
