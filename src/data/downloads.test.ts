import { describe, expect, it, vi } from 'vitest';

import {
  createCountsCache,
  fetchStoreCounts,
  formatDownloads,
  mergeCounts,
  toDownloads,
} from './downloads';

/** A fetch that answers from a table of URL fragments, and fails for anything else. */
function fakeFetch(table: Record<string, unknown>) {
  return vi.fn(async (url: string | URL | Request) => {
    const hit = Object.entries(table).find(([part]) => String(url).includes(part));
    if (!hit) throw new Error(`offline: ${url}`);
    return new Response(JSON.stringify(hit[1]), { status: 200 });
  }) as unknown as typeof fetch;
}

const pypistats = { data: { last_day: 34, last_week: 69, last_month: 811 } };
const shields = { value: '811/month' };
const openVsx = { downloadCount: 730 };
const marketplace = {
  results: [{ extensions: [{ statistics: [{ statisticName: 'downloadCount', value: 64 }] }] }],
};
const vscode = { openvsx: 'velezanthony.cotton-props', marketplace: 'velezanthony.cotton-props' };

describe('fetchStoreCounts', () => {
  /* At build the server reads pypistats itself: exact, and no CORS to worry about. */
  it('reads PyPI from pypistats at build', async () => {
    const f = fakeFetch({ 'pypistats.org/api/packages/gallery/recent': pypistats });
    expect(await fetchStoreCounts({ pypi: 'gallery' }, f, 'build')).toEqual({
      pypi: { count: 811 },
    });
  });

  /* In the browser pypistats is blocked (no CORS header); shields.io serves the same figure. */
  it('reads PyPI through shields.io in the browser', async () => {
    const f = fakeFetch({ 'img.shields.io/pypi/dm/gallery.json': shields });
    expect(await fetchStoreCounts({ pypi: 'gallery' }, f, 'browser')).toEqual({
      pypi: { count: 811 },
    });
  });

  it('marks a rounded shields figure as approximate', async () => {
    const f = fakeFetch({ 'img.shields.io': { value: '1.2k/month' } });
    expect(await fetchStoreCounts({ pypi: 'a' }, f, 'browser')).toEqual({
      pypi: { count: 1200, approximate: true },
    });
  });

  it('reads both VS Code stores', async () => {
    const f = fakeFetch({
      'open-vsx.org/api': openVsx,
      'marketplace.visualstudio.com': marketplace,
    });
    expect(await fetchStoreCounts(vscode, f, 'build')).toEqual({ openvsx: 730, marketplace: 64 });
  });

  it('leaves out a store that did not answer, or answered without the number', async () => {
    const f = fakeFetch({
      'open-vsx.org/api': openVsx,
      'marketplace.visualstudio.com': { results: [] },
    });
    expect(await fetchStoreCounts(vscode, f, 'build')).toEqual({ openvsx: 730 });
  });

  it('asks nothing for a project without sources', async () => {
    const f = fakeFetch({});
    expect(await fetchStoreCounts(undefined, f, 'build')).toEqual({});
    expect(f).not.toHaveBeenCalled();
  });
});

describe('mergeCounts', () => {
  /* The browser's fresh count wins; a store it could not reach keeps the build's. */
  it('takes the fresh count, and the build count where the browser got none', () => {
    expect(mergeCounts({ openvsx: 700, marketplace: 60 }, { openvsx: 730 })).toEqual({
      openvsx: 730,
      marketplace: 60,
    });
  });

  /* shields rounds past a thousand: an exact build figure is not traded for a rounded one. */
  it('keeps an exact build figure over a rounded fresh one', () => {
    expect(
      mergeCounts({ pypi: { count: 1234 } }, { pypi: { count: 1200, approximate: true } }),
    ).toEqual({
      pypi: { count: 1234 },
    });
  });

  it('takes a rounded fresh figure when the build has none', () => {
    expect(mergeCounts({}, { pypi: { count: 1200, approximate: true } })).toEqual({
      pypi: { count: 1200, approximate: true },
    });
  });
});

describe('toDownloads', () => {
  it('turns PyPI into downloads in the last month, citing pypistats', () => {
    expect(toDownloads({ pypi: 'gallery' }, { pypi: { count: 811 } })).toEqual({
      perMonth: 811,
      sources: [{ label: 'PyPI', href: 'https://pypistats.org/packages/gallery' }],
    });
  });

  /* The VS Code stores publish only an all-time count: summed, never mixed with a monthly one. */
  it('sums the VS Code stores into an all-time total, citing each that has a count', () => {
    expect(toDownloads(vscode, { openvsx: 730, marketplace: 64 })).toEqual({
      total: 794,
      sources: [
        { label: 'Open VSX', href: 'https://open-vsx.org/extension/velezanthony/cotton-props' },
        {
          label: 'Marketplace',
          href: 'https://marketplace.visualstudio.com/items?itemName=velezanthony.cotton-props',
        },
      ],
    });
  });

  it('cites only the stores with a count', () => {
    expect(toDownloads(vscode, { openvsx: 730 }).sources.map((s) => s.label)).toEqual(['Open VSX']);
  });

  it('carries an approximate figure as such', () => {
    expect(toDownloads({ pypi: 'a' }, { pypi: { count: 1200, approximate: true } })).toMatchObject({
      perMonth: 1200,
      approximate: true,
    });
  });
});

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

describe('createCountsCache', () => {
  /* Cards and write-ups, in two languages, ask for the same project: one request each. */
  it('asks each store once, however many times a project is asked for', async () => {
    const f = fakeFetch({ 'pypistats.org': pypistats });
    const countsOf = createCountsCache(f, 'build');
    await Promise.all([countsOf({ pypi: 'a' }), countsOf({ pypi: 'a' }), countsOf({ pypi: 'a' })]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('keeps projects apart', async () => {
    const f = fakeFetch({ 'pypistats.org': pypistats });
    const countsOf = createCountsCache(f, 'build');
    await countsOf({ pypi: 'a' });
    await countsOf({ pypi: 'b' });
    expect(f).toHaveBeenCalledTimes(2);
  });
});
