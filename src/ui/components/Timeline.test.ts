import { describe, expect, it } from 'vitest';

import type { Job, Study } from '@/core/types';
import { render, text } from '@/test-utils';
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
});
