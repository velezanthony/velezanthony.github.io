import type { HeadConfig } from '@velezanthony/design/head';

import { profile } from '@/data/profile';
import { locales, ogLocales } from '@/data/ui';
import type { Locale } from '@/data/ui';
import { alternateLocale } from '@/core/i18n/utils';
import { person } from './jsonld';

export interface PageHeadInput {
  lang: Locale;
  title: string;
  /** Skips the ` | Anthony Velez Tapia` suffix. Project pages carry their own two-part title and
      would otherwise overflow the SERP truncation point. */
  bareTitle?: boolean;
  description: string;
  /** Every locale's path for this page, for `hreflang`. */
  alternates: Record<Locale, string>;
  /** Keeps a page out of search results: the 404. */
  noindex?: boolean;
  /** Path of the page being rendered, for its canonical URL. */
  pathname: string;
  site: URL;
  generator: string;
}

function meta(key: 'name' | 'property', name: string, content: string): HeadConfig {
  return { tag: 'meta', attrs: { [key]: name, content } };
}

/** `</script>` inside the JSON would end the tag early; `<` as an escape keeps the same value. */
function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

/** The page's `<head>` as the data the library's layout renders: title, indexing, social cards and the Person it is about. */
export function pageHead({
  lang,
  title,
  bareTitle = false,
  description,
  alternates,
  noindex = false,
  pathname,
  site,
  generator,
}: PageHeadInput): HeadConfig[] {
  const fullTitle = bareTitle || title === profile.name ? title : `${title} | ${profile.name}`;
  const canonical = new URL(pathname, site).href;
  /* Absolute URL required: crawlers do not resolve relative image paths. */
  const image = new URL('/og.png', site).href;

  return [
    { tag: 'title', attrs: {}, content: fullTitle },
    meta('name', 'generator', generator),
    meta('name', 'description', description),
    ...(noindex ? [meta('name', 'robots', 'noindex')] : []),
    ...(noindex
      ? []
      : [
          { tag: 'link', attrs: { rel: 'canonical', href: canonical } } satisfies HeadConfig,
          ...locales.map(
            (locale) =>
              ({
                tag: 'link',
                attrs: {
                  rel: 'alternate',
                  hreflang: locale,
                  href: new URL(alternates[locale], site).href,
                },
              }) satisfies HeadConfig,
          ),
          {
            tag: 'link',
            attrs: {
              rel: 'alternate',
              hreflang: 'x-default',
              href: new URL(alternates.es, site).href,
            },
          } satisfies HeadConfig,
        ]),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:alt', profile.name),
    meta('name', 'twitter:image', image),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:title', fullTitle),
    meta('property', 'og:description', description),
    meta('property', 'og:url', canonical),
    meta('property', 'og:locale', ogLocales[lang]),
    meta('property', 'og:locale:alternate', ogLocales[alternateLocale(lang)]),
    meta('property', 'og:site_name', profile.name),
    meta('name', 'twitter:card', 'summary_large_image'),
    {
      tag: 'link',
      attrs: { rel: 'icon', href: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    },
    { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
    meta('name', 'color-scheme', 'light dark'),
    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      content: serializeJsonLd(person(lang, canonical)),
    },
  ];
}
