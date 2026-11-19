import { describe, expect, it } from 'vitest';

import { render, text } from '@/test-utils';
import SiteHeader from './SiteHeader.astro';

const props = {
  lang: 'en',
  name: 'Ada',
  alternates: { es: '/proyectos/', en: '/en/projects/' },
  current: 'projects',
};

describe('SiteHeader', () => {
  /* On a phone the controls sit on the first row, but Tab must still reach the nav first. */
  it('keeps name, navigation and controls in that source order', async () => {
    const container = (await render(SiteHeader, props)).querySelector('header > div')!;
    const order = [...container.children].map((el) =>
      el.matches('nav') ? 'nav' : el.querySelector('.theme-toggle') ? 'controls' : 'name',
    );
    expect(order).toEqual(['name', 'nav', 'controls']);
  });

  /* Three links fit in view; none hides behind a menu button. */
  it('shows every section link, with no menu to open', async () => {
    const doc = await render(SiteHeader, props);
    expect([...doc.querySelectorAll('nav[aria-label="Main navigation"] a')].map(text)).toEqual([
      'Projects',
      'Experience',
      'CV',
    ]);
    expect(doc.querySelector('[aria-expanded]')).toBeNull();
  });

  it('marks the current section', async () => {
    const doc = await render(SiteHeader, props);
    expect(
      [...doc.querySelectorAll('nav[aria-label="Main navigation"] a[aria-current="page"]')].map(
        text,
      ),
    ).toEqual(['Projects']);
  });

  /* WCAG 2.5.8: the name and each section link at least 24px tall. */
  it('gives the name and every section link a 24px tall target', async () => {
    const doc = await render(SiteHeader, props);
    const targets = [
      doc.querySelector('header > div > a')!,
      ...doc.querySelectorAll('nav[aria-label="Main navigation"] a'),
    ];
    for (const a of targets) expect(a.classList.contains('min-h-6')).toBe(true);
    /* "CV" is two letters: 18px wide without a floor. */
    for (const a of doc.querySelectorAll('nav[aria-label="Main navigation"] a'))
      expect(a.classList.contains('min-w-6')).toBe(true);
  });
});
