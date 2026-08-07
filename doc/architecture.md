# Architecture

Astro 7 · static output · Spanish + English · GitHub Pages at `https://velezanthony.github.io`.

## Layers

```
tokens        @theme in src/styles/theme.css
  ↓
atoms         Tag · Heading · Text · Link · Icon
  ↓
molecules     ProjectCard · ExperienceItem · StackRow
  ↓
organisms     SiteHeader · SiteFooter · ProjectGrid · Timeline
  ↓
sections      page-specific, colocated under the page
  ↓
layouts       BaseLayout · PageLayout · PrintLayout
  ↓
pages         routes
```

**Dependencies point one way only.** An atom never imports a molecule. If it does, it is not an atom.

`src/layouts/` is the templates layer. There is no `components/templates/`.

## Sections vs organisms

| | Scope | Location |
| --- | --- | --- |
| Organism | Used by two or more pages | `src/components/organisms/` |
| Section | Used by one page | `_sections/` next to that page |

**Promotion rule:** a section used by a second page moves to `organisms/`. Until then it stays under its page.

Nothing in `atoms/`, `molecules/` or `organisms/` should be used by a single page.

`_`-prefixed files and folders are excluded from routing — [Astro routing](https://docs.astro.build/en/guides/routing/).

> Note: `partial` is reserved in Astro. It means a page exported with `export const partial = true`, served without `<!DOCTYPE>` or `<head>` for htmx-style fragment swaps. Do not use the word for components.

## Data

**One source, many renderings.** Experience and projects are written once; pages, the print CV route and the profile README all render from it.

Only pages and organisms read the data layer. Atoms and molecules receive plain props, never a collection entry.

**Decided:** split by shape, not by convenience.

| | Backend | Why |
| --- | --- | --- |
| Projects | Content Collection, `src/content/projects/<locale>/<slug>.md` | Each one carries a case study — prose with headings and decisions. Frontmatter is the structured half. |
| Experience · education · profile | Typed TS modules in `src/data/` | Records with no prose body, rendered into the site and the print CV. |

`src/data/projects.ts` wraps the collection: it resolves locale, falls back to the Spanish source when a translation is missing, and flags it so the page can say so instead of 404-ing.

The glob loader's default `generateId` drops the directory, so `es/foo.md` and `en/foo.md` would collide. `generateId` is overridden to keep the locale in the id.

Dates are stored as `YYYY-MM` and formatted through `Intl` at render time, so no month name ever enters the translation catalogue.

**Unknown data is a `TODO`, never a guess.** `todo[]` in project frontmatter renders as a visible placeholder block.

## i18n

Astro's built-in i18n covers routing only. Translation is ours.

```js
i18n: { defaultLocale: 'es', locales: ['es', 'en'], routing: { prefixDefaultLocale: true } }
```

Both locales are explicit in the URL. `/` redirects to `/es/`.

Pages live under `src/pages/[lang]/` and enumerate locales via `getStaticPaths` — one page file per route, not per language.

**Strings use the source sentence as the key**, not invented identifiers:

```astro
{t('Proyectos')}
```

Spanish is the source language, so `t()` returns the argument unchanged. `Phrase` is derived from the English catalogue, so an untranslated string fails the build.

`src/i18n/ui.ts` is therefore a registry of every source string, not a dictionary of invented ids. Values are the English translations; `PENDING` marks one that has not been written yet and falls back to Spanish at render time.

Two failure modes, deliberately different:

| | Result |
| --- | --- |
| String not in the catalogue | Build fails — `astro check` runs before `astro build`. |
| String present but `PENDING` | Builds, renders the Spanish source. `npm run i18n:status` lists them. |

Three kinds of text, three homes:

| Kind | Lives in |
| --- | --- |
| UI chrome | `src/i18n/ui.ts` |
| Route segments | `routes` in `src/i18n/ui.ts` |
| Content | data layer |

## Directory map

```
src/
├── components/
│   ├── atoms/        Heading · Text · Link · Tag · Icon · Rule · Todo
│   ├── molecules/    SectionHead · ProjectCard · ExperienceItem · StackRow
│   │                 StatusChip · ContactList · LocaleSwitch
│   └── organisms/    SiteHeader · SiteFooter · ProjectGrid · Timeline
├── content/
│   └── projects/     es/ · en/
├── data/             profile.ts · experience.ts · education.ts
│                     projects.ts · types.ts
├── i18n/             ui.ts · utils.ts · format.ts
├── layouts/          BaseLayout · PageLayout · PrintLayout
├── pages/
│   ├── 404.astro
│   └── [lang]/
│       ├── index.astro
│       ├── _sections/
│       ├── [projects]/    index.astro · [slug].astro · _sections/
│       ├── [experience]/  index.astro · _sections/
│       └── [cv]/          index.astro · _sections/
├── styles/           theme.css
└── content.config.ts
```

The route segment is a dynamic param named after the folder's English concept, because Astro derives the URL from the file path and the URL has to be localised: `[projects]` emits `/es/proyectos/` and `/en/projects/`. Sibling single-segment dynamic routes coexist fine in static output — each enumerates concrete paths.

`/` is a static meta-refresh document to `/es/`, emitted by `redirects` in the Astro config.

`404.astro` sits at the root, outside `[lang]`: GitHub Pages serves one `/404.html` for the whole site and cannot pick a locale.

## Conventions

- English for folders, files, component names, branches and commit messages.
- Conventional Commits. No AI attribution trailers.
- Components are `PascalCase.astro`, one per file.
- Props typed with `interface Props`.
- Heading level is a prop, never hardcoded — the caller knows what precedes it, the component does not.
- Dev server: `astro dev --background`.

### Imports

**One alias per layer** — `@atoms/*`, `@molecules/*`, `@organisms/*`, `@layouts/*`, `@data/*`, `@i18n/*`, `@styles/*`, `@/*`. The layer is written on the import line, so an atom reaching into `@molecules/…` is visible at a glance; `../../molecules/Card.astro` would disguise it as a relative path.

**Sections have no alias.** They are colocated under their page and imported relatively, so import style states scope: relative means colocated, alias means shared. Writing `../_sections/…` across pages means it is no longer a section — promote it to `@organisms/`.
