import { describe, expect, it } from 'vitest';

import { onlySitemapPage, relativizeStylesheet } from './sitemap-pages';

describe('onlySitemapPage', () => {
  it('is the one page the integration wrote', () => {
    expect(onlySitemapPage(['sitemap-0.xml'])).toBe('sitemap-0.xml');
  });

  /* An index cannot list another index, so a split would make `sitemap.xml` invalid. */
  it.each([[[]], [['sitemap-0.xml', 'sitemap-1.xml']]])('refuses %j', (files) => {
    expect(() => onlySitemapPage(files)).toThrow(
      `expected one sitemap page, found ${files.length}`,
    );
  });
});

describe('relativizeStylesheet', () => {
  const site = 'https://velezanthony.github.io';

  it('points the stylesheet at whoever serves the file', () => {
    const xml = `<?xml-stylesheet type="text/xsl" href="${site}/sitemap-style.xml"?><urlset/>`;
    expect(relativizeStylesheet(xml, site)).toBe(
      '<?xml-stylesheet type="text/xsl" href="sitemap-style.xml"?><urlset/>',
    );
  });

  it('leaves a file without it untouched', () => {
    expect(relativizeStylesheet('<urlset/>', site)).toBe('<urlset/>');
  });
});
