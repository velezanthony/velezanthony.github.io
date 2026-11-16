import { describe, expect, it } from 'vitest';

import { render, text } from '@/test/render';
import CaseStudySection from './CaseStudySection.astro';

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

describe('CaseStudySection sidebar', () => {
  /* Content and title must part clearly; content and content must not. Every value is ink against
     the faint label, at 14px in sans or at the mono list size: one weight across the sidebar. */
  it('gives every field the same weight of content under the same kind of label', async () => {
    const doc = await render(CaseStudySection, props);
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

  it('lists the download count as a field when there is one', async () => {
    const downloads = {
      text: '811 descargas al mes',
      sources: [{ label: 'PyPI', href: 'https://pypistats.org/packages/snake-orm' }],
    };
    const doc = await render(CaseStudySection, { ...props, downloads });
    const label = [...doc.querySelectorAll('aside p.label')].find((l) => text(l) === 'Descargas');
    expect(label).toBeDefined();
    expect(text(label!.nextElementSibling)).toContain('811 descargas al mes');
    const source = label!.parentElement!.querySelector(
      'a[href="https://pypistats.org/packages/snake-orm"]',
    );
    expect(text(source)).toBe('PyPI');
  });

  it('leaves the field out without a number', async () => {
    const doc = await render(CaseStudySection, props);
    expect([...doc.querySelectorAll('aside p.label')].map(text)).not.toContain('Descargas');
  });
});
