import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { sourcesOf } from './sources';

const routes: [string, string[]][] = [
  ['home', []],
  ['cv', ['cv']],
  ['experience', ['experience']],
  ['projects index', ['projects']],
  ['project page', ['projects', 'snake-orm']],
];

describe('sourcesOf', () => {
  describe.each(['es', 'en'])('%s', (locale) => {
    it.each(routes)('%s points only at files that exist', (_, segments) => {
      const missing = sourcesOf(locale, segments).filter((path) => !existsSync(path));
      expect(missing).toEqual([]);
    });
  });

  it('has no sources for an unknown section', () => {
    expect(sourcesOf('es', ['nope'])).toEqual([]);
  });
});
