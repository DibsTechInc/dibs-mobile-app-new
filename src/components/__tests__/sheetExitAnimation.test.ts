/**
 * The Sheet's exit animation must survive refactors.
 *
 * ── Why this is a SOURCE test and not a render test ────────────────────────────────────────────
 * This repo has no React Native render tooling on purpose (every one of its suites is pure
 * logic), and even with it the assertion would be hollow: the slide runs on the native driver,
 * which a JS test environment does not execute. There is nothing meaningful to measure.
 *
 * What CAN be checked is the structural fact the bug came down to. `<Modal visible={visible}>`
 * unmounts on the frame the prop flips, taking the view that was mid-animation with it — so the
 * exit is started and instantly discarded, and every sheet in the app shuts with a hard cut.
 * Reported on device 2026-08-28 ("the transitions felt abrupt" after a credit purchase). The
 * ENTER animation is unaffected, which is exactly why it went unnoticed.
 *
 * The regression to fear is somebody tidying `visible={mounted}` back to `visible={visible}` —
 * it reads like a redundant indirection right up until you watch a sheet close. Same shape as
 * the dashboard route-gating guard in dibs-api: a source-reading test aimed at a plausible
 * simplification.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = readFileSync(join(__dirname, '..', 'Sheet.tsx'), 'utf8');

/** Strip comments so prose about `visible={visible}` can never satisfy or trip an assertion. */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('the Modal outlives `visible`', () => {
  it('does NOT drive the Modal directly from the visible prop', () => {
    // The bug, verbatim. If this matches, every sheet in the app has stopped animating closed.
    expect(CODE).not.toMatch(/<Modal[\s\S]{0,200}?visible=\{visible\}/);
  });

  it('drives the Modal from a separate mount state', () => {
    expect(CODE).toMatch(/<Modal[\s\S]{0,200}?visible=\{mounted\}/);
    expect(CODE).toMatch(/setMounted/);
  });

  it('ends the mount from the animation completion, not from the prop', () => {
    // `setMounted(false)` must sit inside the start() callback and behind a `finished` check —
    // unmounting on the prop change is the original bug, and unmounting without checking
    // `finished` would tear down a sheet whose close was interrupted by a re-open.
    expect(CODE).toMatch(/\.start\(\s*\(\{\s*finished\s*\}\)\s*=>/);
    expect(CODE).toMatch(/finished\s*&&\s*!visible[\s\S]{0,40}setMounted\(false\)/);
  });

  it('opens immediately rather than waiting for an animation', () => {
    // Opening must not be deferred — a sheet that waits to mount is a tap with no response.
    expect(CODE).toMatch(/if\s*\(visible\)\s*setMounted\(true\)/);
  });
});

describe('the exit is actually animated', () => {
  it('animates toward 0 when closing', () => {
    expect(CODE).toMatch(/toValue:\s*visible\s*\?\s*1\s*:\s*0/);
  });

  it('reduce-motion SHORTENS the transition rather than removing it', () => {
    // Per the design system: a sheet still has to read as arriving from and leaving toward
    // somewhere, or its origin stops being legible. Cutting to duration 0 is not the answer.
    expect(CODE).toMatch(/reduced\s*\?\s*theme\.motion\.instant\s*:\s*theme\.motion\.base/);
    expect(CODE).not.toMatch(/duration:\s*reduced\s*\?\s*0/);
  });

  it('stops the animation on cleanup so a stale callback cannot unmount a live sheet', () => {
    expect(CODE).toMatch(/return\s*\(\)\s*=>\s*animation\.stop\(\)/);
  });
});
