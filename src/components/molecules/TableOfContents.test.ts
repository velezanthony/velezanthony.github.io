import { describe, expect, it } from 'vitest';

import { render, text } from '@/test/render';
import TableOfContents from './TableOfContents.astro';

const headings = [
  { depth: 2, slug: 'el-problema', text: 'El problema' },
  { depth: 3, slug: 'detalle', text: 'Un detalle' },
  { depth: 2, slug: 'qué-es', text: 'Qué es' },
  { depth: 2, slug: 'restricciones', text: 'Restricciones' },
];

describe('TableOfContents', () => {
  it('links every section heading of the write-up', async () => {
    const doc = await render(TableOfContents, { headings, lang: 'es' });
    const links = [...doc.querySelectorAll('nav a')].map((a) => [text(a), a.getAttribute('href')]);
    expect(links).toEqual([
      ['El problema', '#el-problema'],
      ['Qué es', '#qué-es'],
      ['Restricciones', '#restricciones'],
    ]);
  });

  it('is a navigation landmark named in the page language', async () => {
    expect(
      (await render(TableOfContents, { headings, lang: 'es' }))
        .querySelector('nav')!
        .getAttribute('aria-label'),
    ).toBe('En esta página');
    expect(
      (await render(TableOfContents, { headings, lang: 'en' }))
        .querySelector('nav')!
        .getAttribute('aria-label'),
    ).toBe('On this page');
  });

  /* It follows the reader down the write-up, beside it; on a phone there is no side column. */
  it('sticks beside the write-up, and only where there is a side column', async () => {
    const nav = (await render(TableOfContents, { headings, lang: 'es' })).querySelector('nav')!;
    expect([...nav.classList]).toEqual(expect.arrayContaining(['hidden', 'md:block', 'md:sticky']));
  });

  /* Two sections are a page, not a document worth an index. */
  it('renders nothing for fewer than three sections', async () => {
    const doc = await render(TableOfContents, { headings: headings.slice(0, 3), lang: 'es' });
    expect(doc.querySelector('nav')).toBeNull();
  });
});
