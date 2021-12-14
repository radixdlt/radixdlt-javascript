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
	collectCoverage: false,
	collectCoverageFrom: ['<rootDir>/src/*/**.{ts,js}', '!**/node_modules/**'],
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
	modulePathIgnorePatterns: [],
	moduleNameMapper: {
		'@account': '<rootDir>/src/account',
		'@account': '<rootDir>/src/account',
		'@application': '<rootDir>/src/application',
		'@crypto': '<rootDir>/src/crypto',
		'@data-formats': '<rootDir>/src/data-formats',
		'@hardware-ledger': '<rootDir>/src/hardware-ledger',
		'@hardware-wallet': '<rootDir>/src/hardware-wallet',
		'@networking': '<rootDir>/src/networking',
		'@primitives': '<rootDir>/src/primitives',
		'@tx-parser': '<rootDir>/src/tx-parser',
		'@util': '<rootDir>/src/util',
	},
}

module.exports = config
