---
slug: design
name: '@velezanthony/design'
headline: Astro integration for documentation sites
tagline: 'Astro integration and component library for documentation: from Markdown to a multilingual site with search, SEO and a sitemap, without writing a layout.'
status: maintained
role: Author and maintainer
order: 6
now: true
featured: true
stack:
  - TypeScript
  - Astro
  - Tailwind CSS
  - Shiki
  - Pagefind
targets:
  - Astro
  - GitHub Pages
compat:
  - 'Astro 7'
  - 'Node ≥ 22.23.4'
quality:
  - 'Layers enforced by ESLint, and a test that checks every rule still fires'
  - 'Over 3,300 Vitest tests, real Astro builds included'
  - 'V8 coverage published in CI'
  - 'Stryker mutation testing: sharded in parallel, and incremental on every PR'
constraints:
  - 'The site writes no layout, no CSS import and no Tailwind @source.'
  - 'Shipped as source: there is no compiled output to drift out of sync.'
  - 'A broken link or anchor fails the build; it never gets published.'
  - 'Nothing that only exists in development reaches what is published.'
links:
  - label: Source
    kind: source
    href: https://github.com/velezanthony/design
  - label: Documentation
    kind: docs
    href: https://velezanthony.github.io/design/
todo: []
visual:
  kind: code
  lang: js
  code: |
    // docs.config.mjs
    export default defineDocsConfig({
      site: { name: 'My repo' },
      i18n: { locales: ['en', 'es'], missing: MissingTranslation.LINK },
    });

    // astro.config.mjs
    export default defineDocsSite(docsConfig, { base: '/my-repo' });

    // src/content.config.ts
    export { collections } from '@velezanthony/design/content';
---

## The problem

Several of my projects kept their documentation in MkDocs, each repo with its own `mkdocs.yml`, and
the portfolio was built with Astro. Two systems, two different looks.

I wanted every repo's documentation to look and behave the same, and to match the portfolio. The
tokens and the first atoms came out of the portfolio itself.

MkDocs with Material built the whole site from Markdown, and it worked. What I missed was something
else:

- **My own style on the web**, not the theme's.
- **Sections the way I wanted them**: some parts didn't look right to me and I couldn't change them
  without fighting the theme.
- **Room for my own pieces**: above all a proper cookie notice that works with Google Tag Manager and
  Analytics without loading anything before consent.

## What I studied

It is not built on MkDocs or Starlight, and it doesn't copy them. I studied how they work and, above
all, how the final result looks, kept what I liked and added what I was missing.

| From… | What I liked | What didn't convince me | What I added |
| --- | --- | --- | --- |
| Markdown | Writing plain text, with relative links that work on GitHub. | — | My own directives (`::nav-tree`, tabs, callouts) and a build that fails on a broken link. |
| MkDocs Material | Callouts, tabs, built-in search and publishing the `README.md` as the home page. | Not being able to change how some sections look without fighting the theme. | My own design system, generated folder indexes and a migrator from MkDocs. |
| Starlight | Being Astro, Pagefind search and replaceable components. | Starting from its design instead of my own. | Typed config in three groups, a translated URL per page and an SEO panel in dev. |

| | This library | MkDocs Material | Starlight |
| --- | --- | --- | --- |
| Base | Astro | MkDocs (Python) | Astro |
| Design | Its own design system | Material theme, highly configurable | Starlight theme, customisable |
| Folder indexes | Generated, with static pagination | Through plugins | Through plugins |
| Cookies and analytics | Consent and Google Tag Manager | Consent and Google Analytics built in | Added by hand |
| Replaceable components | Only the footer | Theme templates | Many, the header included |
| Ecosystem | One person | Very large; in maintenance mode since November 2025, with Zensical as its successor | Large, with plugins and themes |

## What it is

An Astro integration and a component library for documentation sites. A repo adds an Astro
subproject, writes a `docs.config.mjs` and its Markdown, and the library supplies the rest:

```js
// docs.config.mjs
import { defineDocsConfig, MissingTranslation } from '@velezanthony/design/integration';

export default defineDocsConfig({
  name: 'My repo',
  locales: ['en', 'es'],
  translations: { missing: MissingTranslation.LINK },
  external: [{ slug: 'changelog', file: '../CHANGELOG.md' }],
});
```

```js
// astro.config.mjs
import { defineDocsSite } from '@velezanthony/design/integration';
import docsConfig from './docs.config.mjs';

export default defineDocsSite(docsConfig, { base: '/my-repo' });
```

With that, the site gets:

