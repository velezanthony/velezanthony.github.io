import { describe, expect, it } from 'vitest';

import { render, text } from '@/test/render';
import DownloadCount from './DownloadCount.astro';

const sources = { openvsx: 'velezanthony.cotton-props', marketplace: 'velezanthony.cotton-props' };
const block = async (props: Record<string, unknown>) =>
  (await render(DownloadCount, { sources, lang: 'es', ...props })).querySelector(
    '[data-downloads]',
  )!;

describe('DownloadCount', () => {
  /* The count is read in the visitor's browser; the built page carries none, and stays quiet
     without JavaScript. */
  it('renders hidden, with no number, for the browser to fill', async () => {
    const el = await block({});
    expect(el.hasAttribute('hidden')).toBe(true);
    expect(text(el)).not.toMatch(/\d/);
    expect(JSON.parse(el.getAttribute('data-downloads')!)).toEqual(sources);
    expect(el.getAttribute('data-lang')).toBe('es');
  });

  it('cites every declared store, linked to where its number can be checked', async () => {
    const el = await block({});
    const links = [...el.querySelectorAll('[data-downloads-item] a')];
    expect(links.map((a) => [text(a), a.getAttribute('href')])).toEqual([
      ['Open VSX', 'https://open-vsx.org/extension/velezanthony/cotton-props'],
      [
        'Marketplace',
        'https://marketplace.visualstudio.com/items?itemName=velezanthony.cotton-props',
      ],
    ]);
  });

  /* On a card, above the ::after overlay that makes the whole card a link. */
  it('lifts the citations above the card overlay', async () => {
    const el = await block({ variant: 'card' });
    for (const a of el.querySelectorAll('a'))
      expect([...a.classList]).toEqual(expect.arrayContaining(['relative', 'z-10']));
  });

  it('is a labelled field in the sidebar', async () => {
    const el = await block({ variant: 'field' });
    expect(text(el.querySelector('p.label'))).toBe('Descargas');
  });

  it('renders nothing for a project published nowhere', async () => {
    expect(
      (await render(DownloadCount, { sources: undefined, lang: 'es' })).querySelector(
        '[data-downloads]',
      ),
    ).toBeNull();
  });
});
