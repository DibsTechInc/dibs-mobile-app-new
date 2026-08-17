import {
  formatPhoneForDisplay,
  hasProfileErrors,
  isProfileDirty,
  normalizeBirthday,
  normalizePhone,
  validateProfile,
} from '../validate';

const base = { firstName: 'Elan', lastName: 'Marek', phone: '3104037905', birthday: '' };

describe('normalizePhone', () => {
  it('reduces every written form of one number to the same digits', () => {
    // The backend compares mobilephone with ===, so "(310) 403-7905" and "3104037905" would read
    // as two different people's numbers and the duplicate check would never fire.
    for (const written of ['(310) 403-7905', '310-403-7905', '310.403.7905', '310 403 7905']) {
      expect(normalizePhone(written)).toBe('3104037905');
    }
  });

  it('returns an empty string for an empty input rather than anything undefined-shaped', () => {
    expect(normalizePhone('')).toBe('');
  });
});

describe('formatPhoneForDisplay', () => {
  it('formats a ten-digit number', () => {
    expect(formatPhoneForDisplay('3104037905')).toBe('(310) 403-7905');
  });

  it('shows anything else as typed instead of mangling it', () => {
    // An international or partial number is not ours to reformat.
    expect(formatPhoneForDisplay('+44 20 7946 0958')).toBe('+44 20 7946 0958');
    expect(formatPhoneForDisplay(null)).toBe('');
  });
});

describe('validateProfile', () => {
  it('accepts a complete profile', () => {
    expect(hasProfileErrors(validateProfile(base))).toBe(false);
  });

  it('requires both names', () => {
    const errors = validateProfile({ ...base, firstName: '  ', lastName: '' });
    expect(errors.firstName).toBeDefined();
    expect(errors.lastName).toBeDefined();
  });

  it('allows no phone number at all', () => {
    expect(hasProfileErrors(validateProfile({ ...base, phone: '' }))).toBe(false);
  });

  it('rejects a half-typed phone number', () => {
    // Worse than none: the studio calls a number that does not connect and every SMS reminder
    // fails silently for that client from then on.
    expect(validateProfile({ ...base, phone: '310403' }).phone).toBeDefined();
  });
});

describe('isProfileDirty', () => {
  it('is false when nothing changed', () => {
    expect(isProfileDirty(base, base)).toBe(false);
  });

  it('ignores whitespace and phone punctuation', () => {
    // Re-formatting a number the client did not touch is not a change, and saving it would be a
    // write nobody asked for.
    expect(isProfileDirty({ ...base, firstName: 'Elan ', phone: '(310) 403-7905' }, base)).toBe(false);
  });

  it('is true for a real edit', () => {
    expect(isProfileDirty({ ...base, lastName: 'Marek-Ross' }, base)).toBe(true);
  });
});

describe('birthday', () => {
  it('accepts MM/DD and normalizes what people actually type', () => {
    // A date field that rejects a plausible keystroke is a field people give up on.
    expect(normalizeBirthday('03/14')).toBe('03/14');
    expect(normalizeBirthday('3/14')).toBe('03/14');
    expect(normalizeBirthday('3-14')).toBe('03/14');
    expect(normalizeBirthday('314')).toBe('03/14');
    expect(normalizeBirthday('0314')).toBe('03/14');
  });

  it('is optional — empty is a real answer, not an error', () => {
    expect(validateProfile({ ...base, birthday: '' }).birthday).toBeUndefined();
    expect(validateProfile({ ...base, birthday: '   ' }).birthday).toBeUndefined();
  });

  it('allows February 29 — a leap-day birthday is a birthday', () => {
    // There is no year stored, so there is nothing to check a leap day against. Rejecting it
    // would tell roughly five million people their birthday does not exist.
    expect(validateProfile({ ...base, birthday: '02/29' }).birthday).toBeUndefined();
  });

  it('rejects a day that does not exist in that month', () => {
    // Checked against the actual month rather than a flat 31.
    expect(validateProfile({ ...base, birthday: '02/30' }).birthday).toBeDefined();
    expect(validateProfile({ ...base, birthday: '04/31' }).birthday).toBeDefined();
    expect(validateProfile({ ...base, birthday: '13/01' }).birthday).toBeDefined();
    expect(validateProfile({ ...base, birthday: '00/10' }).birthday).toBeDefined();
  });

  it('rejects a year, because the platform does not store one', () => {
    expect(validateProfile({ ...base, birthday: '03/14/1990' }).birthday).toBeDefined();
  });

  it('does not count a reformat as a change to save', () => {
    // Typing 3/14 over a stored 03/14 is the same birthday. Saving it would be a write nobody
    // asked for, and it would light up the Save button for no reason.
    expect(isProfileDirty({ ...base, birthday: '3/14' }, { ...base, birthday: '03/14' })).toBe(false);
    expect(isProfileDirty({ ...base, birthday: '03/15' }, { ...base, birthday: '03/14' })).toBe(true);
  });
});
