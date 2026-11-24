import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import docsConfig from '../../docs.config.mjs';
import { profile } from '../../src/data/profile';
import { OWNER, menuTrail } from './generate.mjs';

const SITE_URL = 'https://velezanthony.github.io';
const root = 'src/content/docs';

const articles = readdirSync(`${root}/articulos`, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.md') && !file.split('/').at(-1)?.startsWith('_'))
  .map((file) => {
    const source = readFileSync(`${root}/articulos/${file}`, 'utf8');
    const data = parse(source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '');
    const heading = source.match(/^# (.+)$/m)?.[1];
    const path = data.slug ?? `articulos/${file.replace(/(\.en)?\.md$/, '')}`;
    return { file, data, heading, path };
  });

/* Every article carries its own card: the library reads it from `public/` and the JSON-LD repeats it. */
describe.each(articles)('$file', ({ data, heading, path }) => {
  it('points seo.image to its generated card, with the page title as alt', () => {
    expect(data.seo.image).toEqual({ src: `/og/${path}.png`, alt: data.seo.title ?? heading });
    expect(existsSync(`public/og/${path}.png`)).toBe(true);
  });

  it('repeats the absolute card URL in its TechArticle schema', () => {
    const article = data.seo.schema.find(
      (entry: { '@type': string }) => entry['@type'] === 'TechArticle',
    );
    expect(article.image).toBe(`${SITE_URL}/og/${path}.png`);
  });
});

/* The generator is plain Node and cannot import `profile.ts`, so it repeats these texts. */
describe('OWNER', () => {
  it('repeats the profile texts', () => {
    expect(OWNER.name).toBe(profile.name);
    expect(OWNER.role).toBe(profile.role);
    expect(OWNER.location).toBe(profile.location);
    expect(profile.headline.es.startsWith(OWNER.headline)).toBe(true);
    expect(OWNER.headline).toBe(
      'Desarrollo, despliego y mantengo software en producción, en la nube o en servidores propios.',
    );
  });
});

describe('menuTrail', () => {
  it('is every menu label from the section down to the article, per locale', () => {
    const nav = docsConfig.content?.nav ?? [];
    const id = 'articulos/desarrollo/python/estricto/pytest-a-fondo';
    expect(menuTrail(nav, id, 'es')).toEqual(['Desarrollo', 'Python', 'Python estricto']);
    expect(menuTrail(nav, id, 'en')).toEqual(['Development', 'Python', 'Strict Python']);
    expect(menuTrail(nav, 'articulos/sistemas/redes/dns-cambiar-servidor-sin-caida', 'es')).toEqual(
      ['Sistemas', 'Redes'],
    );
  });
});
