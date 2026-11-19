import { describe, expect, it } from 'vitest';

import { projectStatuses } from '@/adapters/project-schema';
import { render, text } from '@/test-utils';
import StatusChip from './StatusChip.astro';

describe('StatusChip', () => {
  it.each([
    ['maintained', 'Mantenido', 'Maintained'],
    ['experimental', 'Experimental', 'Experimental'],
    ['unreleased', 'Sin publicar', 'Unreleased'],
  ])('labels %s in each language', async (status, es, en) => {
    expect(text(await render(StatusChip, { status, lang: 'es' }))).toBe(es);
    expect(text(await render(StatusChip, { status, lang: 'en' }))).toBe(en);
  });

  /* A status the chip has no tone for would render without its colour, silently. */
  it.each(projectStatuses)('gives %s a tone of its own', async (status) => {
    const chip = (await render(StatusChip, { status, lang: 'es' })).querySelector('span')!;
    expect(chip.className).toMatch(/\btext-state-\w+|\btext-faint\b/);
  });
});
