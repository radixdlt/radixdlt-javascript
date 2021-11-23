const sharedConfig = require('./jest.config.base')
const { compilerOptions } = require('./tsconfig.json')
const { pathsToModuleNameMapper } = require('ts-jest/utils')

module.exports = {
	...sharedConfig,
	testMatch: ['<rootDir>/src/**/test/?(*.)+(spec|test).ts'],
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
	roots: [
    "<rootDir>",
  ],
  modulePaths: [
    "<rootDir>",
  ],
}