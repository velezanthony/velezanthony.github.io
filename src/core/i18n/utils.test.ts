import { describe, expect, it } from 'vitest';

import {
  alternateLocale,
  alternates,
  assertLocale,
  langParam,
  localeOfEntry,
  localeOfPath,
  localeParams,
  localeRouteParams,
  path,
} from './utils';

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

describe('localeOfPath', () => {
  it.each([
    ['/', 'es'],
    ['/proyectos/snake-orm/', 'es'],
    ['/en/', 'en'],
    ['/en/projects/snake-orm/', 'en'],
    ['/en', 'en'],
  ])('reads %s as %s', (pathname, lang) => {
    expect(localeOfPath(pathname)).toBe(lang);
  });

  it('only recognises a whole prefix segment as a locale', () => {
    expect(localeOfPath('/english/')).toBe('es');
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
