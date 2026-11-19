import { describe, expect, it } from 'vitest';

import { render } from '@ui/test-utils';
import StackRow from './StackRow.astro';

describe('StackRow', () => {
  it('renders nothing for an empty list', async () => {
    expect((await render(StackRow, { items: [] })).querySelector('.stack-row')).toBeNull();
  });
});
