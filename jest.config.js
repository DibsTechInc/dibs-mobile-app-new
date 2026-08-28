/**
 * Pure-TypeScript tests only (Node env, no React Native runtime).
 *
 * Covers:
 *   src/domain  — business logic ported from the widget
 *   src/theme   — colour maths (deliberately RN-free so it also runs at build time)
 *   src/api     — client, error normalization, zod schemas (RN-free, fetch is injected)
 *   whitelabel  — per-studio config + asset validation, enforced in CI
 *   src/components/__tests__ — SOURCE-READING GUARDS ONLY (see below)
 *
 * RN component tests will get a separate jest-expo project when UI work starts; keep every
 * file matched by these roots free of React Native imports until then.
 *
 * ── Why `src/components/__tests__` is a root despite that ──────────────────────────────────────
 * Some component contracts are structural rather than visual, and the regression to fear is a
 * plausible-looking simplification rather than a wrong pixel — `Sheet.tsx` driving its Modal from
 * `visible` instead of its own mount state, which silently deletes the exit animation of every
 * sheet in the app. Those are checked by READING THE SOURCE AS TEXT, so they need no RN runtime
 * and honour the rule above. A test in here that `import`s a component is in the wrong project
 * and will fail on the first RN module it touches — that is the constraint working, not a bug.
 *
 * ONE deliberate exception: `src/api/index.ts` wires the live client and therefore imports
 * `@/config/studio` (expo-constants). Nothing in these roots may import it — everything else
 * under src/api takes its dependencies as arguments precisely so it stays testable here.
 */
module.exports = {
  testEnvironment: 'node',
  roots: [
    '<rootDir>/src/domain',
    '<rootDir>/src/theme',
    '<rootDir>/src/api',
    '<rootDir>/whitelabel',
    '<rootDir>/src/components/__tests__',
  ],
  // The same `@/*` alias the app and tsconfig use. Without it a domain module could not name an
  // API schema without a `../../..` chain, and the depth is what makes people copy types instead
  // of importing them.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};
