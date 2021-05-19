const config = {
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	testMatch: [
		'<rootDir>/packages/**/test/physical-devices/?(*.)+(spec|test).integration.ts',
	],
	moduleDirectories: [
		'packages/*/src',
		'<rootDir>/includes',
		'<rootDir>/node_modules',
		'<rootDir>/*/node_modules',
	],
	moduleFileExtensions: ['js', 'ts', 'node', 'json'],
	moduleNameMapper: {
		'^@radix-javascript/(.*)$': '<rootDir>/packages/$1/src/index.ts',
		'cross-fetch': 'jest-fetch-mock',
	},
	globals: {
		'ts-jest': {
			babelConfig: true,
			tsconfig: './tsconfig.test.json',
		},
	},
	testURL: 'http://localhost',
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
	modulePathIgnorePatterns: [],
}

module.exports = config
