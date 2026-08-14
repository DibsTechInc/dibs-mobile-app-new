/**
 * Should this build be blocked, nudged, or left alone?
 *
 * PURE TypeScript. The whole decision lives here so it can be exercised without a device, and so
 * the one rule that matters is written once.
 *
 * ── FAIL OPEN. This is the rule, and it is the one that gets optimised away ──────────────────
 * Network error, non-200, malformed body, missing platform key, a build number that is not a
 * positive integer, `minimumBuild` arriving as the STRING "42" — every one of those is
 * `{ kind: 'none' }`. Bricking a working app because a server hiccupped is strictly worse than
 * one more session on an old build, and unlike a bad release there is no way out of it: a blocked
 * client cannot use the app to tell anyone the block is wrong.
 *
 * Only a well-formed response with an integer `minimumBuild` above the running build blocks.
 *
 * ── Integers, never version strings ─────────────────────────────────────────────────────────
 * `"1.10.0" < "1.9.0"` is true in a lexical comparison. A gate built on version strings ships
 * inverted and blocks everybody, which is why nothing here parses a dotted string.
 */

/** Raw, untrusted: whatever the endpoint actually returned. */
export type AppReleaseBody = unknown;

export type ReleaseGate =
  | { kind: 'none' }
  | { kind: 'recommended'; latestBuild: number; storeUrl: string | null; message: string | null }
  | { kind: 'required'; minimumBuild: number; storeUrl: string | null; message: string | null };

export type GatePlatform = 'ios' | 'android';

/** When the soft prompt was last shown, and for which build. Persisted; may be anything on read. */
export interface SoftPromptRecord {
  latestBuild: number;
  shownAt: number;
}

/**
 * How long a dismissed "should update" stays dismissed.
 *
 * Not a nicety. A prompt on every cold start reads as spam and gets the app deleted, which is the
 * opposite of what a soft prompt is for. Keyed by `latestBuild` as well as time, so a genuinely
 * new release can speak up immediately instead of waiting out the previous one's window.
 */
export const SOFT_PROMPT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * An integer, and nothing that merely looks like one.
 *
 * `Number('42')` is 42, and accepting that would let a hand-typed row block real clients. The
 * server applies the same rule to the row; both sides refusing is what makes "only a well-formed
 * integer blocks" true end to end rather than on one side of the wire.
 */
function readBuild(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

function readText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  // Never render an empty string as a headline or hand it to Linking.openURL.
  return trimmed.length > 0 ? trimmed : null;
}

interface PlatformDocument {
  minimumBuild: number;
  latestBuild: number;
  storeUrl: string | null;
}

/** Returns null when this platform's block is absent or unusable — which means no gate. */
function readPlatform(body: AppReleaseBody, platform: GatePlatform): PlatformDocument | null {
  if (typeof body !== 'object' || body === null) return null;

  const block = (body as Record<string, unknown>)[platform];
  if (typeof block !== 'object' || block === null) return null;

  const record = block as Record<string, unknown>;
  const minimumBuild = readBuild(record.minimumBuild);
  const latestBuild = readBuild(record.latestBuild);

  // A missing or malformed EITHER is no gate. Reading one and defaulting the other would let a
  // half-written row decide something.
  if (minimumBuild === null || latestBuild === null) return null;

  return { minimumBuild, latestBuild, storeUrl: readText(record.storeUrl) };
}

export interface DecideGateArgs {
  /** The parsed response body, or null when the request failed for any reason at all. */
  body: AppReleaseBody | null;
  platform: GatePlatform;
  /** This build's integer identity, from `studio.buildNumber`. */
  runningBuild: number;
  now: number;
  /** Last soft prompt, from storage. Anything unparseable is treated as "never prompted". */
  lastSoftPrompt?: SoftPromptRecord | null;
}

export function decideReleaseGate({
  body,
  platform,
  runningBuild,
  now,
  lastSoftPrompt = null,
}: DecideGateArgs): ReleaseGate {
  // We do not know what build we are. Comparing against a guess could block everybody.
  const running = readBuild(runningBuild);
  if (running === null || running <= 0) return { kind: 'none' };

  const document = readPlatform(body, platform);
  if (!document) return { kind: 'none' };

  const { minimumBuild, latestBuild, storeUrl } = document;
  const message = readText(
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>).message : null,
  );

  // A minimum ahead of the latest would force an update to a build that does not exist. The
  // server refuses to serve it and the DB refuses to store it; refusing to ACT on it is the third
  // lock, and the only one running on the device that would actually be bricked.
  if (minimumBuild > latestBuild) return { kind: 'none' };

  if (running < minimumBuild) {
    return { kind: 'required', minimumBuild, storeUrl, message };
  }

  if (running < latestBuild && !isSoftPromptSuppressed(lastSoftPrompt, latestBuild, now)) {
    return { kind: 'recommended', latestBuild, storeUrl, message };
  }

  return { kind: 'none' };
}

/**
 * Has this exact build already been suggested recently?
 *
 * Deliberately tolerant: a record from a future clock, a corrupted blob, a negative timestamp all
 * read as "not suppressed". Getting this wrong shows one extra prompt; getting it wrong the other
 * way silences a real recommendation forever.
 */
export function isSoftPromptSuppressed(
  record: SoftPromptRecord | null | undefined,
  latestBuild: number,
  now: number,
): boolean {
  if (!record || typeof record !== 'object') return false;

  const build = readBuild((record as SoftPromptRecord).latestBuild);
  const shownAt = (record as SoftPromptRecord).shownAt;

  if (build === null || build !== latestBuild) return false;
  if (typeof shownAt !== 'number' || !Number.isFinite(shownAt)) return false;

  const elapsed = now - shownAt;
  // A negative elapsed means the device clock moved backwards. Suppress rather than prompt: the
  // client HAS been shown this one, and re-prompting on a clock change is the spam the interval
  // exists to prevent.
  if (elapsed < 0) return true;

  return elapsed < SOFT_PROMPT_INTERVAL_MS;
}
