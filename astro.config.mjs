// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { boundAnimationLoops } from './src/build/bound-animation-loops.ts';
import { pruneOrphanAssets } from './src/build/prune-orphan-assets.ts';
import { sitemapPages } from './src/build/sitemap-pages.ts';
import { defaultLocale, locales } from './src/i18n/ui.ts';
import { SITEMAP_XSL } from './src/seo/sitemap/files.ts';
import { git } from './src/seo/sitemap/git.ts';
import { createLastmod } from './src/seo/sitemap/lastmod.ts';
import { createSerialize } from './src/seo/sitemap/links.ts';
import { sourcesOf } from './src/seo/sitemap/sources.ts';
import { SITE } from './src/site.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',

  /* Public by nature — it ships in the page — but injected from a repository
     secret, never committed. Optional: unset, no tag is rendered at all. */
  env: {
    schema: {
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },

  /**
   * IBM Plex Sans and Mono share metrics exactly — same x-height, cap
   * height and digit width — so mono sits on the same lines as the
   * prose around it. What differs is the advance: every mono glyph takes
   * a full cell, so a run of it carries more ink. Inline `<code>` and
   * mono lists step down slightly for that, not for height (theme.css).
   *
   * `latin` covers every Spanish character; `latin-ext` would nearly
   * double the weight for nothing.
   */
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Sans',
      cssVariable: '--font-plex-sans',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],

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
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },

  integrations: [
    boundAnimationLoops(),
    pruneOrphanAssets(),
    sitemap({
      xslURL: `/${SITEMAP_XSL}`,
      namespaces: { news: false, image: false, video: false, xhtml: true },
      serialize: createSerialize(createLastmod(git, sourcesOf)),
    }),
    sitemapPages(SITE),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
