import { describe, expect, it } from 'vitest';

import type { Job, Study } from '@data/types';
import { render, text } from '@/test/render';
import Timeline from './Timeline.astro';

const job = (company: string, start: Job['start'], end: Job['end']): Job => ({
  company,
  role: { es: 'Desarrollador', en: 'Developer' },
  start,
  end,
  highlights: { es: [], en: [] },
  stack: [],
});
const study: Study = {
  title: { es: 'Grado', en: 'Degree' },
  abbr: 'DAM',
  school: 'School',
  startYear: 2019,
  endYear: 2021,
};
const jobs = [job('Now', '2025-10', null), job('Before', '2021-06', '2025-09')];

describe('Timeline', () => {
  it('renders each job in the page language, newest first', async () => {
    const doc = await render(Timeline, { lang: 'en', jobs, studies: [] });
    const headings = [...doc.querySelectorAll('h3')].map(text);
    expect(headings).toEqual(['Now', 'Before']);
    expect(text(doc)).toContain('Developer');
  });

  it('closes an open role with the present label', async () => {
    expect(text(await render(Timeline, { lang: 'en', jobs, studies: [] }))).toContain('Present');
    expect(text(await render(Timeline, { lang: 'es', jobs, studies: [] }))).toContain('Actualidad');
  });

  it('places a study between the jobs it falls between', async () => {
    const doc = await render(Timeline, { lang: 'en', jobs: [jobs[1]!], studies: [study] });
    expect(text(doc).indexOf('Before')).toBeLessThan(text(doc).indexOf('DAM'));
  });

  /* The education rule draws its own line; a closing border would double it. */
  it('draws the closing border only when a job ends the line', async () => {
    const withJobLast = await render(Timeline, { lang: 'en', jobs, studies: [] });
    const withStudyLast = await render(Timeline, {
      lang: 'en',
      jobs: [jobs[1]!],
      studies: [study],
    });
    expect(withJobLast.body.firstElementChild?.classList.contains('border-b')).toBe(true);
    expect(withStudyLast.body.firstElementChild?.classList.contains('border-b')).toBe(false);
  });

  describe('on paper', () => {
    const cv = () =>
      render(Timeline, {
        lang: 'es',
        jobs: [{ ...jobs[1]!, stack: ['Python'] }],
        studies: [study],
        variant: 'cv',
      });

    /* A job may break across pages, so a tall one no longer leaves the page before it a fifth
       empty; its heading never ends a page alone. */
    it('keeps each job heading with what follows it', async () => {
      const header = (await cv()).querySelector('article > header')!;
      expect(header.classList.contains('break-after-avoid')).toBe(true);
    });

    it('keeps a study rule with the entry after it', async () => {
      /* The innermost div naming the study: the rule itself, not a container around it. */
      const rule = [...(await cv()).querySelectorAll('div')].find(
        (d) => d.textContent?.includes('DAM') && !d.querySelector('div'),
      )!;
      expect(rule.classList.contains('break-after-avoid')).toBe(true);
    });

    /* Every job's technologies are already grouped in the CV's own stack section. */
    it('leaves the per-job stack line off the printed page', async () => {
      const stack = (await cv()).querySelector('article .stack-row')!;
      expect(stack.classList.contains('print-hidden')).toBe(true);
    });
  });
});
