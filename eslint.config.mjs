import js from '@eslint/js';
import astro from 'eslint-plugin-astro';

/**
 * ESLint configuration for PhysicURL.
 *
 * Scope:
 *   ✅ JS / JSX files — full linting with browser globals & React JSX support.
 *   ⏭  TypeScript files (.ts/.tsx) — skipped; `npm run typecheck` (tsc --noEmit)
 *      handles type correctness. @typescript-eslint/parser is not installed.
 *   ⏭  Astro files (.astro) — frontmatter contains TypeScript; skipped for the
 *      same reason. Astro's compiler type-checks frontmatter at build time.
 *
 * To lint Astro/TS files properly, install:
 *   npm i -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
 * and add the appropriate config blocks below.
 */

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    // Exclude files whose syntax ESLint cannot parse without optional deps
    ignores: ['**/*.ts', '**/*.tsx', '**/*.astro'],
  },

  js.configs.recommended,

  {
    // JS/JSX React components and utility modules — browser runtime
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        confirm: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        console: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          // Ignore: _ prefixed vars AND PascalCase names (React components used
          // in JSX that ESLint can't detect as "used" without eslint-plugin-react)
          varsIgnorePattern: '^(_|[A-Z])',
          ignoreRestSiblings: true,
        },
      ],
      'no-undef': 'warn',
      'eqeqeq': ['warn', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Intentionally empty catch blocks are acceptable (fire-and-forget fetches)
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // Keep Astro configs registered (type info, etc.) but its parsing rules are
  // effectively moot since .astro files are in ignores above.
  ...astro.configs.recommended,
];