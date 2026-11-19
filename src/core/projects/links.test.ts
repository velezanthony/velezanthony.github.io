import { describe, expect, it } from 'vitest';

import { linkOf } from './links';

const links = [
  { kind: 'source', href: 'https://github.com/velezanthony/snake-orm' },
  { kind: 'docs', href: 'https://velezanthony.github.io/snake-orm/' },
];

describe('linkOf', () => {
  it('is the href of the link of that kind', () => {
    expect(linkOf(links, 'docs')).toBe('https://velezanthony.github.io/snake-orm/');
  });

  it('is undefined when the project has none', () => {
    expect(linkOf([], 'package')).toBeUndefined();
  });
});
