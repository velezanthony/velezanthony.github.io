import { defaultLocale } from './locales';
import type { Locale } from './locales';

/**
 * A `useTranslations` over a dictionary of English strings keyed by their Spanish source.
 * The dictionary arrives as a parameter: `core/` does not import the content.
 */
export function createTranslations<Phrase extends string>(
  english: Record<Phrase, string>,
  pending: string,
) {
  return function useTranslations(lang: Locale) {
    return function t(phrase: Phrase): string {
      if (lang === defaultLocale) return phrase;
      const translated = english[phrase];
      return translated === pending ? phrase : translated;
    };
  };
}
