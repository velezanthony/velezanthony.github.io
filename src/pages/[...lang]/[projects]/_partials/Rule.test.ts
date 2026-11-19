import { describe, expect, it } from 'vitest';

import { render } from '@/test/render';
import Rule from './Rule.astro';

describe('Rule', () => {
  it('is a separator when plain', async () => {
    expect((await render(Rule)).querySelector('hr')).not.toBeNull();
  });

  /* A `div` has no role to remove; `presentation` on it only adds noise. */
  it('adds no role to the marked variant', async () => {
    const rule = (await render(Rule, { marked: true })).body.firstElementChild!;
    expect(rule.hasAttribute('role')).toBe(false);
  });
});
