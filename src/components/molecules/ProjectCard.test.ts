import { describe, expect, it } from 'vitest';

import { render, text } from '@/test/render';
import ProjectCard from './ProjectCard.astro';

const props = {
  name: 'snake-orm',
  tagline: 'A typed Python ORM.',
  status: 'maintained',
  href: '/en/projects/snake-orm/',
  stack: ['Python'],
  targets: ['PostgreSQL', 'SQLite'],
  lang: 'en',
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
    expect(text(label!.parentElement).replace(/^For/, '')).toBe('PostgreSQL · SQLite');
  });

  it('leaves out the targets and the image when there are none', async () => {
    const doc = await render(ProjectCard, { ...props, targets: [] });
    expect(text(doc)).not.toContain('For');
    expect(doc.querySelector('img')).toBeNull();
  });
});
