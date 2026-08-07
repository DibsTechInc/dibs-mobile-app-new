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
    normalizePhone(draft.phone) !== normalizePhone(original.phone)
  );
}
