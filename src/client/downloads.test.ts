import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';

import { hydrateDownloads } from './downloads';

function fakeFetch(table: Record<string, unknown>) {
  return vi.fn(async (url: string | URL | Request) => {
    const hit = Object.entries(table).find(([part]) => String(url).includes(part));
    if (!hit) throw new Error(`offline: ${url}`);
    return new Response(JSON.stringify(hit[1]), { status: 200 });
  }) as unknown as typeof fetch;
}

/** The markup DownloadCount renders: hidden, no number, one cited item per declared store. */
const block = (sources: object, lang = 'es') => {
  const items = [
    ['openvsx', 'https://open-vsx.org/extension/velezanthony/cotton-props', 'Open VSX'],
    [
      'marketplace',
      'https://marketplace.visualstudio.com/items?itemName=velezanthony.cotton-props',
      'Marketplace',
    ],
    ['pypi', 'https://pypistats.org/packages/snake-orm', 'PyPI'],
  ]
    .filter(([store]) => store! in sources)
    .map(
      ([, href, label]) =>
        `<span data-downloads-item="${href}"><a href="${href}">${label}</a></span>`,
    )
    .join('');
  return parseHTML(
    `<div><p hidden data-downloads='${JSON.stringify(sources)}' data-lang="${lang}"><span data-downloads-text></span>${items}</p></div>`,
  ).document;
};

describe('hydrateDownloads', () => {
  it('fills in the count and shows the block', async () => {
    const doc = block({ pypi: 'snake-orm' });
    await hydrateDownloads(
      doc,
      fakeFetch({ 'img.shields.io/pypi/dm/snake-orm.json': { value: '42/month' } }),
    );
    const el = doc.querySelector('[data-downloads]')!;
    expect(el.hasAttribute('hidden')).toBe(false);
    expect(el.querySelector('[data-downloads-text]')!.textContent).toBe('42 descargas al mes');
  });

  /* A store that did not answer is not cited. */
  it('drops the citation of a store that did not answer', async () => {
    const doc = block(
      { openvsx: 'velezanthony.cotton-props', marketplace: 'velezanthony.cotton-props' },
      'en',
    );
    await hydrateDownloads(doc, fakeFetch({ 'open-vsx.org/api': { downloadCount: 730 } }));
    expect(doc.querySelector('[data-downloads-text]')!.textContent).toBe('730 downloads');
    expect([...doc.querySelectorAll('[data-downloads-item] a')].map((a) => a.textContent)).toEqual([
      'Open VSX',
    ]);
  });

  /* Nothing answered: the block stays hidden, as it is without JavaScript. */
  it('leaves the block hidden when no store answered', async () => {
    const doc = block({ pypi: 'snake-orm' });
    await hydrateDownloads(doc, fakeFetch({}));
    expect(doc.querySelector('[data-downloads]')!.hasAttribute('hidden')).toBe(true);
  });

  it('asks each project once however many blocks show it', async () => {
    const doc = parseHTML(
      `<div>${[1, 2].map(() => `<p hidden data-downloads='{"pypi":"a"}' data-lang="es"><span data-downloads-text></span></p>`).join('')}</div>`,
    ).document;
    const f = fakeFetch({ 'img.shields.io': { value: '42/month' } });
    await hydrateDownloads(doc, f);
    expect(f).toHaveBeenCalledTimes(1);
  });
});
