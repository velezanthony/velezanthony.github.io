import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';

import { projectSchema } from './project-schema';

/* `image()` needs Astro's asset pipeline; a path string stands in for it here. */
const schema = projectSchema({ image: () => z.string() } as never);

const valid = {
  slug: 'snake-orm',
  name: 'SnakeORM',
  tagline: 'Deep typed relationship navigation.',
  summary: `SnakeORM case study: ${'why a typed Python ORM, the decisions, what went wrong. '.repeat(2)}`,
  cvLine: 'A typed Python ORM',
  status: 'maintained',
  role: 'Author',
  order: 1,
  visual: { kind: 'code', lang: 'python', code: 'Truck.maker.nation.name' },
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

  /* The meta description of the case study: under 120 says too little, over 160 gets cut. */
  it.each([119, 161])('rejects a summary of %i characters', (length) => {
    expect(errorsOf({ ...valid, summary: 'x'.repeat(length) })).toEqual(['summary']);
  });

  it("requires a summary: the tagline describes the product, which is the docs site's query", () => {
    const rest: Partial<typeof valid> = { ...valid };
    delete rest.summary;
    expect(errorsOf(rest)).toEqual(['summary']);
  });

  it('rejects a CV line over 100 characters', () => {
    expect(errorsOf({ ...valid, cvLine: 'x'.repeat(101) })).toEqual(['cvLine']);
  });

  describe('downloads', () => {
    it('is optional', () => {
      expect(errorsOf(valid)).toEqual([]);
    });

    it('names the package in each store it is published to', () => {
      const downloads = {
        openvsx: 'velezanthony.cotton-props',
        marketplace: 'velezanthony.cotton-props',
      };
      expect(errorsOf({ ...valid, downloads })).toEqual([]);
    });

    /* The VS Code stores address an extension as publisher.name; anything else asks for nothing. */
    it.each(['openvsx', 'marketplace'])('wants publisher.name for %s', (store) => {
      expect(errorsOf({ ...valid, downloads: { [store]: 'cotton-props' } })).toEqual([
        `downloads.${store}`,
      ]);
    });

    it('rejects a store it cannot read', () => {
      expect(errorsOf({ ...valid, downloads: { npm: 'x' } })).toEqual(['downloads']);
    });
  });

  describe('seo', () => {
    it('is optional: the title and the description are derived', () => {
      expect(errorsOf(valid)).toEqual([]);
    });

    it('takes the library block', () => {
      expect(
        errorsOf({
          ...valid,
          seo: { description: 'Another', image: { src: '/og-snake.png', alt: 'Cover' } },
        }),
      ).toEqual([]);
    });

    it('rejects a field the block does not have', () => {
      expect(errorsOf({ ...valid, seo: { descripcion: 'x' } })).toEqual(['seo']);
    });

    it('rejects an image outside public/', () => {
      expect(errorsOf({ ...valid, seo: { image: { src: 'og.png' } } })).toEqual(['seo.image.src']);
    });
  });

  describe('visual', () => {
    /* Every card shows one, so none may be missing: a card without it breaks the even rows. */
    it('is required', () => {
      const rest: Partial<typeof valid> = { ...valid };
      delete rest.visual;
      expect(errorsOf(rest)).toEqual(['visual']);
    });

    it('accepts an image with its text', () => {
      expect(
        errorsOf({ ...valid, visual: { kind: 'image', src: 'a.png', alt: 'A screenshot' } }),
      ).toEqual([]);
    });

    it('wants the text of an image', () => {
      expect(errorsOf({ ...valid, visual: { kind: 'image', src: 'a.png' } })).toEqual([
        'visual.alt',
      ]);
    });

    it('wants code and its language', () => {
      expect(errorsOf({ ...valid, visual: { kind: 'code', lang: 'python', code: '' } })).toEqual([
        'visual.code',
      ]);
      expect(errorsOf({ ...valid, visual: { kind: 'code', code: 'x' } })).toEqual(['visual.lang']);
    });

    it('rejects an unknown kind', () => {
      expect(errorsOf({ ...valid, visual: { kind: 'video', src: 'a.mp4' } })).toEqual([
        'visual.kind',
      ]);
    });
  });
});

/* The schema cannot see the file name, so the agreement between the two is checked here. */
describe('project files', () => {
  const root = 'src/data/projects';
  const files = readdirSync(root).flatMap((lang) =>
    readdirSync(`${root}/${lang}`).map((file) => `${root}/${lang}/${file}`),
  );

  it.each(files)('%s is named after its slug', (file) => {
    const slug = readFileSync(file, 'utf8').match(/^slug:\s*(\S+)\s*$/m)?.[1];
    expect(file.endsWith(`/${slug}.md`)).toBe(true);
  });
});
