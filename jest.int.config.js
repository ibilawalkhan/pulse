/** Integration tests — spin up real Postgres via testcontainers. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/apps', '<rootDir>/packages'],
  testMatch: ['**/*.int-spec.ts'],
  testTimeout: 60000,
  moduleNameMapper: {
    '^@pulse/shared(.*)$': '<rootDir>/packages/shared/src$1',
    '^@pulse/db(.*)$': '<rootDir>/packages/db/src$1',
  },
};
