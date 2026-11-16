import type { SchemaContext } from 'astro:content';
import { z } from 'zod';

/**
 * What a link IS, declared rather than guessed from its host. The docs are moving off
 * `github.io/<repo>/` and into this site, which would quietly break any host regex.
 */
export const projectStatuses = ['maintained', 'experimental', 'unreleased'] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const linkKinds = ['source', 'docs', 'package'] as const;
export type LinkKind = (typeof linkKinds)[number];

/* Consumers pick THE repository and THE docs; a second one would be silently ignored. */
const single: LinkKind[] = ['source', 'docs'];

const link = z.object({
  /** Visible, and translated: `Código` / `Source`. Several packages share a kind, not a label. */
  label: z.string(),
  kind: z.enum(linkKinds),
  href: z.url(),
});
export type ProjectLink = z.infer<typeof link>;

export function linkOf(links: ProjectLink[], kind: LinkKind): string | undefined {
  return links.find((l) => l.kind === kind)?.href;
}

export const projectSchema = ({ image }: SchemaContext) =>
  z
    .object({
      /** Stable across locales — it is the URL segment, and the file name. */
      slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lowercase words joined by single dashes'),
      name: z.string(),

      /** Leads the `<title>`. The phrase someone would actually search for —
        the package name alone has no search volume yet. */
      headline: z.string(),

      tagline: z.string(),

      /** The CV line. Required rather than falling back to `tagline`: that one is written as a
        meta description and runs past 140 characters, which on paper is two lines per tool
        and turns the list back into a paragraph. One clause, no dash — the CV draws its own. */
      cvLine: z.string().max(100),

      status: z.enum(projectStatuses),
      role: z.string(),

      /** Ascending. Controls the order of the index. */
      order: z.int(),

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
        .array(link)
        .refine(
          (links) => single.every((kind) => links.filter((l) => l.kind === kind).length <= 1),
          `one link at most of kind ${single.join(' and ')}`,
        )
        .default([]),

      /** Rendered as visible placeholders. Never silently dropped. */
      todo: z.array(z.string()).default([]),

      thumb: image().optional(),
      thumbAlt: z.string().optional(),
    })
    /* A thumbnail without its text renders `alt=""`, which says "decorative" — silently. */
    .superRefine(({ thumb, thumbAlt }, ctx) => {
      if (thumb !== undefined && thumbAlt === undefined) {
        ctx.addIssue({ code: 'custom', path: ['thumbAlt'], message: 'a thumb needs its alt text' });
      }
      if (thumbAlt !== undefined && thumb === undefined) {
        ctx.addIssue({ code: 'custom', path: ['thumb'], message: 'alt text without a thumb' });
      }
    });