- Pages in every locale, `sitemap.xml` and a favicon, without a single file in `src/pages/`.
- A policy for pages that are not translated.
- SEO: title, description, Open Graph, canonical, `hreflang` and whatever JSON-LD the site
  declares. The sitemap's `lastmod` comes from each file's last commit.
- Search with Pagefind, per locale.
- A Tailwind 4 theme with its tokens, and components in Atomic Design: atoms, molecules, organisms
  and the `BaseLayout` and `DocsLayout` layouts.
- An "SEO on page" panel that only exists under `astro dev` and reviews every page while you write.
- A MkDocs migrator that converts a repo's syntax without moving its `.md` files.

## How it works

### The config

`astro.config.mjs` imports `docs.config.mjs` and hands it to `docs()`, which validates it with zod
and fills in the defaults. An unknown key fails the build and names its path
(`ui.es.search.placeholdr`).

The content loader cannot read that config off the integration object: Astro drops the properties it
does not know. So the integration publishes it in a virtual module,
`virtual:@velezanthony/design/config`, served by a Vite plugin with `JSON.stringify`. The collection
and the routes read it from there. It is the same pattern Starlight uses, and it has one consequence:
only data travels. Computed JSON-LD is computed in `docs.config.mjs` and passed in ready-made.

The site's `content.config.ts` is one line:

```ts
export { collections } from '@velezanthony/design/content';
```

### Astro's hooks

Most of the work happens in `astro:config:setup`. The integration requires `site`, reads
`PUBLIC_GTM_ID` with Vite's `loadEnv` (the `.env` files are not in `process.env` yet at that point),
adds its plugins to the Markdown processor, registers the fonts, the Shiki themes and the virtual
module plugin, and injects the routes: `/[...slug]` for every page, `/sitemap.xml` and the favicon.
If the site has its own page on one of those routes, its page wins and a warning names it at
startup.

In `astro:config:done` it copies the virtual module's types, because `injectTypes` does not exist
earlier. In `astro:build:done` it builds the Pagefind index over `dist/`.

`astro dev` only restarts when `astro.config.mjs` changes, not what it imports, so the integration
also watches `docs.config.mjs`.

### The content loader

It reads the `.md` files in the content folder and the files in `external[]` (a `CHANGELOG.md` at
the repo root, for instance). For each one it works out slug, locale and title, applies the
translation policies and checks `sidebar`, `nav` and `footer` against the real pages. Then it
rewrites relative `.md` links into site URLs, renders, and checks every `#anchor` against the
headings of all pages.

It collects every error before failing, with file and line. Under `astro dev` it watches the sources
and reloads when any of them changes; a failure shows up in the log without taking the server down.

### Development and build

The search index is built after `astro build`, so search only works on a production build.

The SEO panel is the opposite case: its routes are injected only in development. ESLint forbids
anything published from importing the panel's folder, and a build test checks that `dist/` never
mentions it.

### The site's CSS

The library owns Tailwind: the site has no `@import 'tailwindcss'` of its own. If it needs its own
tokens or styles, it declares them with the `theme` option:

```js
theme: 'src/styles/site.css',
```

The library's `theme.css` imports `@velezanthony/design/site-theme` last, and the integration points
that specifier at the site's CSS through a Vite alias. Tailwind honours the alias when it resolves
`@import`, so the site's `@theme` blocks generate utilities in the same pass as the library's
palette.

### Sites on a sub-path

Every docs site is published at `https://velezanthony.github.io/<repo>/`, which is why `base` is
mandatory and every URL carries it. GitHub Pages serves a single `/404.html` for the whole domain, so
the library generates no 404: the portfolio provides it at the root, along with `robots.txt` and the
sitemap index. This site's `docs.config.mjs` lists every project's sitemap, and a test keeps that
list equal to the projects collection.

### Locales

When a page is not translated, the site chooses what the other locale gets:

- `link`: the sidebar links to the original, with a badge for its language.
- `omit`: it does not appear.
- `fallback`: the original is served under the other locale's URL, with a notice, `noindex` and a
  canonical pointing back.

The policy is set for the whole site and a page can override it in its frontmatter. Two files of the
same page with different policies fail the build.

### Pieces for a layout of your own

A site that is not documentation can use the pieces on their own:

- `BaseLayout` renders `<html>` and `<head>` with the theme and the consent banner, and leaves the
  `<body>` to the caller, with `head`, default and `scripts` slots.
- `Article` is the content of a docs page: the `.prose`, the table of contents and their JavaScript,
  with slots for content of your own.
- `pageHead` returns the `<head>` tags (canonical, `hreflang`, Open Graph, Twitter and JSON-LD) using
  the site's config.
- `seoSchema` is the frontmatter `seo` block, for use in any collection.

This portfolio is built that way.

## Decisions

### Ship source, not a build

