import {
  formatPhoneForDisplay,
  hasProfileErrors,
  isProfileDirty,
  normalizePhone,
  validateProfile,
} from '../validate';

const base = { firstName: 'Elan', lastName: 'Marek', phone: '3104037905' };

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
