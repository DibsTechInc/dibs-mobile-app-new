/**
 * The version gate.
 *
 * Overwhelmingly a fail-open suite, because fail-open IS the feature. A test file that only
 * proved "an old build gets blocked" would pass just as happily against a gate that also blocks
 * on a 500 — and that version bricks every client the first time the endpoint hiccups.
 *
 * These cover the decision. They cannot cover the wire (a real 500, a real DNS failure), which is
 * why §4 of the plan demands the same matrix walked on a device against a deliberately broken
 * endpoint before this ships.
 */
import {
  decideReleaseGate,
  isSoftPromptSuppressed,
  SOFT_PROMPT_INTERVAL_MS,
  type AppReleaseBody,
} from '../gate';

const NOW = Date.UTC(2026, 7, 14, 12, 0, 0);

/** A well-formed document: builds 40 and 47. */
function body(overrides: Record<string, unknown> = {}): AppReleaseBody {
  return {
    ios: { minimumBuild: 40, latestBuild: 47, storeUrl: 'https://apps.apple.com/app/id1' },
    android: { minimumBuild: 0, latestBuild: 0, storeUrl: null },
    message: null,
    ...overrides,
  };
}

function decide(args: Partial<Parameters<typeof decideReleaseGate>[0]> = {}) {
  return decideReleaseGate({
    body: body(),
    platform: 'ios',
    runningBuild: 45,
    now: NOW,
    lastSoftPrompt: null,
    ...args,
  });
}

describe('only a well-formed response can block anybody', () => {
  it('blocks a build below the minimum', () => {
    const gate = decide({ runningBuild: 39 });
    expect(gate).toEqual({
      kind: 'required',
      minimumBuild: 40,
      storeUrl: 'https://apps.apple.com/app/id1',
      message: null,
    });
  });

  it('does NOT block a build exactly at the minimum', () => {
    // `minimumBuild` is the oldest ACCEPTABLE build, not the first blocked one. Off by one here
    // blocks a whole release's worth of clients who did nothing wrong.
    expect(decide({ runningBuild: 40 }).kind).toBe('recommended');
  });

  it('says nothing at all once the running build is current', () => {
    expect(decide({ runningBuild: 47 }).kind).toBe('none');
    expect(decide({ runningBuild: 50 }).kind).toBe('none');
  });

  it('recommends between the minimum and the latest', () => {
    expect(decide({ runningBuild: 45 })).toEqual({
      kind: 'recommended',
      latestBuild: 47,
      storeUrl: 'https://apps.apple.com/app/id1',
      message: null,
    });
  });
});

describe('FAIL OPEN — every one of these must be `none`', () => {
  const cases: Array<[string, Partial<Parameters<typeof decideReleaseGate>[0]>]> = [
    // The request failed for any reason: 500, DNS, timeout, offline. fetchAppRelease turns all of
    // them into null, and null is the single input this whole rule hangs on.
    ['the request failed (null body)', { body: null }],
    ['the body is a string (an HTML error page)', { body: '<html>502 Bad Gateway</html>' }],
    ['the body is a bare number', { body: 42 }],
    ['the body is an array', { body: [] }],
    ['the body is an empty object', { body: {} }],
    ['the platform key is missing', { body: { android: { minimumBuild: 99, latestBuild: 99 } } }],
    ['the platform key is null', { body: body({ ios: null }) }],
    ['the platform key is a string', { body: body({ ios: 'yes' }) }],
    [
      'minimumBuild is the STRING "42"',
      { body: body({ ios: { minimumBuild: '42', latestBuild: 47 } }), runningBuild: 10 },
    ],
    [
      'latestBuild is the STRING "47"',
      { body: body({ ios: { minimumBuild: 40, latestBuild: '47' } }), runningBuild: 10 },
    ],
    [
      'minimumBuild is a float',
      { body: body({ ios: { minimumBuild: 40.5, latestBuild: 47 } }), runningBuild: 10 },
    ],
    [
      'minimumBuild is NaN',
      { body: body({ ios: { minimumBuild: Number.NaN, latestBuild: 47 } }), runningBuild: 10 },
    ],
    [
      'minimumBuild is negative',
      { body: body({ ios: { minimumBuild: -1, latestBuild: 47 } }), runningBuild: 10 },
    ],
    [
      'minimumBuild is missing entirely',
      { body: body({ ios: { latestBuild: 47 } }), runningBuild: 10 },
    ],
    [
      'minimumBuild is ahead of latestBuild — the brick',
      { body: body({ ios: { minimumBuild: 99, latestBuild: 47 } }), runningBuild: 10 },
    ],
    // We do not know what build we are, so we cannot know we are too old.
    ['the running build is not an integer', { runningBuild: 45.5 }],
    ['the running build is NaN', { runningBuild: Number.NaN }],
    ['the running build is zero', { runningBuild: 0 }],
    ['the running build is negative', { runningBuild: -1 }],
  ];

  it.each(cases)('%s', (_label, args) => {
    expect(decide(args)).toEqual({ kind: 'none' });
  });

  it('never throws, whatever it is handed', () => {
    const nasty: unknown[] = [undefined, null, 0, '', [], {}, () => {}, Symbol('x'), new Map()];
    for (const value of nasty) {
      expect(() =>
        decideReleaseGate({
          body: value,
          platform: 'ios',
          runningBuild: 45,
          now: NOW,
        }),
      ).not.toThrow();
    }
  });
});

