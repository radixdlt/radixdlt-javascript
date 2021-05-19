const sharedConfig = require('./jest.config.base')
module.exports = {
	...sharedConfig,
	testMatch: [
		'<rootDir>/packages/**/test/integration-tests/?(*.)+(spec|test).integration.ts',
	],
}
