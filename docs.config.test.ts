import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import docsConfig from './docs.config.mjs';

/* The list is typed in `docs.config.mjs`, so it can lag behind the content. A project missing from
   it drops out of the sitemap index with no error; one that is not published is reported as a
   fetch error against this domain. */
describe('sitemap.include', () => {
  const directory = 'src/data/projects/en';
  const documentation = readdirSync(directory)
    .map((file) => readFileSync(`${directory}/${file}`, 'utf8'))
    .map((source) => source.match(/kind: docs\s+href: (\S+)/)?.[1])
    .filter((href): href is string => href !== undefined)
    .map((href) => new URL('sitemap.xml', href).pathname);

  it('lists the documentation site of every project', () => {
    expect([...(docsConfig.sitemap?.include ?? [])].sort()).toEqual(documentation.sort());
  });
});
