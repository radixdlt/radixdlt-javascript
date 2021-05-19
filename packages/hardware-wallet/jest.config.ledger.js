const sharedConfig = require('../../jest.config.base')
module.exports = {
	...sharedConfig,
	testMatch: [
		'<rootDir>/packages/hardware-wallet/test/physical-devices/?(*.)+(spec|test).integration.ts',
	],
}
