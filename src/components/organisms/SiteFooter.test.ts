import { describe, expect, it } from 'vitest';

import type { ContactLink } from '@data/types';
import { SITE_SOURCE } from '@/site';
import { render, text } from '@/test/render';
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
});
