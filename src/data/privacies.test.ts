import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { email } from '@data/profile';

/* The policy is plain Markdown, so the address is typed by hand: this keeps it in step with the profile. */
describe('privacy policy contact address', () => {
  const directory = 'src/data/privacies';
  const policies = readdirSync(directory).filter((file) => file.endsWith('.md'));

  it.each(policies)('%s only links the profile email', (file) => {
    const source = readFileSync(`${directory}/${file}`, 'utf8');
    const addresses = [...source.matchAll(/mailto:([^)\s]+)/g)].map((match) => match[1]);

    expect(addresses.length).toBeGreaterThan(0);
    expect(new Set(addresses)).toEqual(new Set([email]));
  });
});
