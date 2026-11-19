import { describe, expect, it } from 'vitest';

import { formatDownloads } from './format';

describe('formatDownloads', () => {
  it('says per month, in each language', () => {
    expect(formatDownloads({ perMonth: 811 }, 'es')).toBe('811 descargas al mes');
    expect(formatDownloads({ perMonth: 811 }, 'en')).toBe('811 downloads a month');
  });

  it('says nothing about time for an all-time total, and groups thousands', () => {
    expect(formatDownloads({ total: 1794 }, 'es')).toBe('1794 descargas');
    expect(formatDownloads({ total: 12794 }, 'es')).toBe('12.794 descargas');
    expect(formatDownloads({ total: 1794 }, 'en')).toBe('1,794 downloads');
  });

  /* Intl joins number and "mil" with a no-break space, so they never part across lines. */
  it('words an approximate count compactly, without false precision', () => {
    expect(formatDownloads({ perMonth: 1200, approximate: true }, 'es')).toBe(
      '1,2 mil descargas al mes',
    );
    expect(formatDownloads({ perMonth: 1200, approximate: true }, 'en')).toBe(
      '1.2K downloads a month',
    );
  });

  it('is undefined when there is nothing to say', () => {
    expect(formatDownloads({}, 'es')).toBeUndefined();
  });
});
