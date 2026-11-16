import { describe, expect, it } from 'vitest';

import { render, text } from '@/test/render';
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
});
