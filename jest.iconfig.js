const baseConfig = require('./jest.config');
module.exports = {
  ...baseConfig,
  moduleNameMapper: {
    '^@radix-javascript/(.*)$': '<rootDir>/packages/radix-$1/src/index.ts',
    'cross-fetch': 'jest-fetch-mock',
  },
  setupFilesAfterEnv: ['<rootDir>/jest-framework-setup.js'],
  testMatch: ['<rootDir>/packages/**/test/*.ispec.ts'],
};