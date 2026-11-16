import { describe, expect, it } from 'vitest';

import { breadcrumb, person, softwareSourceCode, techArticle } from './jsonld';
import type { ProjectData } from './jsonld';

const site = 'https://velezanthony.github.io';
const personId = `${site}/#anthony`;

describe('person', () => {
  const es = person('es', `${site}/cv/`);
  const en = person('en', `${site}/en/projects/`);

  /* One person with many mentions, not one person per page. */
  it('keeps the same @id on every page and in every locale', () => {
    expect(es['@id']).toBe(personId);
    expect(en['@id']).toBe(personId);
  });

  it('names the page it appears on', () => {
    expect(es.mainEntityOfPage).toBe(`${site}/cv/`);
  });

  it('points at the home page of its locale', () => {
    expect(es.url).toBe(`${site}/`);
    expect(en.url).toBe(`${site}/en/`);
  });

  it('gives the current role in the page language', () => {
    expect(es.jobTitle).toBe('Desarrollador Full Stack');
    expect(en.jobTitle).toBe('Full Stack Developer');
  });

  it('lists only web profiles as sameAs, not the mailto', () => {
    expect(es.sameAs).toEqual([
      'https://github.com/velezanthony',
      'https://linkedin.com/in/anthony-velez-tapia',
    ]);
    expect(es.email).toBe('mailto:velezanthony2000@gmail.com');
  });

  it('declares the spoken languages by code', () => {
    expect(es.knowsLanguage).toEqual(['es', 'eu', 'en']);
  });
});

const project = {
  name: 'SnakeORM',
  headline: 'A typed Python ORM',
  tagline: 'Deep typed relationship navigation.',
  stack: ['Python'],
  targets: ['PostgreSQL'],
  compat: ['Python ≥ 3.11'],
  links: [
    { label: 'Source', kind: 'source', href: 'https://github.com/velezanthony/snake-orm' },
    { label: 'PyPI', kind: 'package', href: 'https://pypi.org/project/snake-orm/' },
  ],
} as ProjectData;
const page = `${site}/en/projects/snake-orm/`;

describe('softwareSourceCode', () => {
  const code = softwareSourceCode(project, page, '2026-09-07T00:06:43+02:00');

  it('takes the repository from the source link', () => {
    expect(code.codeRepository).toBe('https://github.com/velezanthony/snake-orm');
  });

  it('ties every declared link to the page as the same thing', () => {
    expect(code.url).toBe(page);
    expect(code.sameAs).toEqual([
      'https://github.com/velezanthony/snake-orm',
      'https://pypi.org/project/snake-orm/',
    ]);
  });

  it('is authored by the person, by reference', () => {
    expect(code.author).toEqual({ '@id': personId });
  });

  it('joins stack and targets as keywords, and omits them when there are none', () => {
    expect(code.keywords).toBe('Python, PostgreSQL');
    const bare = softwareSourceCode({ ...project, stack: [], targets: [] }, page, undefined);
    expect(bare.keywords).toBeUndefined();
  });
});

describe('techArticle', () => {
  it('is the write-up, in the page language', () => {
    const article = techArticle(project, 'en', page, undefined);
    expect(article.headline).toBe('SnakeORM · A typed Python ORM');
    expect(article.inLanguage).toBe('en');
    expect(article.author).toEqual({ '@id': personId });
    expect(article.about).toEqual({ '@type': 'SoftwareSourceCode', name: 'SnakeORM' });
  });
});

describe('breadcrumb', () => {
  it('numbers the trail from one', () => {
    expect(
      breadcrumb([
        { name: 'projects', url: `${site}/en/projects/` },
        { name: 'SnakeORM', url: page },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'projects', item: `${site}/en/projects/` },
        { '@type': 'ListItem', position: 2, name: 'SnakeORM', item: page },
      ],
    });
  });
});
