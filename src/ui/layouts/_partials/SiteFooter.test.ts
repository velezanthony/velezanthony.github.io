import { describe, expect, it } from 'vitest';

import type { ContactLink } from '@/data/types';
import { SITE_SOURCE } from '@/site';
import { render, text } from '@/test-utils';
import SiteFooter from './SiteFooter.astro';

const contact: ContactLink[] = [
  { label: 'Email', href: 'mailto:a@example.com', handle: 'a@example.com', icon: 'mail' },
];

describe('SiteFooter', () => {
  it('signs the copyright with the year and name it is given', async () => {
    const doc = await render(SiteFooter, { lang: 'en', name: 'Ada', contact, year: 1843 });
    expect(text(doc)).toContain('© 1843 Ada');
  });

  it('lists the contact it is given', async () => {
    const doc = await render(SiteFooter, { lang: 'en', name: 'Ada', contact, year: 1843 });
    expect(doc.querySelector('a[href="mailto:a@example.com"]')).not.toBeNull();
  });

  it('links to the source of this site', async () => {
    const doc = await render(SiteFooter, { lang: 'en', name: 'Ada', contact, year: 1843 });
    expect(doc.querySelectorAll(`a[href="${SITE_SOURCE}"]`)).toHaveLength(2);
  });

  /* The last section's bottom padding already parts the page from the footer; a margin here too
     stacked the two into some 200px of nothing. */
  it('adds no top margin of its own', async () => {
    const footer = (
      await render(SiteFooter, { lang: 'en', name: 'Ada', contact, year: 1843 })
    ).querySelector('footer')!;
    expect([...footer.classList].some((c) => /^mt-/.test(c))).toBe(false);
  });

  it('links to the privacy page of its language', async () => {
    const en = await render(SiteFooter, { lang: 'en', name: 'Ada', contact, year: 1843 });
    const es = await render(SiteFooter, { lang: 'es', name: 'Ada', contact, year: 1843 });
    expect(en.querySelector('a[href="/en/privacy/"]')).not.toBeNull();
    expect(es.querySelector('a[href="/privacidad/"]')).not.toBeNull();
  });

  /* Only a site that asks for consent has a choice to revisit. */
  it('has no cookie control unless it is asked for one', async () => {
    const without = await render(SiteFooter, { lang: 'en', name: 'Ada', contact, year: 1843 });
    expect(without.querySelector('[data-consent-open]')).toBeNull();
  });

  it('offers a cookie control that is a button, since it acts rather than navigates', async () => {
    const doc = await render(SiteFooter, {
      lang: 'en',
      name: 'Ada',
      contact,
      year: 1843,
      cookieControl: true,
    });
    const control = doc.querySelector('[data-consent-open]')!;
    expect(control.tagName).toBe('BUTTON');
    expect(control.getAttribute('type')).toBe('button');
    expect(text(control)).toBe('Cookie preferences');
  });
});
