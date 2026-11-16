import type { Locale } from '@i18n/ui';

/** Where a project's download count is published. Each key names the package in that store. */
export interface DownloadSources {
  /** PyPI package name. */
  pypi?: string;
  /** Open VSX extension id, `publisher.name`. */
  openvsx?: string;
  /** VS Code Marketplace extension id, `publisher.name`. */
  marketplace?: string;
}

/**
 * Kept apart because the stores measure different things: pypistats publishes a reliable last
 * month (its "overall" covers only some 180 days), the VS Code stores only an all-time count.
 */
export interface Downloads {
  perMonth?: number;
  total?: number;
}

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

async function pypiPerMonth(fetcher: typeof fetch, name: string) {
  const body = await json(fetcher, `https://pypistats.org/api/packages/${name}/recent`);
  return count((body as { data?: { last_month?: unknown } } | undefined)?.data?.last_month);
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
 * Asks each store the project declares. A store that is down or answers oddly drops its share:
 * a missing number is shown as no number, and never fails the build.
 */
export async function fetchDownloads(
  sources: DownloadSources | undefined,
  fetcher: typeof fetch = fetch,
): Promise<Downloads> {
  if (!sources) return {};
  const [perMonth, vsx, market] = await Promise.all([
    sources.pypi ? pypiPerMonth(fetcher, sources.pypi) : undefined,
    sources.openvsx ? openVsxTotal(fetcher, sources.openvsx) : undefined,
    sources.marketplace ? marketplaceTotal(fetcher, sources.marketplace) : undefined,
  ]);
  const totals = [vsx, market].filter((n): n is number => n !== undefined);

  const downloads: Downloads = {};
  if (perMonth !== undefined) downloads.perMonth = perMonth;
  if (totals.length) downloads.total = totals.reduce((a, b) => a + b, 0);
  return downloads;
}

/** One request per project per build: the cards and write-ups of both languages share it. */
export function createDownloadsCache(fetcher: typeof fetch = fetch) {
  const cache = new Map<string, Promise<Downloads>>();
  return (sources: DownloadSources | undefined): Promise<Downloads> => {
    const key = JSON.stringify(sources ?? {});
    let pending = cache.get(key);
    if (!pending) {
      pending = fetchDownloads(sources, fetcher);
      cache.set(key, pending);
    }
    return pending;
  };
}

/** The build's shared cache. */
export const downloadsOf = createDownloadsCache();

const words = {
  es: { perMonth: 'descargas al mes', total: 'descargas' },
  en: { perMonth: 'downloads a month', total: 'downloads' },
} satisfies Record<Locale, Record<keyof Downloads, string>>;

/** "811 descargas al mes", "1,794 downloads": always with its unit, never as users. */
export function formatDownloads(downloads: Downloads, lang: Locale): string | undefined {
  const number = (n: number) => new Intl.NumberFormat(lang).format(n);
  if (downloads.perMonth !== undefined) {
    return `${number(downloads.perMonth)} ${words[lang].perMonth}`;
  }
  if (downloads.total !== undefined) return `${number(downloads.total)} ${words[lang].total}`;
  return undefined;
}
