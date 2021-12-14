const sharedConfig = require('./jest.config.base')
module.exports = {
	...sharedConfig,
	testMatch: [
		'<rootDir>/src/**/test/integration-tests/?(*.)+(spec|test).integration.ts',
	],
}
