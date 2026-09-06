// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import { execFileSync } from 'node:child_process';
import { globSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';

import sitemap from '@astrojs/sitemap';
import { routes } from './src/i18n/ui.ts';
import tailwindcss from '@tailwindcss/vite';

/** @type {(args: string[]) => string} */
const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

const historyIsComplete = (() => {
  try {
    return (
      git(['rev-parse', '--is-inside-work-tree']) === 'true' &&
      git(['rev-parse', '--is-shallow-repository']) !== 'true'
    );
  } catch {
    return false;
  }
})();

/** @type {Map<string, string | null>} */
const commitDates = new Map();

/** @type {(path: string) => string | null} */
const lastCommit = (path) => {
  let date = commitDates.get(path);
  if (date === undefined) {
    try {
      date = git(['log', '-1', '--format=%cI', '--', path]) || null;
    } catch {
      date = null;
    }
    commitDates.set(path, date);
  }
  return date;
};

/** @type {(locale: string, segments: string[]) => string[]} */
const sourcesOf = (locale, [section, slug]) => {
  const page = 'src/pages/[lang]';
  const data = 'src/data';

  if (!section) {
    return [`${page}/index.astro`, `${page}/_sections`, `${data}/profile.ts`, `${data}/projects.ts`];
  }
  if (section === 'cv') {
    return [
      `${page}/[cv]`,
      `${data}/profile.ts`,
      `${data}/experience.ts`,
      `${data}/education.ts`,
      `${data}/projects.ts`,
    ];
  }
  if (section === 'experience') {
    return [`${page}/[experience]`, `${data}/experience.ts`, `${data}/education.ts`];
  }
  if (section === 'projects') {
    return slug
      ? [`src/content/projects/${locale}/${slug}.md`, `${page}/[projects]/[slug].astro`, `${data}/projects.ts`]
      : [
          `${page}/[projects]/index.astro`,
          `${page}/[projects]/_sections/ProjectIndexSection.astro`,
          `${data}/projects.ts`,
        ];
  }
  return [];
};

/** @type {(locale: string, segments: string[]) => string | undefined} */
const lastmodOf = (locale, segments) => {
  if (!historyIsComplete) return undefined;
  const dates = sourcesOf(locale, segments)
    .map(lastCommit)
    .filter((/** @type {string | null} */ d) => d !== null)
    .sort();
  return dates.at(-1) ?? undefined;
};

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

  /* Spanish is unprefixed: the root is the URL people paste, so it serves the
     home rather than redirecting to it. GitHub Pages has no 301. */
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
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
      xslURL: '/sitemap-style.xml',

      namespaces: { news: false, image: false, video: false, xhtml: true },

      /* The built-in `i18n` option pairs locales by identical path, so it
         matched only `/es/cv/` ↔ `/en/cv/` and left the 14 URLs with a
         translated segment without alternates. This walks the same route
         map the pages use. */
      serialize(item) {
        const url = new URL(item.url);
        const parts = url.pathname.split('/').filter(Boolean);

        /* Spanish carries no prefix: anything outside `/en/` is Spanish. */
        const locale = parts[0] === 'en' ? 'en' : 'es';
        const rest = locale === 'en' ? parts.slice(1) : parts;
        const other = locale === 'es' ? 'en' : 'es';
        const map = /** @type {Record<string, Record<string, string>>} */ (routes);

        const canonical = rest.map(
          (seg) => Object.keys(map).find((k) => map[k][locale] === seg) ?? seg,
        );
        const translated = rest.map((seg, i) => map[canonical[i]]?.[other] ?? seg);

        /** @type {(loc: string, segs: string[]) => string} */
        const href = (loc, segs) =>
          new URL([...(loc === 'es' ? [] : [loc]), ...segs].join('/') + '/', url.origin).href;

        item.links = [
          { lang: locale, url: href(locale, rest) },
          { lang: other, url: href(other, translated) },
          { lang: 'x-default', url: href('es', locale === 'es' ? rest : translated) },
        ];

        const lastmod = lastmodOf(locale, canonical);
        if (lastmod) item.lastmod = lastmod;

        return item;
      },
    }),

    /* The `-index` and `-N` suffixes are hardcoded in the integration, and `filenameBase`
       only changes the stem. A single page becomes `sitemap.xml` — the name every crawler
       tries first — and the index that pointed at it is dropped. Split output keeps it. */
    {
      name: 'sitemap-at-the-expected-name',
      hooks: {
        'astro:build:done': ({ dir, logger }) => {
          const pages = globSync('sitemap-[0-9]*.xml', { cwd: dir });
          const index = new URL('sitemap-index.xml', dir);
          const target = new URL('sitemap.xml', dir);

          if (pages.length === 1) {
            renameSync(new URL(pages[0], dir), target);
            rmSync(index, { force: true });
          } else {
            renameSync(index, target);
          }
          logger.info(`sitemap.xml (${pages.length} page(s))`);
        },
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
