import { PENDING, defaultLocale, en, locales, routes } from '@i18n/ui';
import type { Locale, Phrase, RouteKey } from '@i18n/ui';

/** Narrows the `[...lang]` param to a Locale. Absent means the default one. */
export function assertLocale(value: string | undefined): Locale {
  if (value === undefined) return defaultLocale;
  if (locales.includes(value as Locale)) return value as Locale;
  throw new Error(`Unknown locale: ${value}`);
}

export function useTranslations(lang: Locale) {
  return function t(phrase: Phrase): string {
    if (lang === defaultLocale) return phrase;
    const translated: string = en[phrase];
    return translated === PENDING ? phrase : translated;
  };
}

/** True while `phrase` still has no English translation. */
export function isPending(phrase: Phrase): boolean {
  const translated: string = en[phrase];
  return translated === PENDING;
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
  return lang === 'es' ? 'en' : 'es';
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
