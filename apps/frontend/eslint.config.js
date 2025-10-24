// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

export default [{
  ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
}, js.configs.recommended, ...tseslint.configs.recommended, {
  files: ['**/*.{js,jsx,ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    globals: {
      ...globals.browser,
      ...globals.es2022,
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      project: ['./tsconfig.json', './tsconfig.app.json'],
    },
  },
  plugins: {
    react,
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
    'jsx-a11y': jsxA11y,
    import: importPlugin,
  },
  rules: {
    // Airbnb-inspired rules
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.{js,jsx,ts,tsx}',
          '**/*.spec.{js,jsx,ts,tsx}',
          '**/vite.config.ts',
          '**/tailwind.config.js',
          '**/postcss.config.js',
          '**/src/providers/**',
        ],
        packageDir: ['./', '../../'],
      },
    ],
    
    // React rules (Airbnb-based)
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-filename-extension': [
      'error',
      { extensions: ['.jsx', '.tsx'] },
    ],
    'react/jsx-props-no-spreading': 'off',
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/require-default-props': 'off',
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-curly-brace-presence': [
      'error',
      { props: 'never', children: 'never' },
    ],
    
    // React Hooks rules
    ...reactHooks.configs.recommended.rules,
    
    // React Refresh rules
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    
    // Accessibility rules
    ...jsxA11y.configs.recommended.rules,
    
    // General rules (Airbnb-inspired)
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-unused-vars': 'off', // Handled by TypeScript
    'no-use-before-define': 'off',
    'no-shadow': 'off',
    'no-param-reassign': ['error', { props: false }],
    'prefer-destructuring': [
      'error',
      {
        array: true,
        object: true,
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-use-before-define': ['error'],
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json', './tsconfig.app.json'],
      },
    },
  },
}, ...storybook.configs["flat/recommended"]];
