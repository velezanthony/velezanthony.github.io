import { describe, expect, it } from 'vitest';

import { render } from '@/test/render';
import Link from './Link.astro';

const link = async (variant: string) =>
  (await render(Link, { href: '/x/', variant })).querySelector('a')!;

describe('Link', () => {
  /* WCAG 2.5.8: a target at least 24px tall. A 12px label alone is 14px. */
  it.each(['quiet', 'action', 'value'])('gives a %s link a 24px tall target', async (variant) => {
    expect((await link(variant)).classList.contains('min-h-6')).toBe(true);
  });

  /* Links inside a sentence are exempt, and a taller box would push the line apart. */
  it('leaves an inline link the height of its line', async () => {
    expect((await link('inline')).classList.contains('min-h-6')).toBe(false);
  });
});
