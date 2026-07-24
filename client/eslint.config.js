import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    plugins: { react },
    extends: [
      js.configs.recommended,
      // react-hooks 5.2 exposes its flat config as 'recommended-latest'
      // (the older `.configs.flat.recommended` path was removed).
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Mark JSX-referenced identifiers (incl. <motion.div>) as used so
      // no-unused-vars doesn't flag component/namespace imports.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off', // React 19 automatic JSX runtime
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Context files intentionally co-locate a Provider component with their
    // hook — fast-refresh's component-only-export rule doesn't apply.
    files: ['src/context/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
