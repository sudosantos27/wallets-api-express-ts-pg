// Flat Config for ESLint v9 — Node + TypeScript + Prettier

const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const unusedImports = require('eslint-plugin-unused-imports');
const configPrettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  // 1) Global ignores (replaces .eslintignore)
  {
    ignores: ['node_modules', 'dist', 'coverage', '.prisma', 'prisma/migrations'],
  },

  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // 2) Base JS recommended rules (Flat)
  js.configs.recommended,

  // 3) TypeScript rules (Flat): define parser + plugins + rules explícitos
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        // Para reglas type-aware en el futuro:
        // project: ['./tsconfig.json'],
        // tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.js', '.ts'] },
        typescript: true,
      },
    },
    rules: {
      // Unused imports/vars
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      // Import hygiene
      'import/first': 'error',
      'import/newline-after-import': 'error',

      // Backend ergonomics
      'no-console': 'off',
    },
  },

  // 4) Disable rules that conflict with Prettier (Flat-friendly)
  configPrettier,
];
