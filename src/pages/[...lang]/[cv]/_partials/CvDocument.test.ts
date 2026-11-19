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
