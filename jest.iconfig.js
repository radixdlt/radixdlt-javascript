const baseConfig = require('./jest.config')
module.exports = {
	...baseConfig,
	moduleNameMapper: {
		'cross-fetch': 'jest-fetch-mock',
	},
	setupFilesAfterEnv: ['<rootDir>/jest-framework-setup.js'],
	testMatch: ['<rootDir>/packages/**/test/*.ispec.ts'],
}
