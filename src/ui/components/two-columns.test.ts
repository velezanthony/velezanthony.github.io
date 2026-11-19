import { describe, expect, it } from 'vitest';

import type { Job } from '@/data/types';
import CaseStudy from '@/pages/[...lang]/[projects]/_partials/CaseStudy.astro';
import Education from '@/pages/[...lang]/[experience]/_partials/Education.astro';
import { render } from '@/test/render';
import ProjectCard from './ProjectCard.astro';
import Timeline from './Timeline.astro';

const job: Job = {
  company: 'Acme',
  role: { es: 'Dev', en: 'Dev' },
  start: '2024-01',
  end: null,
  highlights: { es: ['Una línea'], en: ['A line'] },
  stack: ['Python'],
};

/* Every two-column content layout gives its right column the same width and the content the rest.
   The home's hero is the exception, by choice: its lead keeps the reading measure. */
const layouts: [string, () => Promise<Document>][] = [
  [
    'ProjectCard',
    () =>
      render(ProjectCard, {
        name: 'A',
        tagline: 'B',
        status: 'maintained',
        href: '/a/',
        lang: 'es',
        visual: { kind: 'code', lang: 'python', code: 'x' },
      }),
  ],
  ['ExperienceItem', () => render(Timeline, { lang: 'es', jobs: [job], studies: [] })],
  ['Education', () => render(Education, { lang: 'es' })],
  [
    'CaseStudy',
    () =>
      render(CaseStudy, {
        lang: 'es',
        name: 'A',
        tagline: 'B',
        status: 'maintained',
        role: 'Autor',
        stack: [],
        targets: [],
        compat: [],
        quality: [],
        constraints: [],
        links: [],
        todo: [],
        translationPending: false,
        backHref: '/proyectos/',
      }),
  ],
];

describe('two-column layouts', () => {
  it.each(layouts)(
    '%s: content takes the rest beside a --container-aside column',
    async (_, rendered) => {
      const doc = await rendered();
      /* Below md the single column must be able to shrink: an implicit `auto` column grows to its
       widest unbreakable child, and a terminal block pushed the page 58px sideways at 640. */
      expect(
        [
          ...doc.querySelectorAll('[class*="md:grid-cols-[minmax(0,1fr)_var(--container-aside)]"]'),
        ].every((el) => el.classList.contains('grid-cols-1')),
      ).toBe(true);
      const grid = [...doc.querySelectorAll('[class*="md:grid-cols-"]')].map((el) =>
        el.getAttribute('class')!,
      );
      expect(
        grid.some((c) => c.includes('md:grid-cols-[minmax(0,1fr)_var(--container-aside)]')),
      ).toBe(true);
    },
  );
});
