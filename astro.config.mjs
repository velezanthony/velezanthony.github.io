// @ts-check
import { defineConfig } from 'astro/config';

import { docs } from '@velezanthony/design/integration';

import docsConfig from './docs.config.mjs';
import { defaultLocale, locales } from './src/core/i18n/locales.ts';
import { SITE } from './src/site.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',

  /* Spanish is unprefixed: the root is the URL people paste, so it serves the
     home rather than redirecting to it. GitHub Pages has no 301. */
  i18n: {
    defaultLocale,
    locales: [...locales],
    routing: { prefixDefaultLocale: false },
  },

  /* Markdown images shipped the full-size file with an empty `srcset`.
     `constrained` makes every image responsive, including the ones the
     Markdown pipeline emits. */
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },

  markdown: {
    /**
     * No rehype plugin here on purpose. Astro 7 defaults to Sätteri, and
     * `rehypePlugins` would drag the whole unified processor back in as a
     * dependency. External links in Markdown bodies are written as plain
     * anchors instead — there are four of them.
     */
    /* The library's `docs()` sets the code themes; this only keeps long lines unwrapped. */
    shikiConfig: { wrap: false },
  },

  integrations: [docs(docsConfig)],
});
