import { describe, expect, it, vi } from 'vitest';

import type { Phrase } from '@i18n/ui';
import {
  alternateLocale,
  alternates,
  assertLocale,
  langParam,
  localeOfEntry,
  localeParams,
  localeRouteParams,
  localizePath,
  parsePath,
  path,
  useTranslations,
} from './utils';

/* The catalogue has no pending phrase today, so one is planted to exercise the fallback. */
vi.mock('@i18n/ui', async (importOriginal) => {
  const ui = await importOriginal<typeof import('@i18n/ui')>();
  return { ...ui, en: { ...ui.en, 'Frase pendiente': ui.PENDING } };
});
const pending = 'Frase pendiente' as Phrase;

describe('assertLocale', () => {
  it('treats an absent param as the default locale', () => {
    expect(assertLocale(undefined)).toBe('es');
  });

  it.each(['es', 'en'])('accepts %s', (lang) => {
    expect(assertLocale(lang)).toBe(lang);
  });

  it.each(['fr', 'EN', ''])('rejects %j', (lang) => {
    expect(() => assertLocale(lang)).toThrow(`Unknown locale: ${lang}`);
  });
});

describe('useTranslations', () => {
  it('returns the Spanish phrase itself, since it is the key', () => {
    expect(useTranslations('es')('Proyectos')).toBe('Proyectos');
  });

  it('translates into English', () => {
    expect(useTranslations('en')('Proyectos')).toBe('Projects');
  });

  it('falls back to Spanish while the English is pending', () => {
    expect(useTranslations('en')(pending)).toBe('Frase pendiente');
  });
});

describe('path', () => {
  it('leaves the default locale unprefixed', () => {
    expect(path('es')).toBe('/');
    expect(path('es', 'projects')).toBe('/proyectos/');
  });

  it('prefixes the other locale and translates the segment', () => {
    expect(path('en')).toBe('/en/');
    expect(path('en', 'projects')).toBe('/en/projects/');
  });

  it('appends the rest verbatim, with a trailing slash', () => {
    expect(path('es', 'projects', 'snake-orm')).toBe('/proyectos/snake-orm/');
    expect(path('en', 'projects', 'snake-orm')).toBe('/en/projects/snake-orm/');
  });
});

describe('langParam', () => {
  it('is undefined for the default locale, so Astro emits `/` itself', () => {
    expect(langParam('es')).toBeUndefined();
    expect(langParam('en')).toBe('en');
  });
});

describe('alternateLocale', () => {
  it('swaps between the two locales', () => {
    expect(alternateLocale('es')).toBe('en');
    expect(alternateLocale('en')).toBe('es');
  });
});

describe('alternates', () => {
  it('maps every locale to the same page', () => {
    expect(alternates('experience')).toEqual({ es: '/experiencia/', en: '/en/experience/' });
    expect(alternates()).toEqual({ es: '/', en: '/en/' });
  });
});

describe('localeParams', () => {
  it('yields one entry per locale', () => {
    expect(localeParams()).toEqual([{ params: { lang: undefined } }, { params: { lang: 'en' } }]);
  });
});

describe('localeRouteParams', () => {
  it('keys the translated segment by the route name', () => {
    expect(localeRouteParams('projects')).toEqual([
      { params: { lang: undefined, projects: 'proyectos' } },
      { params: { lang: 'en', projects: 'projects' } },
    ]);
  });
});

describe('parsePath', () => {
  it.each([
    ['/', 'es', []],
    ['/proyectos/', 'es', ['projects']],
    ['/proyectos/snake-orm/', 'es', ['projects', 'snake-orm']],
    ['/en/', 'en', []],
    ['/en/experience/', 'en', ['experience']],
    ['/en/projects/snake-orm/', 'en', ['projects', 'snake-orm']],
  ])('reads %s as %s %j', (pathname, lang, segments) => {
    expect(parsePath(pathname)).toEqual({ lang, segments });
  });

  it('only recognises a whole prefix segment as a locale', () => {
    expect(parsePath('/english/')).toEqual({ lang: 'es', segments: ['english'] });
  });

  it('does not take a segment in the wrong language for a route', () => {
    expect(parsePath('/projects/')).toEqual({ lang: 'es', segments: ['projects'] });
  });

  it('only the first segment can be a route', () => {
    expect(parsePath('/proyectos/cv/')).toEqual({ lang: 'es', segments: ['projects', 'cv'] });
  });
});

describe('localizePath', () => {
  it('builds the page in any locale from canonical segments', () => {
    expect(localizePath('es', ['projects', 'snake-orm'])).toBe('/proyectos/snake-orm/');
    expect(localizePath('en', ['projects', 'snake-orm'])).toBe('/en/projects/snake-orm/');
    expect(localizePath('es', [])).toBe('/');
  });

  /* `in` would walk the prototype chain and read `routes.constructor` as a route. */
  it.each(['constructor', 'toString', '__proto__'])('keeps %j as a plain segment', (segment) => {
    expect(localizePath('es', [segment])).toBe(`/${segment}/`);
    expect(localizePath('en', [segment])).toBe(`/en/${segment}/`);
  });

  it.each([
    '/',
    '/en/',
    '/cv/',
    '/en/cv/',
    '/experiencia/',
    '/en/experience/',
    '/proyectos/snake-orm/',
    '/en/projects/snake-orm/',
    '/privacidad/',
    '/en/privacy/',
  ])('round-trips %s through parsePath', (pathname) => {
    const { lang, segments } = parsePath(pathname);
    expect(localizePath(lang, segments)).toBe(pathname);
  });
});

describe('localeOfEntry', () => {
  it('reads the locale off the folder', () => {
    expect(localeOfEntry('es/snake-orm')).toBe('es');
    expect(localeOfEntry('en/snake-orm')).toBe('en');
  });

  it.each(['fr/snake-orm', 'snake-orm', 'EN/snake-orm'])('rejects %j', (id) => {
    expect(() => localeOfEntry(id)).toThrow(id);
  });
});
