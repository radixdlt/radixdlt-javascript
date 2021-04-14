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
		complexity: ['error', 5],

		'max-depth': ['error', 3],

		'max-lines': [
			'error',
			{
				max: 200,
				skipBlankLines: true,
				skipComments: true,
			},
		],

		'max-lines-per-function': 'off',

		'max-nested-callbacks': ['error', 3],

		'max-params': ['error', 1],

		'@typescript-eslint/no-unused-vars': [
			'warn',
			{ argsIgnorePattern: '^_' },
		],

		'@typescript-eslint/require-await': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',

		'@typescript-eslint/no-inferrable-types': 'off',

		// ESLint-Plugin-Functional RULES
		'functional/immutable-data': 'error',
		'functional/no-let': 'off',
		'functional/no-loop-statement': 'off',
		'no-param-reassign': 'error',
		'functional/no-try-statement': 'off',
		'jsdoc/require-returns': 'off',

		// ESLint-Plugin-JSDoc RULES
		'jsdoc/check-param-names': 'off',
		'jsdoc/require-param-type': 'off',
		'jsdoc/require-param': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'jsdoc/require-returns-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',

		'functional/no-expression-statement': 'off',
		'functional/no-conditional-statement': 'off', // we like switch statements
		'functional/no-mixed-type': 'off',
		'functional/functional-parameters': 'off',
		'functional/prefer-readonly-type': 'off', // false positive trigger on `Readonly<>` - which we like.
		'jest/no-export': 'off',
		'functional/no-return-void': 'off',
		'max-params': 'off',
		'functional/no-throw-statement': 'off',
		complexity: 'off',
		'functional/immutable-data': 'off',
		'@typescript-eslint/no-unsafe-return': 'warn',
		'@typescript-eslint/no-unsafe-member-access': 'warn',
		'max-lines': 'off',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'@typescript-eslint/no-namespace': 'off',
		'functional/no-this-expression': 'off',
	},
}
