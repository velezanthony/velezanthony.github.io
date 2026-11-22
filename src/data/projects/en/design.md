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
  - 'Over 4,200 Vitest tests, real Astro builds included'
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

## What it is

An Astro integration and a component library for documentation sites. A repo writes its Markdown and
one config file, and the library does the rest:

- **Pages in several languages**, with a policy for the ones that are not translated.
- **Navigation**: sidebar, generated folder indexes (list, table or cards) and previous / next.
- **Search** with Pagefind, per language.
- **SEO**: title, description, Open Graph, canonical, `hreflang`, JSON-LD and `sitemap.xml`.
- **Cookies and analytics**: a consent notice and Google Tag Manager, loading nothing before consent.
- **Rich Markdown**: callouts, tabs, Mermaid diagrams and code blocks with a copy button.
- **A design system** with light and dark themes, and standalone components to build your own pages.
  This portfolio is built with them.
- **An "SEO on page" panel** that only exists in development and checks each page as you write.
- **A MkDocs migrator** that converts a repo's syntax without moving its `.md` files.

### Compared with MkDocs Material and Starlight

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

ESLint enforces it, folder by folder, and a test checks that every forbidden import still errors:
deleting a rule turns a test red. When Astro changes an API, the change stays inside `astro/`.

### Fail the build

A broken relative link or `#anchor`, a page with no title, a locale suffix missing from the config or
an SEO image that does not exist all fail the build. I would rather find out when building than when
publishing.

## How it works inside

**The config.** The site writes a single `docs.config.mjs`, typed and grouped into `site`, `i18n` and
`content`. The library validates it on startup: an unknown key fails the build with its path.

**The content.** A loader reads the `.md` files, takes each one's language and title, rewrites
relative links to site URLs and checks every anchor against the real pages. It collects every error
before failing, with file and line.

**Routes and build.** The library injects the pages, the `sitemap.xml` and the favicon, without a
single file in `src/pages/`. When the build ends, Pagefind indexes the site for search. The SEO panel
is only injected in development, and a test checks it never reaches what gets published.

**The CSS.** The library owns Tailwind. If the site needs its own tokens or styles, it declares them in
the config and they go into the same compilation as the library's.

The details are in the [library's documentation](https://velezanthony.github.io/design/).

## What went wrong

### A 404 that could not be served

The library generated its own 404, one per locale, and even carried a fix so that a 404 shown for
another language kept the title template. But GitHub Pages serves one `/404.html` for the whole
domain, and a docs site lives in a sub-folder: that page was never going to be served.

I removed it, with its routes, layouts and strings. The 404 and the privacy policy now come from the
portfolio, once for the whole domain.

### An upward dependency

`Article`, an organism, imported its client boot from `layouts/`, the direction Atomic Design does
not allow. I moved it to `components/boot/`, and ESLint now forbids atoms, molecules and organisms
from importing from `layouts/` or `pages/`.

### Mutation testing on Astro

Stryker type-checks every mutant, and an Astro project's types do not exist until Astro generates
them: the workflow failed until CI started generating them first. A module whose functions are
copied as text into an inline script, the one that restores the sidebar's scroll position, broke
under instrumentation, so I left it out.

Mutating everything means about 12,000 mutants, hours on a single machine. I solved it by splitting
them into shards that run in parallel and with an incremental run on every PR, which only repeats the
mutants whose code or tests have changed.

## Limits

**It is not on npm.** It installs from GitHub, pinned to a version tag.

**Astro 7 with Sätteri only.** Sätteri is Astro 7's Markdown processor and the library adds its
plugins on top of it; with any other processor, the build fails.

**It is cut to fit my sites.** It works for any repo, but the choices — GitHub Pages, a sub-folder
per project, the portfolio at the root — are mine. Its own documentation is in Spanish only.

**Only the footer can be replaced.** The site can swap the footer for its own; the header can't be,
because I haven't needed it.

**Search Console, halfway.** It generates the `sitemap.xml` you submit to Search Console, but it doesn't
add the verification tag: the property is verified through DNS or Analytics.

**It doesn't take contributions.** I maintain it. Anyone who wants to adapt it can fork it: its
documentation explains which personal data to remove and how to maintain their copy.

## Status

Published on GitHub and in active development. It is used by this portfolio and by the documentation
of four projects — Docker Control Center, cotton-props, Django Cotton Gallery and SnakeORM —,
migrated from MkDocs. It is covered by over 4,200 tests, with real Astro builds, and mutation testing
on every PR. The repository is public.
