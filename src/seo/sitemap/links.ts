import type { SitemapItem } from '@astrojs/sitemap';

/* Relative imports only: `astro.config.mjs` loads this before the tsconfig aliases exist. */
import { defaultLocale } from '../../i18n/ui';
import type { Locale } from '../../i18n/ui';
import type { RouteKey } from '../../i18n/ui';
import { alternateLocale, localizePath, parsePath } from '../../i18n/utils';

type Lastmod = (locale: Locale, segments: string[]) => string | undefined;

/**
 * The sitemap integration's `serialize`. Its built-in `i18n` option pairs locales by identical
 * path, so it matched only `/es/cv/` ↔ `/en/cv/` and left every URL with a translated segment
 * without alternates. This walks the same route map the pages use.
 */
export function createSerialize(lastmod: Lastmod) {
  return (item: SitemapItem): SitemapItem => {
    const url = new URL(item.url);
    const { lang, segments } = parsePath(url.pathname);
    const href = (locale: Locale) => new URL(localizePath(locale, segments), url.origin).href;

    item.links = [
      { lang, url: href(lang) },
      { lang: alternateLocale(lang), url: href(alternateLocale(lang)) },
      { lang: 'x-default', url: href(defaultLocale) },
    ];

    const date = lastmod(lang, segments);
    if (date) item.lastmod = date;

    return item;
  };
}

/** Pages that exist for the visitor and not for search: they carry `noindex`. */
const NOINDEX_ROUTES: RouteKey[] = ['privacy'];

/**
 * The sitemap integration's `filter`. A URL in the sitemap asks crawlers to fetch it, and a
 * `noindex` page in it is a contradiction Search Console reports as an error.
 */
export function isIndexable(page: string): boolean {
  const [route] = parsePath(new URL(page).pathname).segments;
  return !NOINDEX_ROUTES.some((noindex) => noindex === route);
}
