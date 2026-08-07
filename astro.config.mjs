// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import { globSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';

import sitemap from '@astrojs/sitemap';
import { routes } from './src/i18n/ui.ts';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://velezanthony.github.io',
  output: 'static',
  trailingSlash: 'always',

  /**
   * IBM Plex Sans and Mono share metrics exactly — same x-height, cap
   * height and digit width. Inline `<code>` therefore needs no size
   * correction against surrounding prose, which matters on a site made
   * of paths, module names and type signatures.
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

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: true },
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
    /* Sharp drops the source GIF's loop count and re-encodes every animated
       WebP as infinite. A demo that never stops is motion the visitor cannot
       escape (WCAG 2.2.2), so the RIFF `ANIM` loop field is rewritten to one
       pass once the assets are on disk. No checksum to invalidate. */
    {
      name: 'bound-animation-loops',
      hooks: {
        'astro:build:done': ({ dir, logger }) => {
          let patched = 0;
          for (const file of globSync('**/*.webp', { cwd: dir, withFileTypes: false })) {
            const path = new URL(file, dir);
            const buf = readFileSync(path);
            const at = buf.indexOf('ANIM');
            if (at === -1 || buf.readUInt16LE(at + 12) !== 0) continue;
            buf.writeUInt16LE(1, at + 12);
            writeFileSync(path, buf);
            patched++;
          }
          if (patched) logger.info(`bounded ${patched} looping animation(s)`);
        },
      },
    },

    /* A content-collection image referenced from both a `<Image>` and a
       Markdown body gets its ORIGINAL copied into `_astro/` alongside the
       derivatives, even though nothing links to it. Every built text file is
       scanned before anything is removed, so an asset reached only from CSS
       or a script survives. */
    {
      name: 'prune-orphan-assets',
      hooks: {
        'astro:build:done': ({ dir, logger }) => {
          const text = globSync('**/*.{html,css,js,xml,txt,json}', { cwd: dir })
            .map((f) => readFileSync(new URL(f, dir), 'utf8'))
            .join('\n');

          let freed = 0;
          for (const file of globSync('_astro/*.{png,jpg,jpeg,webp,avif,gif,svg}', { cwd: dir })) {
            const name = file.split('/').pop();
            if (!name || text.includes(name)) continue;
            const path = new URL(file, dir);
            freed += statSync(path).size;
            rmSync(path);
          }
          if (freed) logger.info(`pruned ${Math.round(freed / 1024)} KB of unreferenced assets`);
        },
      },
    },

    sitemap({
      /* The root is a redirect that canonicalises to `/es/`. Listing it
         would offer Google a URL it is told not to index. */
      filter: (page) => page !== 'https://velezanthony.github.io/',

      /* The built-in `i18n` option pairs locales by identical path, so it
         matched only `/es/cv/` ↔ `/en/cv/` and left the 14 URLs with a
         translated segment without alternates. This walks the same route
         map the pages use. */
      serialize(item) {
        const url = new URL(item.url);
        const parts = url.pathname.split('/').filter(Boolean);
        const locale = parts[0];
        if (locale !== 'es' && locale !== 'en') return item;

        const rest = parts.slice(1);
        const other = locale === 'es' ? 'en' : 'es';
        const map = /** @type {Record<string, Record<string, string>>} */ (routes);

        const translated = rest.map((seg) => {
          const key = Object.keys(map).find((k) => map[k][locale] === seg);
          return key ? map[key][other] : seg;
        });

        /** @type {(loc: string, segs: string[]) => string} */
        const href = (loc, segs) => new URL([loc, ...segs].join('/') + '/', url.origin).href;

        item.links = [
          { lang: locale, url: href(locale, rest) },
          { lang: other, url: href(other, translated) },
          { lang: 'x-default', url: href('es', locale === 'es' ? rest : translated) },
        ];
        return item;
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
