import { PENDING, defaultLocale, en, locales, routes } from '@i18n/ui';
import type { Locale, Phrase, RouteKey } from '@i18n/ui';

/** Narrows an unknown route param to a Locale, or throws at build time. */
export function assertLocale(value: string | undefined): Locale {
  if (locales.includes(value as Locale)) return value as Locale;
  throw new Error(`Unknown locale: ${String(value)}`);
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

export function path(lang: Locale, route?: RouteKey, ...rest: string[]): string {
  const segments: string[] = [lang];
  if (route) segments.push(routes[route][lang]);
  segments.push(...rest);
  return `/${segments.join('/')}/`;
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
  return locales.map((lang) => ({ params: { lang } }));
}

export function localeRouteParams<K extends RouteKey>(route: K) {
  return locales.map((lang) => ({
    params: { lang, [route]: routes[route][lang] } as Record<string, string>,
  }));
}
