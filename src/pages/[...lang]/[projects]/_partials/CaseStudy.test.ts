import { describe, expect, it } from 'vitest';

import { render, text } from '@ui/test-utils';
import CaseStudy from './CaseStudy.astro';

const props = {
  lang: 'es',
  name: 'snake-orm',
  tagline: 'Un ORM tipado.',
  status: 'maintained',
  role: 'Autor',
  stack: ['Python', 'Sistema de tipos'],
  targets: ['mypy', 'Pyright'],
  compat: ['Python ≥ 3.11'],
  quality: ['Licencia MIT'],
  constraints: ['Sin generación de código'],
  links: [
    { label: 'Código', href: 'https://github.com/velezanthony/snake-orm' },
    { label: 'PyPI', href: 'https://pypi.org/project/snake-orm/' },
  ],
  todo: [],
  translationPending: false,
  backHref: '/proyectos/',
};

describe('CaseStudy sidebar', () => {
  it('carries the downloads field for the stores the project is published to', async () => {
    const doc = await render(CaseStudy, { ...props, downloads: { pypi: 'snake-orm' } });
    const field = doc.querySelector('aside [data-downloads]')!;
    expect(text(field.querySelector('p.label'))).toBe('Descargas');
    expect(
      field.querySelector('a[href="https://pypistats.org/packages/snake-orm"]'),
    ).not.toBeNull();
  });

  it('has no downloads field for a project published nowhere', async () => {
    expect((await render(CaseStudy, props)).querySelector('aside [data-downloads]')).toBeNull();
  });

  describe('index', () => {
    const headings = ['El problema', 'Qué es', 'Restricciones'].map((t, i) => ({
      depth: 2,
      slug: `s${i}`,
      text: t,
    }));

    /* Below the details, so it sticks once they have scrolled away and follows the reader down. */
    it('sits in the side column, after the details', async () => {
      const column = (await render(CaseStudy, { ...props, headings })).querySelector(
        '[data-toc-column]',
      )!;
      /* Astro renders the index's own <script> right after it; content is what counts. */
      const content = [...column.children].filter((element) => element.tagName !== 'SCRIPT');
      expect(content.map((element) => element.tagName.toLowerCase())).toEqual(['aside', 'nav']);
    });

    /* Two sections are a page, not a document worth an index. */
    it('has no index under three sections', async () => {
      const doc = await render(CaseStudy, { ...props, headings: headings.slice(0, 2) });
      expect(doc.querySelector('nav.toc')).toBeNull();
    });
  });

  it('renders the write-up in the library article, with the pending items after it', async () => {
    const doc = await render(
      CaseStudy,
      { ...props, todo: ['Benchmarks'] },
      { default: '<h2 id="a">Uno</h2>' },
    );
    const article = doc.querySelector('div[data-copy-label]')!;
    expect(article.querySelector('.prose h2')).not.toBeNull();
    expect(text(article.lastElementChild)).toContain('Benchmarks');
  });
});
