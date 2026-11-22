import type { Locale } from '@core/i18n/locales';

/* What a case study promises, against the docs site's "what it is and how to use it". The two
   answer different searches, so their titles must not compete for the same one. */
const promise: Record<Locale, string> = {
  es: 'decisiones, errores y límites',
  en: 'decisions, mistakes and limits',
};

/** The `<title>` of a project page: the project as a case study, not as the product. */
export function caseStudyTitle(name: string, lang: Locale): string {
  return `${name}: ${promise[lang]}`;
}

/* What results pages show before they cut the title, and the library's ` | ` between the parts. */
const MAX_TITLE = 60;
const SEPARATOR = ' | ';

/** Whether `title | suffix` still fits whole in a results page. */
export function suffixFits(title: string, suffix: string): boolean {
  return `${title}${SEPARATOR}${suffix}`.length <= MAX_TITLE;
}
