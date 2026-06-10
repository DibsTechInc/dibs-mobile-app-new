/**
 * Domain tests only (pure TS, runs in Node, no React Native).
 * RN component tests will get a separate jest-expo project when UI work starts.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/domain'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};
