// @ts-check
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/* No typed linting: `astro check` already owns types, and the parser has to write a `.tsx`
   per `.astro` file to type-check one. */
export default defineConfig(
  { ignores: ['dist/', '.astro/'] },

  js.configs.recommended,
  tseslint.configs.recommended,
  /* Sets the Astro parser, TypeScript inside it and the client `<script>` processor. */
  astro.configs.recommended,
  /* Resolves to `eslint-plugin-jsx-a11y-x`: the original plugin stops at ESLint 9. */
  astro.configs['jsx-a11y-recommended'],

  { languageOptions: { globals: { ...globals.node } } },
  { files: ['**/*.astro'], languageOptions: { globals: { ...globals.browser } } },

  /* Layers, as in doc/architecture.md: each one imports only what sits below it. */
  {
    files: ['src/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['astro', 'astro/*', 'astro:*', 'virtual:*'],
              message: 'core/ is pure: no Astro.',
            },
            {
              group: ['@/data/**', '@/adapters/**', '@/ui/**', '@/pages/**', '@/client/**'],
              message: 'core/ imports no other layer: what it needs arrives as a parameter.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/data/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/adapters/**', '@/ui/**', '@/pages/**'],
              message: 'data/ is content: it knows no network, markup or routes.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/adapters/**'],
              message: 'ui/ is presentation: pages hand it the data.',
            },
          ],
        },
      ],
    },
  },

  /* Last, so formatting is Prettier's call alone. */
  prettier,
);
