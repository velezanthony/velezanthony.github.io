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
 * Kept apart because the stores measure different things: PyPI's last month is reliable (its
 * "overall" covers only some 180 days), the VS Code stores publish only an all-time count.
 *
 * Read in the browser, not at build: every source here sends CORS headers. PyPI's figure comes
 * through shields.io, because pypistats sends none.
 */
export interface Downloads {
  perMonth?: number;
  total?: number;
  /** shields.io rounds past a thousand ("1.2k/month"): the count is then shown as such. */
  approximate?: boolean;
  /** The stores that answered, each linked to the public page where its number can be checked. */
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
): { count: number; approximate: boolean } | undefined {
  const match = typeof value === 'string' ? /^([\d.]+)([kMB]?)\/month$/.exec(value) : null;
  if (!match) return undefined;
  const [, digits, suffix] = match as unknown as [string, string, keyof typeof SUFFIX];
  const n = Number(digits);
  if (!Number.isFinite(n)) return undefined;
  return { count: Math.round(n * SUFFIX[suffix]), approximate: suffix !== '' };
}

async function pypiPerMonth(fetcher: typeof fetch, name: string) {
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

/** Every store the project declares, cited: what the page renders before the browser asks. */
export function citationsOf(sources: DownloadSources): Citation[] {
  return (Object.keys(citations) as (keyof DownloadSources)[])
    .filter((store) => sources[store] !== undefined)
    .map((store) => citations[store](sources[store]!));
}

/**
 * Asks each store the project declares. A store that is down or answers oddly drops its share:
 * a missing number is shown as no number, and never fails the build.
 */
export async function fetchDownloads(
  sources: DownloadSources | undefined,
  fetcher: typeof fetch = fetch,
): Promise<Downloads> {
  if (!sources) return { sources: [] };
  const [perMonth, vsx, market] = await Promise.all([
    sources.pypi ? pypiPerMonth(fetcher, sources.pypi) : undefined,
    sources.openvsx ? openVsxTotal(fetcher, sources.openvsx) : undefined,
    sources.marketplace ? marketplaceTotal(fetcher, sources.marketplace) : undefined,
  ]);
  const totals = [vsx, market].filter((n): n is number => n !== undefined);

  const downloads: Downloads = { sources: [] };
  if (perMonth !== undefined) {
    downloads.perMonth = perMonth.count;
    if (perMonth.approximate) downloads.approximate = true;
    downloads.sources.push(citations.pypi(sources.pypi!));
  }
  if (totals.length) downloads.total = totals.reduce((a, b) => a + b, 0);
  if (vsx !== undefined) downloads.sources.push(citations.openvsx(sources.openvsx!));
  if (market !== undefined) downloads.sources.push(citations.marketplace(sources.marketplace!));
  return downloads;
}

/** One request per project per page: a card list asks once per project however it renders. */
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

/** A count ready for a page: worded in its language, with the sources that back it. */
export interface DownloadsLabel {
  text: string;
  sources: Citation[];
}

export function labelDownloads(downloads: Downloads, lang: Locale): DownloadsLabel | undefined {
  const text = formatDownloads(downloads, lang);
  return text === undefined ? undefined : { text, sources: downloads.sources };
}
