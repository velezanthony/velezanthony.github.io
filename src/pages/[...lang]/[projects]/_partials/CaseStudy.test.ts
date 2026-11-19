import { describe, expect, it } from 'vitest';

import { render, text } from '@/test-utils';
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

/** The element that carries a field's text: the deepest one holding its first words. */
function content(label: Element): Element {
  let el = label.nextElementSibling!;
  while (el.firstElementChild && !el.firstElementChild.matches('.size-1\\.5')) {
    const withText = [...el.querySelectorAll('*')].find((e) =>
      [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()),
    );
    if (!withText || withText === el) break;
    el = withText;
  }
  return el;
}

/** Classes on the element and its ancestors up to the field, nearest first. */
function classesUpTo(el: Element, stop: Element): string[] {
  const out: string[] = [];
  for (let e: Element | null = el; e && e !== stop; e = e.parentElement) out.push(...e.classList);
  return out;
}

describe('CaseStudy sidebar', () => {
  /* Content and title must part clearly; content and content must not. Every value is ink against
     the faint label, at 14px in sans or at the mono list size: one weight across the sidebar. */
  it('gives every field the same weight of content under the same kind of label', async () => {
    const doc = await render(CaseStudy, props);
    const labels = [...doc.querySelectorAll('aside p.label')];
    expect(labels.map(text)).toEqual([
      'Rol',
      'Stack',
      'Para',
      'Compatibilidad',
      'Calidad',
      'Restricciones',
      'Enlaces',
    ]);

    for (const label of labels) {
      expect([...label.classList], text(label)).toContain('text-faint');
      const value = content(label);
      const classes = classesUpTo(value, label.parentElement!);
      const mono = classes.includes('font-mono');
      expect(classes, text(label)).toContain(mono ? 'text-mono-list' : 'text-sm');
      expect(classes, text(label)).toContain('text-ink');
      expect(classes, text(label)).not.toContain('text-muted');
    }
  });

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
      const aside = (await render(CaseStudy, { ...props, headings })).querySelector('aside')!;
      /* Astro renders the index's own <script> right after it; content is what counts. */
      const content = [...aside.children].filter((el) => el.tagName !== 'SCRIPT');
      expect(content.at(-1)!.matches('nav.toc')).toBe(true);
    });

    /* Two sections are a page, not a document worth an index. */
    it('has no index under three sections', async () => {
      const doc = await render(CaseStudy, { ...props, headings: headings.slice(0, 2) });
      expect(doc.querySelector('nav.toc')).toBeNull();
    });

    /* The column must run the article's full height for its index to stick; a sticky column of
       its own, taller than the screen, would not. */
    it('lets the column run the full height, the index being what sticks', async () => {
      const aside = (await render(CaseStudy, { ...props, headings })).querySelector('aside')!;
      expect(
        [...aside.classList].some((c) => c.endsWith('sticky') || c.endsWith('self-start')),
      ).toBe(false);
    });
  });
});
