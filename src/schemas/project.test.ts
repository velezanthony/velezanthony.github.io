import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { linkOf, projectSchema } from './project';

/* `image()` needs Astro's asset pipeline; a path string stands in for it here. */
const schema = projectSchema({ image: () => z.string() } as never);

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

  it('rejects a fractional order', () => {
    expect(errorsOf({ ...valid, order: 1.5 })).toEqual(['order']);
  });

  it('rejects a CV line over 100 characters', () => {
    expect(errorsOf({ ...valid, cvLine: 'x'.repeat(101) })).toEqual(['cvLine']);
  });

  /* A thumbnail without its text renders `alt=""`, which says "decorative" — silently. */
  it.each([
    [{ thumb: 'a.png' }, 'thumbAlt'],
    [{ thumbAlt: 'A screenshot' }, 'thumb'],
  ])('wants thumb and thumbAlt together: %j', (extra, missing) => {
    expect(errorsOf({ ...valid, ...extra })).toEqual([missing]);
  });

  it('accepts thumb and thumbAlt together', () => {
    expect(errorsOf({ ...valid, thumb: 'a.png', thumbAlt: 'A screenshot' })).toEqual([]);
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
