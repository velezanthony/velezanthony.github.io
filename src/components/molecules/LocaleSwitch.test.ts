import { describe, expect, it } from 'vitest';

import { render, text } from '@/test/render';
import LocaleSwitch from './LocaleSwitch.astro';

const hrefs = { es: '/proyectos/', en: '/en/projects/' };

describe('LocaleSwitch', () => {
  it('links every locale to the same page', async () => {
    const doc = await render(LocaleSwitch, { lang: 'es', hrefs });
    const links = [...doc.querySelectorAll('a')].map((a) => [
      a.getAttribute('hreflang'),
      a.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ['es', '/proyectos/'],
      ['en', '/en/projects/'],
    ]);
  });

  it('marks only the current locale', async () => {
    const doc = await render(LocaleSwitch, { lang: 'en', hrefs });
    const current = [...doc.querySelectorAll('a[aria-current]')].map((a) =>
      a.getAttribute('hreflang'),
    );
    expect(current).toEqual(['en']);
  });

  /* Each link is in its own language, so a screen reader pronounces «English» as English. */
  it('names each locale in its own language', async () => {
    const doc = await render(LocaleSwitch, { lang: 'es', hrefs });
    const english = doc.querySelector('a[hreflang="en"]')!;
    expect(english.getAttribute('lang')).toBe('en');
    expect(text(english.querySelector('.sr-only'))).toBe('English');
  });

  it('labels the navigation in the page language', async () => {
    expect(
      (await render(LocaleSwitch, { lang: 'es', hrefs }))
        .querySelector('nav')
        ?.getAttribute('aria-label'),
    ).toBe('Idioma');
    expect(
      (await render(LocaleSwitch, { lang: 'en', hrefs }))
        .querySelector('nav')
        ?.getAttribute('aria-label'),
    ).toBe('Language');
  });
});
