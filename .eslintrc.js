/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */
const OFF = 0;
const WARN = 1;
const ERR = 2;

module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: { jsx: true },
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	globals: { chrome: 'readonly' },
	ignorePatterns: ['watch.js', 'dist/**'],
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:@typescript-eslint/recommended',
	],
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	plugins: [
		'react-hooks',
	],
	settings: { react: { version: require('./package.json').dependencies.react } },
	rules: {
		'arrow-spacing': ERR,
		'brace-style': [ERR, '1tbs' ],
		'comma-dangle': [ERR, 'always-multiline'],
		'comma-spacing': ERR,
		'eol-last': ERR,
		'jsx-a11y/alt-text': OFF,
		'jsx-quotes': ERR,
		'key-spacing': ERR,
		'no-multiple-empty-lines': [ERR, {
			max: 1,
			maxEOF: 0,
		}],
		'no-extra-semi': WARN,
		'no-multi-spaces': ERR,
		'no-shadow': OFF,
		'no-trailing-spaces': ERR,
		'object-curly-spacing': [ERR, 'always'],
		'object-property-newline': ERR,
		'prefer-const': ERR,
		'quote-props': [ERR, 'as-needed'],
		'react-hooks/exhaustive-deps': OFF,
		'react/display-name': OFF,
		'react/jsx-no-target-blank': OFF,
		'react/no-unknown-property': [ERR, { ignore: ['jsx'] }],
		'react/prop-types': OFF,
		'react/react-in-jsx-scope': OFF,
		'space-before-blocks': OFF, // favor @typescript-eslint/space-before-blocks
		'space-in-parens': [ERR, 'never'],
		'space-infix-ops': [ERR, { int32Hint: true }],
		indent: OFF,
		quotes: [WARN, 'single'],
		semi: ERR,
		'@next/next/no-img-element': OFF,
		'@typescript-eslint/ban-ts-comment': OFF,
		'@typescript-eslint/explicit-module-boundary-types': OFF,
		'@typescript-eslint/indent': [ERR, 'tab'],
		'@typescript-eslint/no-empty-function': OFF,
		'@typescript-eslint/no-explicit-any': OFF,
		'@typescript-eslint/no-shadow': ERR,
		'@typescript-eslint/no-use-before-define': OFF,
		'@typescript-eslint/space-before-blocks': ERR,
		'object-curly-newline': [ERR, {
			ObjectExpression: {
				multiline: true,
				minProperties: 2,
			},
			ObjectPattern: {
				multiline: true,
				minProperties: 2,
			},
			ImportDeclaration: {
				multiline: true,
				minProperties: 3,
			},
			ExportDeclaration: {
				multiline: true,
				minProperties: 3,
			},
		}],
	},
};
