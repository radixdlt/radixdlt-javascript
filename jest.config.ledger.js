const sharedConfig = require('./jest.config.base')
module.exports = {
  ...sharedConfig,
  testMatch: [
    '<rootDir>/src/hardware-ledger/test/?(*.)+(spec|test).integration.ts',
  ],
}
