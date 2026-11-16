import { describe, expect, it } from 'vitest';

import { currentHeading } from './toc';

/* Section tops as the reader scrolls, relative to the viewport. */
const at = (...tops: number[]) => tops.map((top, i) => ({ id: `s${i + 1}`, top }));

describe('currentHeading', () => {
  it('is the last section whose heading has passed the reading line', () => {
    expect(currentHeading(at(-900, -200, 60, 700), 120)).toBe('s3');
  });

  it('is the first section before the reader reaches it, so the list is never blank', () => {
    expect(currentHeading(at(400, 1200), 120)).toBe('s1');
  });

  it('is the last section once everything has scrolled past', () => {
    expect(currentHeading(at(-2000, -1200, -300), 120)).toBe('s3');
  });

  it('is undefined with no sections', () => {
    expect(currentHeading([], 120)).toBeUndefined();
  });

  /* A short last section ends the page before its heading reaches the reading line: at the
     bottom, the last section is the one being read. */
  it('is the last section once the page cannot scroll further', () => {
    expect(currentHeading(at(-900, -320, 357), 120, { atBottom: true })).toBe('s3');
  });

  it('follows the reading line while there is still page to scroll', () => {
    expect(currentHeading(at(-900, -320, 357), 120, { atBottom: false })).toBe('s2');
  });
});
