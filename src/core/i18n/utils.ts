import { defaultLocale, locales, routes } from './locales';
import type { Locale, RouteKey } from './locales';

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Narrows the `[...lang]` param to a Locale. Absent means the default one. */
export function assertLocale(value: string | undefined): Locale {
  if (value === undefined) return defaultLocale;
  if (isLocale(value)) return value;
  throw new Error(`Unknown locale: ${value}`);
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

/** The locale of a site path: the default one is unprefixed, so `/en/cv/` is `en` and `/cv/` is `es`. */
export function localeOfPath(pathname: string): Locale {
  const [first = ''] = pathname.split('/').filter(Boolean);
  return first !== defaultLocale && isLocale(first) ? first : defaultLocale;
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
