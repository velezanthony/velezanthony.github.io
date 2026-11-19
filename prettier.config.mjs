// @ts-check

/** @type {import('prettier').Config} */
export default {
  /* Tailwind's plugin must load last: it wraps the other parsers. */
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
  /* The width the hand-wrapped comments were already written to. */
  printWidth: 100,
  singleQuote: true,
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],

  /* The library's stylesheet: it owns Tailwind and the tokens, and the portfolio's own are not in its tree. */
  tailwindStylesheet: './node_modules/@velezanthony/design/src/components/styles/theme.css',
};
