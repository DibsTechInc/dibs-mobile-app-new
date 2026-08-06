/**
 * Pure-TypeScript tests only (Node env, no React Native runtime).
 *
 * Covers:
 *   src/domain  — business logic ported from the widget
 *   src/theme   — colour maths (deliberately RN-free so it also runs at build time)
 *   src/api     — client, error normalization, zod schemas (RN-free, fetch is injected)
 *   whitelabel  — per-studio config + asset validation, enforced in CI
 *
 * RN component tests will get a separate jest-expo project when UI work starts; keep every
 * file matched by these roots free of React Native imports until then.
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
