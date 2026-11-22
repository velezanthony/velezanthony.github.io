import { describe, expect, it } from 'vitest';

import { breadcrumb, person, techArticle } from './jsonld';
import type { PersonSource, ProjectData } from './jsonld';

/** A made-up owner for the tests: `core/` does not import the real content. */
const owner: PersonSource = {
  profile: {
    name: 'Anthony Velez Tapia',
    headline: { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' },
  },
  email: 'velezanthony2000@gmail.com',
  knowsAbout: ['Python', 'Django'],
  address: { locality: 'Pamplona', region: 'Navarra', country: 'ES' },
  spokenLanguages: [{ code: 'es' }, { code: 'eu' }, { code: 'en' }],
  contact: [
    { href: 'mailto:velezanthony2000@gmail.com' },
    { href: 'https://github.com/velezanthony' },
    { href: 'https://linkedin.com/in/anthony-velez-tapia' },
  ],
  education: [{ school: 'SEIM' }],
  experience: [
    { role: { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' }, company: 'Dinycon' },
  ],
};

const site = 'https://velezanthony.github.io';
const personId = `${site}/#anthony`;
const identity = { site: new URL(site), personId };

describe('person', () => {
  const es = person(owner, identity, 'es', `${site}/cv/`);
  const en = person(owner, identity, 'en', `${site}/en/projects/`);

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
  summary: 'SnakeORM case study: the decisions behind a typed Python ORM and what went wrong.',
  links: [
    { kind: 'source', href: 'https://github.com/velezanthony/snake-orm' },
    { kind: 'package', href: 'https://pypi.org/project/snake-orm/' },
    { kind: 'docs', href: 'https://velezanthony.github.io/snake-orm/' },
  ],
} satisfies ProjectData;
const page = `${site}/en/projects/snake-orm/`;

describe('techArticle', () => {
  const article = techArticle(project, identity, 'en', page, '2026-09-07T00:06:43+02:00');

  it('is the case study, in the page language', () => {
    expect(article['@type']).toBe('TechArticle');
    expect(article.headline).toBe('SnakeORM: decisions, mistakes and limits');
    expect(article.description).toBe(project.summary);
    expect(article.url).toBe(page);
    expect(article.inLanguage).toBe('en');
    expect(article.author).toEqual({ '@id': personId });
  });

  /* The software lives on its docs site; this page is about it, and never claims to be it. */
  it('is about the software at its documentation, not at this page', () => {
    expect(article.about).toEqual({
      '@type': 'SoftwareSourceCode',
      name: 'SnakeORM',
      url: 'https://velezanthony.github.io/snake-orm/',
      codeRepository: 'https://github.com/velezanthony/snake-orm',
      sameAs: ['https://github.com/velezanthony/snake-orm', 'https://pypi.org/project/snake-orm/'],
    });
  });

  it('falls back to the repository when the project has no docs', () => {
    const links = project.links.filter((l) => l.kind !== 'docs');
    const about = techArticle({ ...project, links }, identity, 'en', page, undefined).about;
    expect(about.url).toBe('https://github.com/velezanthony/snake-orm');
    expect(about.sameAs).toEqual(['https://pypi.org/project/snake-orm/']);
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
