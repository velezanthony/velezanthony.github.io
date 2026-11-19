import { describe, expect, it } from 'vitest';

import { render, text } from '@/test/render';
import DownloadCount from './DownloadCount.astro';

const sources = { openvsx: 'velezanthony.cotton-props', marketplace: 'velezanthony.cotton-props' };
const block = async (props: Record<string, unknown>) =>
  (await render(DownloadCount, { sources, counts: {}, lang: 'es', ...props })).querySelector(
    '[data-downloads]',
  )!;

describe('DownloadCount', () => {
  /* The build's figure is the default: visible without JavaScript, and kept if the browser's
     fresh request fails. */
  it('shows the count the build read', async () => {
    const el = await block({ counts: { openvsx: 730, marketplace: 64 } });
    expect(el.hasAttribute('hidden')).toBe(false);
    expect(text(el.querySelector('[data-downloads-text]'))).toBe('794 descargas');
  });

  it('hands the build counts and sources to the browser', async () => {
    const el = await block({ counts: { openvsx: 730 } });
    expect(JSON.parse(el.getAttribute('data-counts')!)).toEqual({ openvsx: 730 });
    expect(JSON.parse(el.getAttribute('data-downloads')!)).toEqual(sources);
    expect(el.getAttribute('data-lang')).toBe('es');
  });

  /* Every declared store is cited; one the build got no count from waits hidden for the browser. */
  it('cites every declared store, hiding those the build got nothing from', async () => {
    const el = await block({ counts: { openvsx: 730 } });
    const items = [...el.querySelectorAll('[data-downloads-item]')].map((i) => [
      i.getAttribute('data-downloads-item'),
      i.querySelector('a')!.getAttribute('href'),
      i.hasAttribute('hidden'),
    ]);
    expect(items).toEqual([
      ['openvsx', 'https://open-vsx.org/extension/velezanthony/cotton-props', false],
      [
        'marketplace',
        'https://marketplace.visualstudio.com/items?itemName=velezanthony.cotton-props',
        true,
      ],
    ]);
  });

  it('renders hidden, with no number, when the build got nothing', async () => {
    const el = await block({});
    expect(el.hasAttribute('hidden')).toBe(true);
    expect(text(el)).not.toMatch(/\d/);
  });

  /* On a card, above the ::after overlay that makes the whole card a link. */
  it('lifts the citations above the card overlay', async () => {
    const el = await block({ variant: 'card', counts: { openvsx: 730 } });
    for (const a of el.querySelectorAll('a'))
      expect([...a.classList]).toEqual(expect.arrayContaining(['relative', 'z-10']));
  });

  it('is a labelled field in the sidebar', async () => {
    const el = await block({ variant: 'field', counts: { openvsx: 730 } });
    expect(text(el.querySelector('p.label'))).toBe('Descargas');
  });

  it('renders nothing for a project published nowhere', async () => {
    expect(
      (await render(DownloadCount, { sources: undefined, counts: {}, lang: 'es' })).querySelector(
        '[data-downloads]',
      ),
    ).toBeNull();
  });
});
