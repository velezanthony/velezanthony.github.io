import { describe, expect, it } from 'vitest';

import { parseShieldsMonthly } from './parse';

describe('parseShieldsMonthly', () => {
  it('reads an exact figure', () => {
    expect(parseShieldsMonthly('811/month')).toEqual({ count: 811 });
  });

  it.each([
    ['1.2k/month', 1200],
    ['3M/month', 3_000_000],
  ])('reads %s as a rounded figure', (value, count) => {
    expect(parseShieldsMonthly(value)).toEqual({ count, approximate: true });
  });

  it.each([undefined, 811, 'invalid', '811/week'])('rejects %j', (value) => {
    expect(parseShieldsMonthly(value)).toBeUndefined();
  });
});