**Context.** An Astro library can publish a `dist/` or publish its `.ts` and `.astro` files.

**Decision.** Source, with no build step. The site's own Astro does the compiling.

**Why.** There is no compiled output to drift away from the code, and in the playground and in the
library's docs, editing `src/` hot-reloads.

**Price.** The site installs the peer dependencies (`astro` and `@astrojs/markdown-satteri`), and the
code cannot use TypeScript syntax that is not erasable. ESLint bans `enum`: `MissingTranslation` is
an `as const` object with a derived type.

### Layers with a dependency rule

`src/` splits into `core/` (pure logic: config, links, navigation, locales, SEO), `client/` (browser
JavaScript), `components/` (presentational: they take props, they do not fetch data) and `astro/`,
the only layer that knows about Astro. `core/` imports nothing but zod.

ESLint enforces it, folder by folder. `boundaries.test.ts` lints in-memory snippets under the path
they would have in each layer and checks that every forbidden import still errors, so deleting a rule
turns a test red. Another test keeps the docs' map of `src/` equal to the real tree.

When Astro changes an API, the change stays inside `astro/`.

### Fail the build

A broken relative link or `#anchor`, a page with no title, a locale suffix missing from `locales` or
an SEO image that does not exist all fail the build. I would rather find out when building than when
publishing.

## What went wrong

### A 404 that could not be served

The library generated its own 404, one per locale, and even carried a fix so that a 404 shown for
another language kept the title template. But GitHub Pages serves one `/404.html` for the whole
domain, and a docs site lives in a sub-folder: that page was never going to be served.

I removed it as a breaking change, with its routes, layouts and strings. The 404 and the privacy
policy now come from the portfolio, once for the whole domain.

### An upward dependency

`Article`, an organism, imported its client boot from `layouts/`, the direction Atomic Design does
not allow. I moved it to `components/boot/`, and ESLint now forbids atoms, molecules and organisms
from importing from `layouts/` or `pages/`.

### Mutation testing on Astro

Stryker type-checks every mutant, and an Astro project's types do not exist until Astro generates
them: the workflow failed until CI started generating them first. A module whose functions are
copied as text into an inline script, the one that restores the sidebar's scroll position, broke
under instrumentation, so I left it out.

When merging the shards' reports, Stryker rewrites the whole incremental baseline, not just the part
it measured, so each shard hands back only its own files. Test ids are renumbered on merge, and the
merge stops if a mutant points at a test its report does not define.

## Where it is used

- In this portfolio, which uses `BaseLayout`, `Article`, `pageHead` and the `theme` option.
- In the documentation of four projects — Docker Control Center, cotton-props, Django Cotton Gallery
  and SnakeORM — migrated from MkDocs.

The migrator converts MkDocs syntax in place, rewrites anchors to the ids the library generates
(MkDocs and github-slugger do not produce the same ones), will not run if `docs/` has uncommitted
changes, and finishes with a suggested config read from `mkdocs.yml` and a list of what it did not
translate.

## How it is tested

Over 3,300 Vitest tests, of five kinds: pure core, client code with an injected environment,
components through Astro's container, adapters with test doubles built from the real schema, and
full Astro builds of fixtures. V8 coverage goes into the CI summary.

Coverage says which lines run; mutation says whether the tests would notice a change in them.
Mutating everything is around 12,000 mutants, which on a single machine takes hours. Hence two
workflows:

- A manual one that splits the files into shards of similar weight (12 by default), runs them in
  parallel, merges the results and caches the baseline on `main`.
- An incremental one on every PR and every push to `main`, on two machines, that restores that
  baseline and only reruns mutants whose code or tests changed. The first run took a little over
  eight minutes, reused 83 % of the results and left the score at 82 %. It is informational: it does
  not fail on the score.

## Limits

**It is not on npm.** It installs from GitHub, pinned to a version tag.

**Astro 7 with Sätteri only.** Sätteri is Astro 7's Markdown processor and the library adds its
plugins on top of it; with any other processor, the build fails.

**It is cut to fit my sites.** It works for any repo, but the choices — GitHub Pages, a sub-folder
per project, the portfolio at the root — are mine. Its own documentation is in Spanish only.

**Only the footer can be replaced.** `site.components.Footer` swaps the footer for your own; the header
can't be, because I haven't needed it.

**Search Console, halfway.** It generates the `sitemap.xml` you submit to Search Console, but it doesn't
add the verification tag: the property is verified through DNS or Analytics.

**It doesn't take contributions.** I maintain it. Anyone who wants to adapt it can fork it: its
documentation explains which personal data to remove and how to maintain their copy.

## Status

Published on GitHub and in active development. The repository is public.
