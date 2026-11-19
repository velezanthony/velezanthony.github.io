import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { formatDate, formatMonth, formatRange } from './format';

/* One zone on each side of Greenwich. Building the date in UTC but printing it in local time
   only slips a month to the west; building it in local time but printing in UTC only slips to
   the east. UTC itself, where CI runs, hides both. */
describe.each(['America/Los_Angeles', 'Europe/Madrid'])('in %s', (zone) => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = zone;
  });
  afterAll(() => {
    process.env.TZ = original;
  });

  describe('formatMonth', () => {
    it('abbreviates the month in each locale', () => {
      expect(formatMonth('es', '2025-10')).toBe('oct 2025');
      expect(formatMonth('en', '2025-10')).toBe('Oct 2025');
    });

    it('does not drift at a month boundary', () => {
      expect(formatMonth('en', '2024-01')).toBe('Jan 2024');
      expect(formatMonth('en', '2024-12')).toBe('Dec 2024');
    });
  });

  describe('formatDate', () => {
    it('spells the whole day out in each locale', () => {
      expect(formatDate('es', '2026-11-10')).toBe('10 de noviembre de 2026');
      expect(formatDate('en', '2026-11-10')).toBe('10 November 2026');
    });

    it('does not drift at a year boundary', () => {
      expect(formatDate('en', '2026-01-01')).toBe('1 January 2026');
      expect(formatDate('en', '2026-12-31')).toBe('31 December 2026');
    });
  });

  describe('formatRange', () => {
    it('joins both ends with an en dash', () => {
      expect(formatRange('en', '2022-03', '2025-10', 'Present')).toBe('Mar 2022 – Oct 2025');
    });

    it('closes an open range with the label it is given', () => {
      expect(formatRange('es', '2025-10', null, 'Actualidad')).toBe('oct 2025 – Actualidad');
    });
  });
});
