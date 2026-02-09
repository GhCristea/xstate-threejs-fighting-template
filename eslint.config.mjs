// @ts-check
import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nounsanitized from 'eslint-plugin-no-unsanitized'
import pluginPromise from 'eslint-plugin-promise'
import prettier from 'eslint-plugin-prettier/recommended'

/** @type {import("eslint").Linter.FlatConfig} */
const promiseRecommended =
  // @ts-expect-error plugin doesn't publish typed `configs`
  pluginPromise.configs['flat/recommended']

/** @type {import("eslint").Linter.FlatConfig} */
const noUnsanitizedRecommended =
  // @ts-expect-error plugin doesn't publish typed `configs`
  nounsanitized.configs.recommended

export default defineConfig([
  { ignores: ['**/*.config.*', '**/*.test.ts'] },
  prettier,
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  promiseRecommended,
  noUnsanitizedRecommended,
  {
    files: ['**/*.{ts,js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { project: './tsconfig.eslint.json', tsconfigRootDir: import.meta.dirname }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off'
    }
  }
])
