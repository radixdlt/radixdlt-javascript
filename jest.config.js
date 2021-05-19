const sharedConfig = require('./jest.config.base')
module.exports = {
	...sharedConfig,
	testMatch: ['<rootDir>/packages/**/test/?(*.)+(spec|test).ts'],
}
