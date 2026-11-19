import { describe, expect, it } from 'vitest';

import type { ContactLink } from '@/core/types';
import { render } from '@/test-utils';
import ContactList from './ContactList.astro';

const items: ContactLink[] = [
  { label: 'Email', href: 'mailto:a@example.com', handle: 'a@example.com', icon: 'mail' },
  { label: 'GitHub', href: 'https://github.com/a', handle: 'github.com/a', icon: 'github' },
];

describe('ContactList', () => {
  /* WCAG 2.5.8: each contact at least 24px tall, on a phone as everywhere. */
  it('gives each contact a 24px tall target', async () => {
    const doc = await render(ContactList, { items });
    const links = [...doc.querySelectorAll('a')];
    expect(links).toHaveLength(2);
    for (const a of links) expect(a.classList.contains('min-h-6')).toBe(true);
  });
});
