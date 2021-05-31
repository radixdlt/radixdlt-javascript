const sharedConfig = require('../../jest.config.base')
module.exports = {
	...sharedConfig,
	testMatch: [
		'<rootDir>/packages/hw-ledger-transport/test/physical-devices/?(*.)+(spec|test).integration.ts',
	],
}
