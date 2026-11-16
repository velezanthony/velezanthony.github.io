import { createCountsCache, formatDownloads, mergeCounts, toDownloads } from '@data/downloads';
import type { DownloadSources, StoreCounts } from '@data/downloads';
import type { Locale } from '@i18n/ui';

const read = <T>(el: Element, attribute: string, fallback: T): T => {
  try {
    return JSON.parse(el.getAttribute(attribute) ?? '') as T;
  } catch {
    return fallback;
  }
};

/**
 * Refreshes every download block on the page. The build wrote its own counts into the page — read
 * by the server, pypistats included — and those stay wherever the browser cannot do better: each
 * store asked here replaces its build figure only if it answers. A citation shows for every store
 * with a count, from either side; a block with none stays hidden. Each project is asked once.
 */
export async function hydrateDownloads(root: ParentNode, fetcher: typeof fetch = fetch) {
  const countsOf = createCountsCache(fetcher, 'browser');

  await Promise.all(
    [...root.querySelectorAll('[data-downloads]')].map(async (block) => {
      const sources = read<DownloadSources>(block, 'data-downloads', {});
      const built = read<StoreCounts>(block, 'data-counts', {});
      const lang = (block.getAttribute('data-lang') ?? 'es') as Locale;

      const counts = mergeCounts(built, await countsOf(sources));
      const text = formatDownloads(toDownloads(sources, counts), lang);
      if (text === undefined) return;

      const slot = block.querySelector('[data-downloads-text]');
      if (slot) slot.textContent = text;
      for (const item of block.querySelectorAll('[data-downloads-item]')) {
        const store = item.getAttribute('data-downloads-item') as keyof StoreCounts;
        item.toggleAttribute('hidden', counts[store] === undefined);
      }
      block.removeAttribute('hidden');
    }),
  );
}
