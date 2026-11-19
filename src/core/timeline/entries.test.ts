import { describe, expect, it } from 'vitest';

import type { Job, Study } from '@/core/types';
import { timelineEntries } from './entries';

const job = (start: Job['start']) => ({ start, company: start }) as Job;
const study = (startYear: number) => ({ startYear, abbr: String(startYear) }) as Study;

const jobs = [job('2025-10'), job('2023-02'), job('2021-06')];
const studies = [study(2022), study(2019)];

const order = (entries: ReturnType<typeof timelineEntries>) =>
  entries.map((e) => (e.kind === 'job' ? e.job.company : `study ${e.study.abbr}`));

describe('timelineEntries', () => {
  /* Studies share the line so the years between jobs are accounted for. */
  it('interleaves jobs and studies, newest first', () => {
    expect(order(timelineEntries(jobs, studies))).toEqual([
      '2025-10',
      '2023-02',
      'study 2022',
      '2021-06',
      'study 2019',
    ]);
  });

  it('places a study at the start of its academic year', () => {
    expect(timelineEntries([], [study(2022)])[0]?.start).toBe('2022-09');
  });

  /* A truncated timeline has no gap to explain. */
  it('keeps only the newest jobs when limited, and no studies', () => {
    expect(order(timelineEntries(jobs, studies, 2))).toEqual(['2025-10', '2023-02']);
  });
});
