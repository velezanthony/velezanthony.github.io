import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const projects = defineCollection({
  loader: glob({
    base: './src/content/projects',
    pattern: '**/*.md',
    /* The default drops the directory, so es/foo and en/foo would collide. */
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
    /** Stable across locales — it is the URL segment. */
    slug: z.string(),
    name: z.string(),

    /** Leads the `<title>`. The phrase someone would actually search for —
        the package name alone has no search volume yet. */
    headline: z.string(),

    tagline: z.string(),

    /** The CV line. Required rather than falling back to `tagline`: that one is written as a
        meta description and runs past 140 characters, which on paper is two lines per tool
        and turns the list back into a paragraph. One clause, no dash — the CV draws its own. */
    cvLine: z.string().max(100),

    status: z.enum(['maintained', 'experimental', 'unreleased']),
    role: z.string(),

    /** Ascending. Controls the order of the index. */
    order: z.number(),

    /** Appears in "En qué estoy trabajando" on the home page. */
    now: z.boolean().default(false),

    /** Appears in the home page's selected work. */
    featured: z.boolean().default(false),

    /** What it is built WITH. Implementation only. */
    stack: z.array(z.string()).default([]),

    /* Built FOR, not built with. */
    targets: z.array(z.string()).default([]),

    /** Declared support range, e.g. `Python ≥ 3.11`. */
    compat: z.array(z.string()).default([]),

    quality: z.array(z.string()).default([]),

    constraints: z.array(z.string()).default([]),

    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.url(),
        }),
      )
      .default([]),

    /** Rendered as visible placeholders. Never silently dropped. */
    todo: z.array(z.string()).default([]),

    thumb: image().optional(),
    thumbAlt: z.string().optional(),
    }),
});

export const collections = { projects };
