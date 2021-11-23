const config = {
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	moduleFileExtensions: ['js', 'ts', 'node', 'json'],
	globals: {
		'ts-jest': {
			babelConfig: true,
			tsconfig: './tsconfig.json',
		},
	},
	testURL: 'http://localhost',
	collectCoverage: true,
	collectCoverageFrom: [
		'<rootDir>/src/*/**.{ts,js}',
		'!**/node_modules/**',
	],
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
	modulePathIgnorePatterns: [],
}

module.exports = config
