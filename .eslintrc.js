module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: [
			'./packages/*/tsconfig.json',
			'./packages/*/tsconfig.test.json',
		],
	},
	plugins: ['@typescript-eslint', 'jest', 'functional', 'jsdoc'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'plugin:jest/recommended',
		'plugin:jsdoc/recommended',
		'plugin:functional/external-recommended', // https://github.com/jonaskello/eslint-plugin-functional
		'plugin:functional/recommended', // https://github.com/jonaskello/eslint-plugin-functional
		'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
		'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
	],
	env: {
		node: true,
	},
	rules: {
		complexity: ['error', 4],

		'max-depth': ['error', 2],

		'max-lines': [
			'error',
			{
				max: 150,
				skipBlankLines: true,
				skipComments: true,
			},
		],

		'max-lines-per-function': [
			'error',
			{
				max: 50,
				skipBlankLines: true,
				skipComments: true,
				IIFEs: true,
			},
		],

		'max-nested-callbacks': ['error', 3],

		'max-params': ['error', 1],

		'@typescript-eslint/require-await': 'off',

		// ESLint-Plugin-Functional RULES
		'functional/immutable-data': 'error',
		'functional/no-let': 'error',
		'functional/no-loop-statement': 'error',
		'no-param-reassign': 'error',
		'functional/no-try-statement': 'error',

		// ESLint-Plugin-JSDoc RULES
		'jsdoc/check-param-names': 'off',
		'jsdoc/require-param-type': 'off',
		'jsdoc/require-param': 'off',

		'functional/no-expression-statement': 'off',
		'functional/no-conditional-statement': 'off', // we like switch statements
		'functional/no-mixed-type': 'off',
		'functional/functional-parameters': 'off',
		'functional/prefer-readonly-type': 'off', // false positive trigger on `Readonly<>` - which we like.
	},
}
