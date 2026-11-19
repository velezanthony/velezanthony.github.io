const SUFFIX = { '': 1, k: 1e3, M: 1e6, B: 1e9 } as const;

/** shields.io's `value`: "811/month", or rounded past a thousand, "1.2k/month". */
export function parseShieldsMonthly(
  value: unknown,
): { count: number; approximate?: true } | undefined {
  const match = typeof value === 'string' ? /^([\d.]+)([kMB]?)\/month$/.exec(value) : null;
  if (!match) return undefined;
  const [, digits, suffix] = match as unknown as [string, string, keyof typeof SUFFIX];
  const n = Number(digits);
  if (!Number.isFinite(n)) return undefined;
  const result = { count: Math.round(n * SUFFIX[suffix]) };
  return suffix === '' ? result : { ...result, approximate: true };
}
