import { describe, expect, it } from 'vitest';

import type { ContactLink } from '@/core/types';
import { render } from '@/test-utils';
import ContactList from './ContactList.astro';

const items: ContactLink[] = [
  { label: 'Email', href: 'mailto:a@example.com', handle: 'a@example.com', icon: 'mail' },
  { label: 'GitHub', href: 'https://github.com/a', handle: 'github.com/a', icon: 'github' },
];

describe('ContactList', () => {
  it('links each contact to its address', async () => {
    const doc = await render(ContactList, { items });
    expect([...doc.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
      'mailto:a@example.com',
      'https://github.com/a',
    ]);
  });
});
