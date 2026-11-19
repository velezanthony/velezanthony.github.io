import type { Locale } from '@/core/i18n/locales';

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
 * Each store's own figure, kept apart so a fresh one can replace a stale one store by store.
 * PyPI is downloads in the last month; the VS Code stores, all-time downloads.
 */
export interface StoreCounts {
  pypi?: { count: number; approximate?: boolean };
  openvsx?: number;
  marketplace?: number;
}

/**
 * Who asks. The build reads pypistats itself, exact. The browser cannot — pypistats sends no CORS
 * header — and reads the same figure through shields.io, which rounds past a thousand.
 */
export type Asker = 'build' | 'browser';

/**
 * Kept apart because the stores measure different things: PyPI's last month is reliable (its
 * "overall" covers only some 180 days), the VS Code stores publish only an all-time count.
 */
export interface Downloads {
  perMonth?: number;
  total?: number;
  /** A rounded shields.io figure ("1.2k/month"), shown as such. */
  approximate?: boolean;
  /** The stores with a count, each linked to the public page where it can be checked. */
  sources: Citation[];
}

export interface Citation {
  label: string;
  href: string;
}

const citations = {
  pypi: (name: string) => ({ label: 'PyPI', href: `https://pypistats.org/packages/${name}` }),
  openvsx: (id: string) => ({
    label: 'Open VSX',
    href: `https://open-vsx.org/extension/${id.replace('.', '/')}`,
  }),
  marketplace: (id: string) => ({
    label: 'Marketplace',
    href: `https://marketplace.visualstudio.com/items?itemName=${id}`,
  }),
} satisfies Record<keyof DownloadSources, (id: string) => Citation>;

/** Every store the project declares, cited, in a fixed order, with the store it names. */
export function citationsOf(
  sources: DownloadSources,
): (Citation & { store: keyof DownloadSources })[] {
  return (Object.keys(citations) as (keyof DownloadSources)[])
    .filter((store) => sources[store] !== undefined)
    .map((store) => ({ store, ...citations[store](sources[store]!) }));
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

/**
 * The browser's fresh counts over the build's, store by store: a store the browser could not
 * reach keeps its build figure. A rounded fresh PyPI figure does not replace an exact one.
 */
export function mergeCounts(built: StoreCounts, fresh: StoreCounts): StoreCounts {
  const merged: StoreCounts = { ...built, ...fresh };
  if (fresh.pypi?.approximate && built.pypi && !built.pypi.approximate) merged.pypi = built.pypi;
  return merged;
}

/** Counts into what a page says: a monthly PyPI figure or a summed all-time one, with sources. */
export function toDownloads(sources: DownloadSources, counts: StoreCounts): Downloads {
  const downloads: Downloads = { sources: [] };
  if (counts.pypi && sources.pypi) {
    downloads.perMonth = counts.pypi.count;
    if (counts.pypi.approximate) downloads.approximate = true;
    downloads.sources.push(citations.pypi(sources.pypi));
  }
  const totals: number[] = [];
  if (counts.openvsx !== undefined && sources.openvsx) {
    totals.push(counts.openvsx);
    downloads.sources.push(citations.openvsx(sources.openvsx));
  }
  if (counts.marketplace !== undefined && sources.marketplace) {
    totals.push(counts.marketplace);
    downloads.sources.push(citations.marketplace(sources.marketplace));
  }
  if (totals.length) downloads.total = totals.reduce((a, b) => a + b, 0);
  return downloads;
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

const words = {
  es: { perMonth: 'descargas al mes', total: 'descargas' },
  en: { perMonth: 'downloads a month', total: 'downloads' },
} satisfies Record<Locale, Record<'perMonth' | 'total', string>>;

/** "811 descargas al mes", "1,794 downloads": always with its unit, never as users. */
export function formatDownloads(
  downloads: Pick<Downloads, 'perMonth' | 'total' | 'approximate'>,
  lang: Locale,
): string | undefined {
  const number = (n: number) =>
    new Intl.NumberFormat(lang, downloads.approximate ? { notation: 'compact' } : {}).format(n);
  if (downloads.perMonth !== undefined) {
    return `${number(downloads.perMonth)} ${words[lang].perMonth}`;
  }
  if (downloads.total !== undefined) return `${number(downloads.total)} ${words[lang].total}`;
  return undefined;
}
