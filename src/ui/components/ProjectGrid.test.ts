import { describe, expect, it } from 'vitest';

import { render } from '@/test-utils';
import ProjectGrid from './ProjectGrid.astro';

const project = {
  entry: {
    data: {
      name: 'SnakeORM',
      tagline: 'A typed ORM.',
      status: 'maintained',
      stack: ['Python'],
      targets: [],
      slug: 'snake-orm',
      visual: { kind: 'code', lang: 'python', code: 'Truck.maker' },
    },
  },
  translationPending: false,
};

const grid = async (props: Record<string, unknown> = {}) =>
  (await render(ProjectGrid, { lang: 'en', projects: [project], ...props })).body
    .firstElementChild!;

describe('ProjectGrid', () => {
  it('closes the list with a rule of its own', async () => {
    expect((await grid()).classList.contains('border-b')).toBe(true);
  });

  /* Inside a band, whose own edge is a rule, a closing rule doubled it 64px apart. */
  it('leaves the closing rule to its container when told to', async () => {
    expect((await grid({ closed: false })).classList.contains('border-b')).toBe(false);
  });
});
