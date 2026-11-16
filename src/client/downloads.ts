import { createDownloadsCache, labelDownloads } from '@data/downloads';
import type { DownloadSources } from '@data/downloads';
import type { Locale } from '@i18n/ui';

/**
 * Fills every download block on the page: asks the stores it declares, writes the count, drops the
 * citation of any store that did not answer, and shows the block. A block no store answered for
 * stays hidden — as it is with JavaScript off. Each project is asked once, however many blocks
 * show it.
 */
export async function hydrateDownloads(root: ParentNode, fetcher: typeof fetch = fetch) {
  const downloadsOf = createDownloadsCache(fetcher);
  const blocks = [...root.querySelectorAll<HTMLElement>('[data-downloads]')];

  await Promise.all(
    blocks.map(async (block) => {
      const sources = JSON.parse(block.getAttribute('data-downloads') ?? '{}') as DownloadSources;
      const lang = (block.getAttribute('data-lang') ?? 'es') as Locale;
      const label = labelDownloads(await downloadsOf(sources), lang);
      if (!label) return;

      const text = block.querySelector('[data-downloads-text]');
      if (text) text.textContent = label.text;

      const answered = new Set(label.sources.map((source) => source.href));
      for (const item of block.querySelectorAll('[data-downloads-item]')) {
        if (!answered.has(item.getAttribute('data-downloads-item') ?? '')) item.remove();
      }
      block.removeAttribute('hidden');
    }),
  );
}
