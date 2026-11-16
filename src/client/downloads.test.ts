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

/** What DownloadCount renders: the build's counts and text, one item per declared store, hidden
    where the build got no count. */
function page(sources: object, counts: object, text: string, lang = 'es') {
  const items = Object.keys(sources)
    .map(
      (store) =>
        `<span data-downloads-item="${store}"${store in counts ? '' : ' hidden'}>${store}</span>`,
    )
    .join('');
  return parseHTML(
    `<div><p${text ? '' : ' hidden'} data-downloads='${JSON.stringify(sources)}' data-counts='${JSON.stringify(counts)}' data-lang="${lang}"><span data-downloads-text>${text}</span>${items}</p></div>`,
  ).document;
}

const textOf = (doc: Document) => doc.querySelector('[data-downloads-text]')!.textContent;
const shown = (doc: Document) =>
  [...doc.querySelectorAll('[data-downloads-item]')]
    .filter((i) => !i.hasAttribute('hidden'))
    .map((i) => i.textContent);

describe('hydrateDownloads', () => {
  it('replaces the build count with a fresh one', async () => {
    const doc = page({ pypi: 'a' }, { pypi: { count: 40 } }, '40 descargas al mes');
    await hydrateDownloads(
      doc,
      fakeFetch({ 'img.shields.io/pypi/dm/a.json': { value: '42/month' } }),
    );
    expect(textOf(doc)).toBe('42 descargas al mes');
  });

  /* shields.io down: the visitor still sees what the build read from pypistats. */
  it('keeps the build count when the browser gets nothing', async () => {
    const doc = page({ pypi: 'a' }, { pypi: { count: 40 } }, '40 descargas al mes');
    await hydrateDownloads(doc, fakeFetch({}));
    expect(textOf(doc)).toBe('40 descargas al mes');
    expect(doc.querySelector('[data-downloads]')!.hasAttribute('hidden')).toBe(false);
  });

  it('merges store by store: a fresh one, and the build one for the store the browser missed', async () => {
    const doc = page(
      { openvsx: 'p.x', marketplace: 'p.x' },
      { openvsx: 700, marketplace: 60 },
      '760 downloads',
      'en',
    );
    await hydrateDownloads(doc, fakeFetch({ 'open-vsx.org/api': { downloadCount: 730 } }));
    expect(textOf(doc)).toBe('790 downloads');
    expect(shown(doc)).toEqual(['openvsx', 'marketplace']);
  });

  /* A store the build missed but the browser reached gets its citation back. */
  it('shows the citation of a store only the browser reached', async () => {
    const doc = page(
      { openvsx: 'p.x', marketplace: 'p.x' },
      { openvsx: 700 },
      '700 downloads',
      'en',
    );
    const marketplace = {
      results: [{ extensions: [{ statistics: [{ statisticName: 'downloadCount', value: 64 }] }] }],
    };
    await hydrateDownloads(doc, fakeFetch({ 'marketplace.visualstudio.com': marketplace }));
    expect(textOf(doc)).toBe('764 downloads');
    expect(shown(doc)).toEqual(['openvsx', 'marketplace']);
  });

  it('shows a block the build left hidden, once the browser has a count', async () => {
    const doc = page({ pypi: 'a' }, {}, '');
    await hydrateDownloads(doc, fakeFetch({ 'img.shields.io': { value: '42/month' } }));
    expect(doc.querySelector('[data-downloads]')!.hasAttribute('hidden')).toBe(false);
    expect(textOf(doc)).toBe('42 descargas al mes');
  });

  it('leaves a block hidden that neither the build nor the browser could fill', async () => {
    const doc = page({ pypi: 'a' }, {}, '');
    await hydrateDownloads(doc, fakeFetch({}));
    expect(doc.querySelector('[data-downloads]')!.hasAttribute('hidden')).toBe(true);
  });

  /* Past a thousand shields rounds; the build's exact figure is not traded for it. */
  it('keeps an exact build figure over a rounded fresh one', async () => {
    const doc = page({ pypi: 'a' }, { pypi: { count: 1234 } }, '1234 descargas al mes');
    await hydrateDownloads(doc, fakeFetch({ 'img.shields.io': { value: '1.2k/month' } }));
    expect(textOf(doc)).toBe('1234 descargas al mes');
  });

  it('asks each project once however many blocks show it', async () => {
    const block = `<p hidden data-downloads='{"pypi":"a"}' data-counts='{}' data-lang="es"><span data-downloads-text></span></p>`;
    const doc = parseHTML(`<div>${block}${block}</div>`).document;
    const f = fakeFetch({ 'img.shields.io': { value: '42/month' } });
    await hydrateDownloads(doc, f);
    expect(f).toHaveBeenCalledTimes(1);
  });
});
