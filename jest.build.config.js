const config = {
	browser: true,
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	testMatch: ['<rootDir>/packages/**/test/?(*.)+(spec|test).ts'],
	moduleDirectories: [
		'<rootDir>/includes',
		'<rootDir>/node_modules',
		'<rootDir>/*/node_modules',
	],
	moduleFileExtensions: ['js', 'ts', 'node', 'json'],
	globals: {
		'ts-jest': {
			babelConfig: true,
			tsconfig: './tsconfig.test.json',
		},
	},
	testURL: 'http://localhost',
	setupFiles: ['<rootDir>/jest-setup.js'],
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
}

module.exports = config
