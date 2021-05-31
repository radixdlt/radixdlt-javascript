const sharedConfig = require('../../jest.config.base')
module.exports = {
	...sharedConfig,
	testMatch: [
		'<rootDir>/packages/hardware-ledger/test/physical-devices/?(*.)+(spec|test).integration.ts',
	],
}
