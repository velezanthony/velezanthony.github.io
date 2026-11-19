import { describe, expect, it } from 'vitest';

import { render, text } from '@ui/test-utils';
import ProjectCard from './ProjectCard.astro';

const props = {
  name: 'snake-orm',
  tagline: 'A typed Python ORM.',
  status: 'maintained',
  href: '/en/projects/snake-orm/',
  stack: ['Python'],
  targets: ['PostgreSQL', 'SQLite'],
  lang: 'en',
  visual: { kind: 'code', lang: 'python', code: 'Truck.maker.nation.name == "España"' },
};

describe('ProjectCard', () => {
  it('links the name to the write-up', async () => {
    const link = (await render(ProjectCard, props)).querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/en/projects/snake-orm/');
    expect(text(link)).toBe('snake-orm');
  });

  it('uses the heading level its caller sets, three by default', async () => {
    expect((await render(ProjectCard, props)).querySelector('h3')).not.toBeNull();
    expect(
      (await render(ProjectCard, { ...props, headingLevel: 2 })).querySelector('h2'),
    ).not.toBeNull();
  });

  it('shows the status and the stack', async () => {
    const card = text(await render(ProjectCard, props));
    expect(card).toContain('Maintained');
    expect(card).toContain('Python');
  });

  it('lists what it is built for under its own label', async () => {
    const doc = await render(ProjectCard, props);
    const label = [...doc.querySelectorAll('span.label')].find((span) => text(span) === 'For');
    expect(label).toBeDefined();
    expect([...label!.parentElement!.querySelectorAll('li')].map(text)).toEqual([
      'PostgreSQL',
      'SQLite',
    ]);
  });

  it('leaves out the targets when there are none', async () => {
    const doc = await render(ProjectCard, { ...props, targets: [] });
    expect([...doc.querySelectorAll('span.label')].map(text)).not.toContain('For');
  });

  describe('downloads', () => {
    /* Counted in the browser: the card carries the block and its citations, never a number. */
    it('carries the download block for the stores the project is published to', async () => {
      const doc = await render(ProjectCard, { ...props, downloads: { pypi: 'snake-orm' } });
      const block = doc.querySelector('[data-downloads]')!;
      expect(block.hasAttribute('hidden')).toBe(true);
      expect(
        block.querySelector('a[href="https://pypistats.org/packages/snake-orm"]'),
      ).not.toBeNull();
    });

    it('has none for a project published nowhere', async () => {
      expect((await render(ProjectCard, props)).querySelector('[data-downloads]')).toBeNull();
    });
  });

  describe('visual', () => {
    const frame = async (visual: unknown) =>
      (await render(ProjectCard, { ...props, visual })).querySelector('.card-visual')!;

    it('shows code as highlighted code', async () => {
      const visual = await frame(props.visual);
      expect(visual.querySelector('pre.astro-code')).not.toBeNull();
      expect(text(visual)).toBe('Truck.maker.nation.name == "España"');
    });

    it('shows an image with its text', async () => {
      const src = { src: '/a.png', width: 1912, height: 1001, format: 'png' };
      const img = (await frame({ kind: 'image', src, alt: 'A screenshot' })).querySelector('img')!;
      expect(img.getAttribute('alt')).toBe('A screenshot');
    });
  });
});
