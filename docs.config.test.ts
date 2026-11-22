import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import docsConfig from './docs.config.mjs';
import { ogLocales } from './src/core/i18n/locales';
import { profile } from './src/data/profile';

/* The list is typed in `docs.config.mjs`, so it can lag behind the content. A project missing from
   it drops out of the sitemap index with no error; one that is not published is reported as a
   fetch error against this domain. */
describe('site.seo.sitemap.include', () => {
  const directory = 'src/data/projects/en';
  const documentation = readdirSync(directory)
    .map((file) => readFileSync(`${directory}/${file}`, 'utf8'))
    .map((source) => source.match(/kind: docs\s+href: (\S+)/)?.[1])
    .filter((href): href is string => href !== undefined)
    .map((href) => new URL('sitemap.xml', href).pathname);

  it('lists the documentation site of every project', () => {
    expect([...(docsConfig.site.seo?.sitemap?.include ?? [])].sort()).toEqual(documentation.sort());
  });
});

/* `docs.config.mjs` cannot import the TypeScript sources, so what it repeats is checked here. */
describe('values repeated from the site sources', () => {
  it('ogLocales equals the Open Graph locales of the site', () => {
    expect(docsConfig.site.seo?.ogLocales).toEqual(ogLocales);
  });

  it('the title suffix and the social image alt are the owner name', () => {
    expect(docsConfig.site.seo?.titleSuffix).toBe(profile.name);
    expect(docsConfig.site.seo?.image?.alt).toBe(profile.name);
  });
});

/* The articles are docs pages of the library: they wear the site's own footer, not the library's. */
describe('site.components.Footer', () => {
  it('points to the adapter of the site footer', () => {
    expect(docsConfig.site.components?.Footer).toBe('./src/ui/layouts/_partials/DocsFooter.astro');
    expect(existsSync(docsConfig.site.components?.Footer ?? '')).toBe(true);
  });
});
