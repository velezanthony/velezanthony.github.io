export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

/** Open Graph wants a territory too. */
export const ogLocales: Record<Locale, string> = {
  es: 'es_ES',
  en: 'en_GB',
};

export const routes = {
  projects: { es: 'proyectos', en: 'projects' },
  experience: { es: 'experiencia', en: 'experience' },
  cv: { es: 'cv', en: 'cv' },
  privacy: { es: 'privacidad', en: 'privacy' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;
