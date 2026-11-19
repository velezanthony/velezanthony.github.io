import { describe, expect, it } from 'vitest';

import { render } from '@/test-utils';
import StackRow from './StackRow.astro';

const row = async (props: Record<string, unknown>) =>
  (await render(StackRow, { items: ['Python', 'Django'], ...props })).querySelector('.stack-row')!;

describe('StackRow', () => {
  /* Secondary metadata under a card or a CV entry: it should recede. */
  it('is small and faint by default', async () => {
    const p = await row({});
    expect([...p.classList]).toEqual(expect.arrayContaining(['text-faint', 'text-xs']));
    expect(p.classList.contains('text-muted')).toBe(false);
  });

  /* As the value under a faint label it must read as the value, not as a second label: ink like
     every other value beside it, at the mono list size that matches their weight. */
  it('reads as a value when it is the value of a labelled field', async () => {
    const p = await row({ field: true });
    expect([...p.classList]).toEqual(expect.arrayContaining(['text-ink', 'text-mono-list']));
    expect(p.classList.contains('text-muted')).toBe(false);
    expect(p.classList.contains('text-faint')).toBe(false);
    expect(p.classList.contains('text-xs')).toBe(false);
  });

  it('renders nothing for an empty list', async () => {
    expect((await render(StackRow, { items: [] })).querySelector('.stack-row')).toBeNull();
  });
});
