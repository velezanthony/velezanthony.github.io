import { describe, expect, it, vi } from 'vitest';

import { createDownloadsCache, fetchDownloads, formatDownloads } from './downloads';

/** A fetch that answers from a table of URL fragments, and fails for anything else. */
function fakeFetch(table: Record<string, unknown>) {
  return vi.fn(async (url: string | URL | Request) => {
    const hit = Object.entries(table).find(([part]) => String(url).includes(part));
    if (!hit) throw new Error(`offline: ${url}`);
    return new Response(JSON.stringify(hit[1]), { status: 200 });
  }) as unknown as typeof fetch;
}

const pypi = { data: { last_day: 34, last_week: 69, last_month: 811 } };
const openVsx = { downloadCount: 730 };
const marketplace = {
  results: [
    {
      extensions: [
        {
          statistics: [
            { statisticName: 'install', value: 8 },
            { statisticName: 'downloadCount', value: 64 },
          ],
        },
      ],
    },
  ],
};

describe('fetchDownloads', () => {
  it('reads PyPI as downloads in the last month', async () => {
    const f = fakeFetch({ 'pypistats.org/api/packages/django-cotton-gallery/recent': pypi });
    expect(await fetchDownloads({ pypi: 'django-cotton-gallery' }, f)).toEqual({
      perMonth: 811,
      sources: [{ label: 'PyPI', href: 'https://pypistats.org/packages/django-cotton-gallery' }],
    });
  });

  /* The two VS Code stores only publish an all-time count: summed, and kept apart from a monthly one. */
  it('adds up Open VSX and the Marketplace as an all-time total', async () => {
    const f = fakeFetch({
      'open-vsx.org/api/velezanthony/cotton-props': openVsx,
      'marketplace.visualstudio.com': marketplace,
    });
    expect(
      await fetchDownloads(
        { openvsx: 'velezanthony.cotton-props', marketplace: 'velezanthony.cotton-props' },
        f,
      ),
    ).toEqual({
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

  /* A store that is down drops its share; the build never fails for a number. */
  it('keeps what it could read when a source fails', async () => {
    const f = fakeFetch({ 'open-vsx.org/api/velezanthony/cotton-props': openVsx });
    expect(
      await fetchDownloads(
        { openvsx: 'velezanthony.cotton-props', marketplace: 'velezanthony.cotton-props' },
        f,
      ),
    ).toEqual({
      total: 730,
      /* Only the stores that answered are cited. */
      sources: [
        { label: 'Open VSX', href: 'https://open-vsx.org/extension/velezanthony/cotton-props' },
      ],
    });
  });

  it('is empty when nothing could be read', async () => {
    expect(await fetchDownloads({ pypi: 'snake-orm' }, fakeFetch({}))).toEqual({ sources: [] });
  });

  it('ignores an answer without the number', async () => {
    const f = fakeFetch({ 'pypistats.org': { data: {} } });
    expect(await fetchDownloads({ pypi: 'snake-orm' }, f)).toEqual({ sources: [] });
  });

  it('asks nothing for a project without sources', async () => {
    const f = fakeFetch({});
    expect(await fetchDownloads(undefined, f)).toEqual({ sources: [] });
    expect(f).not.toHaveBeenCalled();
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

  it('is undefined when there is nothing to say', () => {
    expect(formatDownloads({}, 'es')).toBeUndefined();
  });
});

describe('createDownloadsCache', () => {
  /* Cards and write-ups, in two languages, ask for the same project: one build, one request. */
  it('asks each store once per build, however many pages want the number', async () => {
    const f = fakeFetch({ 'pypistats.org': pypi });
    const downloadsOf = createDownloadsCache(f);
    await Promise.all([
      downloadsOf({ pypi: 'a' }),
      downloadsOf({ pypi: 'a' }),
      downloadsOf({ pypi: 'a' }),
    ]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('keeps projects apart', async () => {
    const f = fakeFetch({ 'pypistats.org': pypi });
    const downloadsOf = createDownloadsCache(f);
    await downloadsOf({ pypi: 'a' });
    await downloadsOf({ pypi: 'b' });
    expect(f).toHaveBeenCalledTimes(2);
  });
});