describe('the message', () => {
  it('is carried through when the server supplies one', () => {
    const gate = decide({
      runningBuild: 10,
      body: body({ message: 'Required to keep booking with card.' }),
    });
    expect(gate).toMatchObject({ kind: 'required', message: 'Required to keep booking with card.' });
  });

  it('is null for an empty or whitespace string, so nothing renders a blank headline', () => {
    expect(decide({ runningBuild: 10, body: body({ message: '   ' }) })).toMatchObject({
      message: null,
    });
    expect(decide({ runningBuild: 10, body: body({ message: 42 }) })).toMatchObject({
      message: null,
    });
  });

  it('leaves storeUrl null rather than handing an empty string to openURL', () => {
    const gate = decide({
      runningBuild: 10,
      body: body({ ios: { minimumBuild: 40, latestBuild: 47, storeUrl: '' } }),
    });
    expect(gate).toMatchObject({ kind: 'required', storeUrl: null });
  });
});

describe('platforms', () => {
  it('reads its OWN platform and ignores the other', () => {
    const mixed = body({
      ios: { minimumBuild: 0, latestBuild: 0, storeUrl: null },
      android: { minimumBuild: 90, latestBuild: 95, storeUrl: 'https://play' },
    });
    expect(decide({ body: mixed, platform: 'ios', runningBuild: 10 }).kind).toBe('none');
    expect(decide({ body: mixed, platform: 'android', runningBuild: 10 }).kind).toBe('required');
  });

  it('treats an all-zero document as no gate', () => {
    // What every studio gets before anyone has set a release. It must be silent, not blocking.
    expect(decide({ body: body({ ios: { minimumBuild: 0, latestBuild: 0 } }) }).kind).toBe('none');
  });
});

describe('the soft prompt is rate limited', () => {
  it('is suppressed within the window for the same build', () => {
    const gate = decide({
      lastSoftPrompt: { latestBuild: 47, shownAt: NOW - 1000 },
    });
    expect(gate.kind).toBe('none');
  });

  it('returns once the window has passed', () => {
    const gate = decide({
      lastSoftPrompt: { latestBuild: 47, shownAt: NOW - SOFT_PROMPT_INTERVAL_MS - 1 },
    });
    expect(gate.kind).toBe('recommended');
  });

  it('speaks up immediately for a NEWER build rather than waiting out the old window', () => {
    // Keyed on the build as well as the time: a fresh release is news even if the previous one
    // was dismissed an hour ago.
    const gate = decide({ lastSoftPrompt: { latestBuild: 46, shownAt: NOW - 1000 } });
    expect(gate.kind).toBe('recommended');
  });

  it('NEVER suppresses a required update', () => {
    // The rate limit belongs to the nudge. A blocked build is blocked.
    const gate = decide({
      runningBuild: 10,
      lastSoftPrompt: { latestBuild: 47, shownAt: NOW },
    });
    expect(gate.kind).toBe('required');
  });

  it('treats a corrupt record as never prompted', () => {
    for (const record of [
      null,
      undefined,
      {} as never,
      { latestBuild: '47', shownAt: NOW } as never,
      { latestBuild: 47, shownAt: 'yesterday' } as never,
      { latestBuild: 47, shownAt: Number.NaN } as never,
    ]) {
      expect(isSoftPromptSuppressed(record, 47, NOW)).toBe(false);
    }
  });

  it('suppresses rather than re-prompts when the device clock moves backwards', () => {
    // shownAt in the "future". The client HAS seen this one; re-prompting on a clock change is
    // exactly the spam the interval exists to prevent.
    expect(isSoftPromptSuppressed({ latestBuild: 47, shownAt: NOW + 60_000 }, 47, NOW)).toBe(true);
  });
});
