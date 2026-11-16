import { globSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';

import type { AstroIntegration } from 'astro';

/* Relative imports only: `astro.config.mjs` loads this before the tsconfig aliases exist. */
import { SITEMAP_PAGES, SITEMAP_XSL } from '../seo/sitemap/files';

/**
 * The one page the sitemap integration wrote. A sitemap index cannot contain another index, so
 * a split would silently make `sitemap.xml` invalid. Stopping is the only honest answer: raise
 * `entryLimit`, or list every page in the endpoint.
 */
export function onlySitemapPage(files: string[]): string {
  const [page] = files;
  if (files.length !== 1 || page === undefined) {
    throw new Error(`expected one sitemap page, found ${files.length}`);
  }
  return page;
}

/**
 * The integration absolutises `xslURL` against `site`, which makes the stylesheet cross-origin
 * on any local server and leaves the browser showing a blank document. A relative URL resolves
 * against whoever is serving the file.
 */
export function relativizeStylesheet(xml: string, site: string): string {
  return xml.replaceAll(new URL(SITEMAP_XSL, site).href, SITEMAP_XSL);
}

/* `sitemap.xml` is the index this site writes itself, covering the documentation sites too, so
   what the integration produces is only the portfolio's own page — given the name that index
   refers to. Its `-index.xml` would be a second index for one file. */
export function sitemapPages(site: string): AstroIntegration {
  return {
    name: 'sitemap-pages',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const page = onlySitemapPage(globSync('sitemap-[0-9]*.xml', { cwd: dir }));
        renameSync(new URL(page, dir), new URL(SITEMAP_PAGES, dir));
        rmSync(new URL('sitemap-index.xml', dir), { force: true });

        for (const file of globSync('sitemap*.xml', { cwd: dir })) {
          const path = new URL(file, dir);
          const xml = readFileSync(path, 'utf8');
          const relative = relativizeStylesheet(xml, site);
          if (relative !== xml) writeFileSync(path, relative);
        }

        logger.info(SITEMAP_PAGES);
      },
    },
  };
}
