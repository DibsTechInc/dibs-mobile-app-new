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
 */
module.exports = {
  testEnvironment: 'node',
  roots: [
    '<rootDir>/src/domain',
    '<rootDir>/src/theme',
    '<rootDir>/src/api',
    '<rootDir>/whitelabel',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};
