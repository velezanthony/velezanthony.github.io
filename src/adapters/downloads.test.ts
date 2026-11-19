import { describe, expect, it, vi } from 'vitest';

import { createCountsCache, fetchStoreCounts } from './downloads';

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
