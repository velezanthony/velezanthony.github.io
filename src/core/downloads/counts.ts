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
