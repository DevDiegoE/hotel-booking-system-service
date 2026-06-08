import tseslint from 'typescript-eslint';
import js from '@eslint/js';

export default [
    {
        ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'jest.config.cjs'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
];
