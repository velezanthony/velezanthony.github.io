import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { linkOf, projectSchema } from './project';

const schema = projectSchema();

const valid = {
  slug: 'snake-orm',
  name: 'SnakeORM',
  headline: 'A typed Python ORM',
  tagline: 'Deep typed relationship navigation.',
  cvLine: 'A typed Python ORM',
  status: 'maintained',
  role: 'Author',
  order: 1,
  links: [
    { label: 'Source', kind: 'source', href: 'https://github.com/velezanthony/snake-orm' },
    { label: 'PyPI', kind: 'package', href: 'https://pypi.org/project/snake-orm/' },
    { label: 'Docs', kind: 'docs', href: 'https://velezanthony.github.io/snake-orm/' },
  ],
};

const errorsOf = (data: unknown) =>
  schema.safeParse(data).error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('projectSchema', () => {
  it('accepts a complete project', () => {
    expect(errorsOf(valid)).toEqual([]);
  });

  describe('links', () => {
    it('requires a kind', () => {
      const links = [{ label: 'Source', href: 'https://github.com/velezanthony/snake-orm' }];
      expect(errorsOf({ ...valid, links })).toEqual(['links.0.kind']);
    });

    it('rejects an unknown kind', () => {
      const links = [{ ...valid.links[0], kind: 'repo' }];
      expect(errorsOf({ ...valid, links })).toEqual(['links.0.kind']);
    });

    /* Consumers pick THE repository and THE docs; a second one would be silently ignored. */
    it.each(['source', 'docs'])('allows one %s link at most', (kind) => {
      const twin = { label: 'Mirror', kind, href: 'https://example.com/' };
      expect(errorsOf({ ...valid, links: [...valid.links, twin] })).toEqual(['links']);
    });

    it('allows several packages', () => {
      const vsx = { label: 'Open VSX', kind: 'package', href: 'https://open-vsx.org/' };
      expect(errorsOf({ ...valid, links: [...valid.links, vsx] })).toEqual([]);
    });
  });

  it.each(['Snake-ORM', 'snake_orm', '-snake', 'snake-', 'snake--orm', 'snake orm', ''])(
    'rejects the slug %j, which ends up in a URL',
    (slug) => {
      expect(errorsOf({ ...valid, slug })).toEqual(['slug']);
    },
  );

  /* Lists are rendered with their own separators; one written into an item doubles them, in the
     wrong colour, and turns three items into one that cannot wrap. */
  it.each(['stack', 'targets', 'compat'])('rejects a middot inside a %s item', (field) => {
    expect(errorsOf({ ...valid, [field]: ['PostgreSQL · SQLite'] })).toEqual([`${field}.0`]);
  });

  it('rejects a fractional order', () => {
    expect(errorsOf({ ...valid, order: 1.5 })).toEqual(['order']);
  });

  it('rejects a CV line over 100 characters', () => {
    expect(errorsOf({ ...valid, cvLine: 'x'.repeat(101) })).toEqual(['cvLine']);
  });

  /* Index cards carry no image: at card size a screenshot was an unreadable smudge, and only two
     of five projects had one. The screenshots live in each write-up. */
  it('keeps no thumbnail', () => {
    const parsed = schema.parse({ ...valid, thumb: 'a.png', thumbAlt: 'A screenshot' });
    expect(parsed).not.toHaveProperty('thumb');
    expect(parsed).not.toHaveProperty('thumbAlt');
  });
});

describe('linkOf', () => {
  it('is the href of the link of that kind', () => {
    expect(linkOf(valid.links as never, 'docs')).toBe('https://velezanthony.github.io/snake-orm/');
  });

  it('is undefined when the project has none', () => {
    expect(linkOf([], 'package')).toBeUndefined();
  });
});

/* The schema cannot see the file name, so the agreement between the two is checked here. */
describe('project files', () => {
  const root = 'src/content/projects';
  const files = readdirSync(root).flatMap((lang) =>
    readdirSync(`${root}/${lang}`).map((file) => `${root}/${lang}/${file}`),
  );

  it.each(files)('%s is named after its slug', (file) => {
    const slug = readFileSync(file, 'utf8').match(/^slug:\s*(\S+)\s*$/m)?.[1];
    expect(file.endsWith(`/${slug}.md`)).toBe(true);
  });
});
