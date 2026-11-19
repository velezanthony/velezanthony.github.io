import type { Job, Study } from '@/data/types';

export type TimelineEntry =
  { start: string; kind: 'job'; job: Job } | { start: string; kind: 'study'; study: Study };

/**
 * Jobs and studies on one line, newest first, so the years between jobs are accounted for. A
 * study starts with its academic year, in September. A truncated timeline keeps the newest jobs
 * and skips the studies: there is no gap to explain.
 */
export function timelineEntries(jobs: Job[], studies: Study[], limit?: number): TimelineEntry[] {
  const shown = limit ? jobs.slice(0, limit) : jobs;
  return [
    ...shown.map((job): TimelineEntry => ({ start: job.start, kind: 'job', job })),
    ...(limit ? [] : studies).map((study): TimelineEntry => ({
      start: `${study.startYear}-09`,
      kind: 'study',
      study,
    })),
  ].sort((a, b) => b.start.localeCompare(a.start));
}
