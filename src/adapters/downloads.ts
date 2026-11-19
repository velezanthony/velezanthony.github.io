import { parseShieldsMonthly } from '@/core/downloads/parse';
import type { DownloadSources, StoreCounts } from '@/core/downloads/counts';

/**
 * Who asks. The build reads pypistats itself, exact. The browser cannot — pypistats sends no CORS
 * header — and reads the same figure through shields.io, which rounds past a thousand.
 */
export type Asker = 'build' | 'browser';

const TIMEOUT_MS = 8000;

async function json(fetcher: typeof fetch, url: string, init?: RequestInit): Promise<unknown> {
  try {
    const res = await fetcher(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok ? await res.json() : undefined;
  } catch {
    return undefined;
  }
}

const count = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

async function pypiMonthly(fetcher: typeof fetch, name: string, asker: Asker) {
  if (asker === 'build') {
    const body = await json(fetcher, `https://pypistats.org/api/packages/${name}/recent`);
    const n = count((body as { data?: { last_month?: unknown } } | undefined)?.data?.last_month);
    return n === undefined ? undefined : { count: n };
  }
  const body = await json(fetcher, `https://img.shields.io/pypi/dm/${name}.json`);
  return parseShieldsMonthly((body as { value?: unknown } | undefined)?.value);
}

async function openVsxTotal(fetcher: typeof fetch, id: string) {
  const [publisher, name] = id.split('.');
  const body = await json(fetcher, `https://open-vsx.org/api/${publisher}/${name}`);
  return count((body as { downloadCount?: unknown } | undefined)?.downloadCount);
}

async function marketplaceTotal(fetcher: typeof fetch, id: string) {
  const body = await json(
    fetcher,
    'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json;api-version=7.2-preview.1',
      },
      /* filterType 7 is the extension id; flag 256 includes its statistics. */
      body: JSON.stringify({ filters: [{ criteria: [{ filterType: 7, value: id }] }], flags: 256 }),
    },
  );
  type Stat = { statisticName: string; value: unknown };
  const stats = (body as { results?: { extensions?: { statistics?: Stat[] }[] }[] } | undefined)
    ?.results?.[0]?.extensions?.[0]?.statistics;
  return count(stats?.find((s) => s.statisticName === 'downloadCount')?.value);
}

/**
 * Asks each store the project declares. A store that is down or answers oddly is left out: a
 * missing number is shown as no number, and never fails the build or the page.
 */
export async function fetchStoreCounts(
  sources: DownloadSources | undefined,
  fetcher: typeof fetch,
  asker: Asker,
): Promise<StoreCounts> {
  if (!sources) return {};
  const [pypi, openvsx, marketplace] = await Promise.all([
    sources.pypi ? pypiMonthly(fetcher, sources.pypi, asker) : undefined,
    sources.openvsx ? openVsxTotal(fetcher, sources.openvsx) : undefined,
    sources.marketplace ? marketplaceTotal(fetcher, sources.marketplace) : undefined,
  ]);
  const counts: StoreCounts = {};
  if (pypi) counts.pypi = pypi;
  if (openvsx !== undefined) counts.openvsx = openvsx;
  if (marketplace !== undefined) counts.marketplace = marketplace;
  return counts;
}

/** One request per project: cards and write-ups, in both languages, share it. */
export function createCountsCache(fetcher: typeof fetch, asker: Asker) {
  const cache = new Map<string, Promise<StoreCounts>>();
  return (sources: DownloadSources | undefined): Promise<StoreCounts> => {
    const key = JSON.stringify(sources ?? {});
    let pending = cache.get(key);
    if (!pending) {
      pending = fetchStoreCounts(sources, fetcher, asker);
      cache.set(key, pending);
    }
    return pending;
  };
}

/** The build's one cache of store counts: read by the server, pypistats included, once per project
    for every page that shows it. Only the build reads it; the browser makes its own cache. */
export const buildCountsOf = createCountsCache(fetch, 'build');
