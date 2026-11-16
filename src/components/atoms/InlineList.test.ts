import { describe, expect, it } from 'vitest';

import { render, text } from '@/test/render';
import InlineList from './InlineList.astro';

const items = ['Python', 'VS Code API', 'SQLite'];

describe('InlineList', () => {
  it('is a real list, one item each', async () => {
    const doc = await render(InlineList, { items });
    expect([...doc.querySelectorAll('ul > li')].map(text)).toEqual(items);
  });

  /* The separators are drawn by CSS, before each item: none can trail a line, and none is text a
     screen reader would read out or a copy would carry. */
  it('puts no separator in the text', async () => {
    const doc = await render(InlineList, { items });
    expect(text(doc)).not.toContain('·');
  });

  /* An item moves to the next line whole, so "VS Code API" does not split; only one wider than
     the whole column wraps inside, rather than being cut off by the clip. */
  it('lets an item wrap only when it is wider than its column', async () => {
    const doc = await render(InlineList, { items });
    for (const li of doc.querySelectorAll('li')) {
      expect(li.classList.contains('whitespace-nowrap')).toBe(false);
      expect(li.classList.contains('max-w-full')).toBe(true);
    }
  });

  it('renders nothing for an empty list', async () => {
    expect((await render(InlineList, { items: [] })).querySelector('ul')).toBeNull();
  });
});
