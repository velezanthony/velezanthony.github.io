/* Relative, not `@i18n/ui`: `astro.config.mjs` imports this file, and it loads before the
   tsconfig aliases exist. */
import { PENDING, defaultLocale, en, locales, routes } from './ui';
import type { Locale, Phrase, RouteKey } from './ui';

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/* `Object.hasOwn`, not `in`: `in` walks the prototype chain, so `constructor` would pass. */
function isRouteKey(value: string): value is RouteKey {
  return Object.hasOwn(routes, value);
}

/** Narrows the `[...lang]` param to a Locale. Absent means the default one. */
export function assertLocale(value: string | undefined): Locale {
  if (value === undefined) return defaultLocale;
  if (isLocale(value)) return value;
  throw new Error(`Unknown locale: ${value}`);
}

export function useTranslations(lang: Locale) {
  return function t(phrase: Phrase): string {
    if (lang === defaultLocale) return phrase;
    const translated: string = en[phrase];
    return translated === PENDING ? phrase : translated;
  };
}

/** The default locale is unprefixed: `/proyectos/`, not `/es/proyectos/`. */
export function path(lang: Locale, route?: RouteKey, ...rest: string[]): string {
  const segments: string[] = lang === defaultLocale ? [] : [lang];
  if (route) segments.push(routes[route][lang]);
  segments.push(...rest);
  return segments.length === 0 ? '/' : `/${segments.join('/')}/`;
}

/** The `[...lang]` param. `undefined` is what makes Astro emit `/` itself. */
export function langParam(lang: Locale): string | undefined {
  return lang === defaultLocale ? undefined : lang;
}

/** The same page in the other locale. */
export function alternateLocale(lang: Locale): Locale {
  return locales.find((other) => other !== lang) ?? defaultLocale;
}

function routeKeyOf(lang: Locale, segment: string): RouteKey | undefined {
  return (Object.keys(routes) as RouteKey[]).find((key) => routes[key][lang] === segment);
}

/**
 * A site path read back into its locale and canonical segments:
 * `/en/projects/snake-orm/` is `en` and `['projects', 'snake-orm']`.
 * Only the first segment can be a route — the rest are slugs, kept as they are.
 */
export function parsePath(pathname: string): { lang: Locale; segments: string[] } {
  const parts = pathname.split('/').filter(Boolean);
  const [first] = parts;
  const prefixed = first !== undefined && first !== defaultLocale && isLocale(first);
  const lang = prefixed ? first : defaultLocale;
  const [head, ...rest] = prefixed ? parts.slice(1) : parts;
  if (head === undefined) return { lang, segments: [] };
  return { lang, segments: [routeKeyOf(lang, head) ?? head, ...rest] };
}

/** The inverse of `parsePath`: the page with these canonical segments, in `lang`. */
export function localizePath(lang: Locale, segments: string[]): string {
  const [head, ...rest] = segments;
  if (head === undefined) return path(lang);
  return isRouteKey(head) ? path(lang, head, ...rest) : path(lang, undefined, head, ...rest);
}

/**
 * The locale of a content entry, read off its folder: `en/snake-orm` is `en`.
 * Throws rather than guessing — an entry outside a locale folder is a misplaced file.
 */
export function localeOfEntry(id: string): Locale {
  const [folder = ''] = id.split('/');
  if (id.includes('/') && isLocale(folder)) return folder;
  throw new Error(`Content entry outside a locale folder: ${id}`);
}

export function alternates(route?: RouteKey, ...rest: string[]): Record<Locale, string> {
  return Object.fromEntries(locales.map((lang) => [lang, path(lang, route, ...rest)])) as Record<
    Locale,
    string
  >;
}

/** `getStaticPaths` helper for routes that exist once per locale. */
export function localeParams() {
  return locales.map((lang) => ({ params: { lang: langParam(lang) } }));
}

export function localeRouteParams<K extends RouteKey>(route: K) {
  return locales.map((lang) => ({
    params: { lang: langParam(lang), [route]: routes[route][lang] } as Record<
      string,
      string | undefined
    >,
  }));
}
