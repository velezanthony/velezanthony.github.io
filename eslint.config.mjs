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

  /* Last, so formatting is Prettier's call alone. */
  prettier,
);
