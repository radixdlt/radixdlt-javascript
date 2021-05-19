const sharedConfig = require('../../jest.config.base')
module.exports = {
	...sharedConfig,
	testMatch: [
		'<rootDir>/packages/application/test/physical-devices/?(*.)+(spec|test).integration.ts',
	],
}
