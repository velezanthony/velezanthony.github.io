import { describe, expect, it } from 'vitest';

import type { ResolvedSection } from '@data/privacy';
import { render, text } from '@/test/render';
import PrivacyPolicy from './PrivacyPolicy.astro';

const sections: ResolvedSection[] = [
  {
    id: 'one',
    title: 'First',
    blocks: [
      { kind: 'text', text: 'Some prose.' },
      { kind: 'list', items: ['Alpha', 'Beta'] },
      {
        kind: 'table',
        caption: 'A table',
        head: ['Name', 'Value'],
        rows: [['_ga', '2 years']],
      },
      { kind: 'links', items: [{ label: 'AEPD', href: 'https://www.aepd.es' }] },
    ],
  },
  { id: 'two', title: 'Second', blocks: [{ kind: 'text', text: 'More.' }] },
];

const props = { lang: 'en', sections, updated: '2026-11-10' } as const;

describe('PrivacyPolicy', () => {
  it('has one h1, the title of the page, and an h2 per section with its anchor', async () => {
    const doc = await render(PrivacyPolicy, props);
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(text(doc.querySelector('h1'))).toBe('Privacy policy');
    expect([...doc.querySelectorAll('h2')].map((h) => h.id)).toEqual(['one', 'two']);
  });

  it('dates the policy with a machine-readable time', async () => {
    const doc = await render(PrivacyPolicy, props);
    const time = doc.querySelector('time')!;
    expect(time.getAttribute('datetime')).toBe('2026-11-10');
    expect(text(time)).toBe('10 November 2026');
    expect(text(doc)).toContain('Last updated');
  });

  it('writes the date in the page language', async () => {
    const doc = await render(PrivacyPolicy, { ...props, lang: 'es' });
    expect(text(doc.querySelector('time'))).toBe('10 de noviembre de 2026');
  });

  it('renders each kind of block', async () => {
    const doc = await render(PrivacyPolicy, props);
    expect(text(doc)).toContain('Some prose.');
    expect([...doc.querySelectorAll('ul li')].map(text)).toContain('Beta');
    expect(doc.querySelector('a[href="https://www.aepd.es"]')).not.toBeNull();
  });

  it('gives a table a caption, column headers and a row header, in a scroller', async () => {
    const doc = await render(PrivacyPolicy, props);
    expect(doc.querySelector('.table-scroll table')).not.toBeNull();
    expect(text(doc.querySelector('caption'))).toBe('A table');
    expect([...doc.querySelectorAll('thead th')].map((th) => th.getAttribute('scope'))).toEqual([
      'col',
      'col',
    ]);
    expect(text(doc.querySelector('tbody th'))).toBe('_ga');
    expect(doc.querySelector('tbody th')?.getAttribute('scope')).toBe('row');
  });
});
