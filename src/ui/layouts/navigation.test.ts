import { describe, expect, it } from 'vitest';

import type { ContactLink } from '@core/types';
import { LIBRARY_SOURCE, SITE_SOURCE } from '@data/site';
import { render, text } from '@ui/test-utils';
import SiteFooter from './_partials/SiteFooter.astro';
import SiteHeader from './_partials/SiteHeader.astro';

const contact: ContactLink[] = [
  { label: 'Email', href: 'mailto:a@example.com', handle: 'a@example.com', icon: 'mail' },
];
const footer = { name: 'Ada', contact, year: 1843 };
const nav = 'nav[aria-label="Main navigation"]';

describe('SiteHeader', () => {
  const props = {
    lang: 'en',
    name: 'Ada',
    alternates: { es: '/proyectos/', en: '/en/projects/' },
    current: 'projects',
  };

  it('links every section, with no menu to open', async () => {
    const doc = await render(SiteHeader, props);
    expect([...doc.querySelectorAll(`${nav} a`)].map(text)).toEqual([
      'Projects',
      'Experience',
      'CV',
    ]);
    expect(doc.querySelector('[aria-expanded]')).toBeNull();
  });

  it('marks the current section', async () => {
    const doc = await render(SiteHeader, props);
    expect([...doc.querySelectorAll(`${nav} a[aria-current="page"]`)].map(text)).toEqual([
      'Projects',
    ]);
  });
});

describe('SiteFooter', () => {
  it('lists the contact it is given and links to the source of the site', async () => {
    const doc = await render(SiteFooter, { lang: 'en', ...footer });
    expect(doc.querySelector('a[href="mailto:a@example.com"]')).not.toBeNull();
    expect(doc.querySelectorAll(`a[href="${SITE_SOURCE}"]`)).toHaveLength(2);
  });

  it('links to the source of the design library the site is built on', async () => {
    const doc = await render(SiteFooter, { lang: 'en', ...footer });
    expect(doc.querySelector(`a[href="${LIBRARY_SOURCE}"]`)?.textContent?.trim()).toBe(
      '@velezanthony/design',
    );
  });

  it('links to the privacy page of its language', async () => {
    const en = await render(SiteFooter, { lang: 'en', ...footer });
    const es = await render(SiteFooter, { lang: 'es', ...footer });
    expect(en.querySelector('a[href="/en/privacy/"]')).not.toBeNull();
    expect(es.querySelector('a[href="/privacidad/"]')).not.toBeNull();
  });

  /* Only a site that asks for consent has a choice to revisit. */
  it('offers a cookie control only when asked for one', async () => {
    const without = await render(SiteFooter, { lang: 'en', ...footer });
    const doc = await render(SiteFooter, { lang: 'en', ...footer, cookieControl: true });
    expect(without.querySelector('[data-consent-open]')).toBeNull();
    expect(doc.querySelector('button[data-consent-open]')).not.toBeNull();
  });
});
