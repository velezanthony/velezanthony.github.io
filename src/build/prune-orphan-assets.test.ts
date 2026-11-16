import { describe, expect, it } from 'vitest';

import { orphanAssets } from './prune-orphan-assets';

describe('orphanAssets', () => {
  const files = ['_astro/hero.Ab12.webp', '_astro/hero.Ab12.png', '_astro/icon.Cd34.svg'];

  it('is every asset whose file name appears in no built text', () => {
    const text = '<img src="/_astro/hero.Ab12.webp">\nbackground:url(/_astro/icon.Cd34.svg)';
    expect(orphanAssets(files, text)).toEqual(['_astro/hero.Ab12.png']);
  });

  it('keeps everything when everything is referenced', () => {
    expect(orphanAssets(files, files.join(' '))).toEqual([]);
  });
});
