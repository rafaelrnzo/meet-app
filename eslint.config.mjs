import js from '@eslint/js'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import pluginNext from '@next/eslint-plugin-next'
import path from 'path'
import { fileURLToPath } from 'url'
import { preferDefaultAsNamed, preferNamedExportRule } from './rules/index.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
  // =======================================================
  // 1. Ignores
  // =======================================================
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'rules/**',
      'next-env.d.ts',
      'eslint.config.{js,ts,mjs}',
      'public/**',
      'mock-module.js',
    ],
  },

  // =======================================================
  // 2. Base JS Rules
  // =======================================================
  js.configs.recommended,

  // =======================================================
  // 3. React + TypeScript setup
  // =======================================================
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: [path.resolve(__dirname, './tsconfig.json')],
        tsconfigRootDir: __dirname,
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      '@next/next': pluginNext,
      custom: {
        rules: {
          'prefer-default-as-named': preferDefaultAsNamed,
          'prefer-named-export': preferNamedExportRule,
        },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: path.resolve(__dirname, './tsconfig.json'),
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },

    // =======================================================
    // 4. Rules
    // =======================================================
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...tsPlugin.configs['stylistic-type-checked'].rules,

      // Custom
      'custom/prefer-default-as-named': 'off',
      'custom/prefer-named-export': 'off',

      // Next
      '@next/next/no-img-element': 'off',

      // Import
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',
      'import/consistent-type-specifier-style': ['warn', 'prefer-top-level'],
      'import/order': 'off',

      // TS Rules
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-empty-function': 'warn',

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'no-empty': 'off',
    },
  },
]
