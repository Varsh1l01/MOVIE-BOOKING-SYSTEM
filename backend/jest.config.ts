import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  // Ignore dist and node_modules
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // Set env vars for tests
  setupFiles: ['<rootDir>/src/test-setup.ts'],
};

export default config;
