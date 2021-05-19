const sharedConfig = require('../../jest.config.base')
module.exports = {
	...sharedConfig,
	testMatch: [
		'<rootDir>/packages/account/test/physical-devices/?(*.)+(spec|test).integration.ts',
	],
}
