// @ts-check

/** @type {import('prettier').Config} */
export default {
  /* Tailwind's plugin must load last: it wraps the other parsers. */
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
  /* The width the hand-wrapped comments were already written to. */
  printWidth: 100,
  singleQuote: true,
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],

  /* The stylesheet that defines `@theme` and the custom utilities, so they sort as Tailwind's own. */
  tailwindStylesheet: './src/styles/theme.css',
};
