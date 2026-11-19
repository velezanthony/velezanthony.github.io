import { describe, expect, it } from 'vitest';

import { render } from '@/test-utils';
import CvDocument from './CvDocument.astro';

const tool = {
  name: 'SnakeORM',
  cvLine: 'Un ORM',
  href: 'https://velezanthony.github.io/proyectos/snake-orm/',
  packages: [{ label: 'PyPI', href: 'https://pypi.org/project/snake-orm/' }],
  downloads: { pypi: 'snake-orm' },
  downloadCounts: { pypi: { count: 42 } },
};
const unpublished = {
  name: 'DCC',
  cvLine: 'Un panel',
  href: 'https://velezanthony.github.io/proyectos/dcc/',
  packages: [],
};

describe('CvDocument', () => {
  /* On screen the column is 560px and the four contacts cannot pair up — the LinkedIn one alone is
     319px — so a wrapping row left them two, one, one. A column reads clean; on A4 there is room
     for the two-by-two the row gives. */
  it('stacks the contacts on screen and lays them in a row on paper', async () => {
    const doc = await render(CvDocument, { lang: 'es', tools: [] });
    const list = [...doc.querySelectorAll('ul')].find((ul) =>
      ul.querySelector('a[href^="mailto:"]'),
    )!;
    expect(list.classList.contains('flex-col')).toBe(true);
    expect([...list.classList]).toEqual(
      expect.arrayContaining(['print:flex-row', 'print:flex-wrap']),
    );
    /* The place sits above the contacts, not beside a column of them. */
    const meta = list.parentElement!;
    expect(meta.classList.contains('flex-col')).toBe(true);
    expect(meta.classList.contains('print:flex-row')).toBe(true);
  });

  /* Split across two pages it read as two lists; whole, it lands with education and languages. */
  it('keeps the own-tools section on one page', async () => {
    const doc = await render(CvDocument, {
      lang: 'es',
      tools: [tool],
    });
    const section = [...doc.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === 'Herramientas propias',
    )!;
    /* break-inside: avoid is not enough for Chrome here — tested, the section still split. An
       inline-block is laid out as one unbreakable box, and moves whole to the next page. */
    expect([...section.classList]).toEqual(
      expect.arrayContaining(['print:inline-block', 'print:w-full']),
    );
  });

  describe('own tools', () => {
    const toolsDoc = () => render(CvDocument, { lang: 'es', tools: [tool, unpublished] });
    const row = async (name: string) =>
      [...(await toolsDoc()).querySelectorAll('li')].find((li) => li.textContent?.includes(name))!;

    /* Absolute: a CV printed from a local server must not link to localhost. */
    it('links each name to its write-up, on the public site', async () => {
      const name = (await row('SnakeORM')).querySelector('a')!;
      expect(name.textContent?.trim()).toBe('SnakeORM');
      expect(name.getAttribute('href')).toBe('https://velezanthony.github.io/proyectos/snake-orm/');
    });

    it('names each store a tool is published to, linked to its page there', async () => {
      const store = (await row('SnakeORM')).querySelector(
        'a[href="https://pypi.org/project/snake-orm/"]',
      );
      expect(store?.textContent?.trim()).toBe('PyPI');
    });

    it('carries the download count the build read', async () => {
      expect((await row('SnakeORM')).querySelector('[data-downloads-text]')?.textContent).toBe(
        '42 descargas al mes',
      );
    });

    it('adds nothing for a tool published nowhere', async () => {
      const dcc = await row('DCC');
      expect(dcc.querySelectorAll('a')).toHaveLength(1);
      expect(dcc.querySelector('[data-downloads]')).toBeNull();
    });
  });
});
