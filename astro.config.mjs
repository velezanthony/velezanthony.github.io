// @ts-check
import { defineConfig } from 'astro/config';

import { docs } from '@velezanthony/design/integration';

import { boundAnimationLoops } from './src/build/bound-animation-loops.ts';
import { pruneOrphanAssets } from './src/build/prune-orphan-assets.ts';
import docsConfig from './docs.config.mjs';
import { defaultLocale, locales } from './src/i18n/ui.ts';
import { SITE } from './src/site.ts';
import { codeThemes } from './src/styles/code-themes.ts';

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
    shikiConfig: {
      themes: codeThemes,
      wrap: false,
    },
  },

  integrations: [boundAnimationLoops(), pruneOrphanAssets(), docs(docsConfig)],
});
