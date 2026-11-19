import { describe, expect, it } from 'vitest';

import { mergeCounts, toDownloads } from './counts';

const vscode = { openvsx: 'velezanthony.cotton-props', marketplace: 'velezanthony.cotton-props' };

describe('mergeCounts', () => {
  /* The browser's fresh count wins; a store it could not reach keeps the build's. */
  it('takes the fresh count, and the build count where the browser got none', () => {
    expect(mergeCounts({ openvsx: 700, marketplace: 60 }, { openvsx: 730 })).toEqual({
      openvsx: 730,
      marketplace: 60,
    });
  });

  /* shields rounds past a thousand: an exact build figure is not traded for a rounded one. */
  it('keeps an exact build figure over a rounded fresh one', () => {
    expect(
      mergeCounts({ pypi: { count: 1234 } }, { pypi: { count: 1200, approximate: true } }),
    ).toEqual({
      pypi: { count: 1234 },
    });
  });

  it('takes a rounded fresh figure when the build has none', () => {
    expect(mergeCounts({}, { pypi: { count: 1200, approximate: true } })).toEqual({
      pypi: { count: 1200, approximate: true },
    });
  });
});

describe('toDownloads', () => {
  it('turns PyPI into downloads in the last month, citing pypistats', () => {
    expect(toDownloads({ pypi: 'gallery' }, { pypi: { count: 811 } })).toEqual({
      perMonth: 811,
      sources: [{ label: 'PyPI', href: 'https://pypistats.org/packages/gallery' }],
    });
  });

  /* The VS Code stores publish only an all-time count: summed, never mixed with a monthly one. */
  it('sums the VS Code stores into an all-time total, citing each that has a count', () => {
    expect(toDownloads(vscode, { openvsx: 730, marketplace: 64 })).toEqual({
      total: 794,
      sources: [
        { label: 'Open VSX', href: 'https://open-vsx.org/extension/velezanthony/cotton-props' },
        {
          label: 'Marketplace',
          href: 'https://marketplace.visualstudio.com/items?itemName=velezanthony.cotton-props',
        },
      ],
    });
  });

  it('cites only the stores with a count', () => {
    expect(toDownloads(vscode, { openvsx: 730 }).sources.map((s) => s.label)).toEqual(['Open VSX']);
  });

  it('carries an approximate figure as such', () => {
    expect(toDownloads({ pypi: 'a' }, { pypi: { count: 1200, approximate: true } })).toMatchObject({
      perMonth: 1200,
      approximate: true,
    });
  });
});
