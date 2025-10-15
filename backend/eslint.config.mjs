import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ['dist', 'node_modules'],
    },
    {
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: false,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            // điều chỉnh quy tắc tối thiểu cho NestJS
            'no-console': 'off',
        },
    }
);


