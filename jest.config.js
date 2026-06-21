/** Unit tests across all workspaces. Integration tests live in jest.int.config.js. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/apps', '<rootDir>/packages'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@pulse/shared(.*)$': '<rootDir>/packages/shared/src$1',
    '^@pulse/db(.*)$': '<rootDir>/packages/db/src$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }],
  },
  collectCoverageFrom: ['apps/**/*.ts', 'packages/**/*.ts', '!**/*.spec.ts', '!**/main.ts'],
};
