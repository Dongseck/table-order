import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10_000,
};

export default config;
