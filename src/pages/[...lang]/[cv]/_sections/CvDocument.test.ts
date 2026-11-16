import { describe, expect, it } from 'vitest';

import { render } from '@/test/render';
import CvDocument from './CvDocument.astro';

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
      tools: [{ name: 'SnakeORM', cvLine: 'Un ORM' }],
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
});
