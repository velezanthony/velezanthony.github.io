import type { Locale } from '@core/i18n/locales';

/* A case study, against the docs site's "what it is and how to use it". The two answer different
   searches, so their titles must not compete for the same one. */
const label: Record<Locale, string> = {
  es: 'caso de estudio',
  en: 'case study',
};

/** The `<title>` of a project page, before the site's suffix: the project as a case study, not as the product. */
export function caseStudyTitle(name: string, lang: Locale): string {
  return `${name}: ${label[lang]}`;
}
