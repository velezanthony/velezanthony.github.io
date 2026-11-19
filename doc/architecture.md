# Architecture

Astro 7 · static output · Spanish + English · GitHub Pages at `https://velezanthony.github.io`.

## Layers

```
src/
├── core/       pure logic: no Astro, no fetch, no DOM; what it needs arrives as a parameter
├── data/       content only: profile, experience, education, privacy text, UI phrases
├── adapters/   what touches Astro or the network: content collections, stores, library config
├── client/     browser scripts
├── ui/         components and layouts, reused across pages
└── pages/      routes, each with its own `_partials/`
```

**Dependencies point down only**, and ESLint (`no-restricted-imports`, `eslint.config.mjs`) enforces it:

| Layer | May not import |
| --- | --- |
| `core/` | `astro`, `astro:*`, `data/`, `adapters/`, `ui/`, `pages/`, `client/` |
| `data/` | `adapters/`, `ui/`, `pages/` |
| `ui/` | `adapters/` (except `adapters/design`, which the layouts read) |

`core/seo` therefore takes the owner, the project and the site identity as parameters; `data/person.ts` and the pages hand them in. Tests live next to their file (`*.test.ts`); the logic ones are in `core/`, `adapters/` and `client/`.

## Partials vs components

| | Scope | Location |
| --- | --- | --- |
| Component | Used in more than one place | `src/ui/components/` |
| Layout | The page shell | `src/ui/layouts/`, its own pieces in `_partials/` |
| Partial | Used by one page | `_partials/` next to that page |

**Promotion rule:** a partial used by a second page moves to `ui/components/`. Until then it stays under its page. Nothing in `ui/components/` should be used from a single place.

`_`-prefixed files and folders are excluded from routing — [Astro routing](https://docs.astro.build/en/guides/routing/). `_partials/` has nothing to do with Astro's `partial` page export.

There is no Atomic Design here; the design library keeps it.

## Data

**One source, many renderings.** Experience and projects are written once; pages, the print CV route and the profile README all render from it.

Pages and partials read the data layer. `ui/components/` receive plain props, never a collection entry.

**Decided:** split by shape, not by convenience.

| | Backend | Why |
| --- | --- | --- |
| Projects | Content Collection, `src/content/projects/<locale>/<slug>.md` | Each one carries a case study — prose with headings and decisions. Frontmatter is the structured half. |
| Experience · education · profile | Typed TS modules in `src/data/` | Records with no prose body, rendered into the site and the print CV. |

`src/adapters/projects.ts` wraps the collection: it resolves locale, falls back to the Spanish source when a translation is missing, and flags it so the page can say so instead of 404-ing.

The glob loader's default `generateId` drops the directory, so `es/foo.md` and `en/foo.md` would collide. `generateId` is overridden to keep the locale in the id.

Dates are stored as `YYYY-MM` and formatted through `Intl` at render time, so no month name ever enters the translation catalogue.

**Unknown data is a `TODO`, never a guess.** `todo[]` in project frontmatter renders as a visible placeholder block.

## i18n

Astro's built-in i18n covers routing only. Translation is ours.

```js
i18n: { defaultLocale: 'es', locales: ['es', 'en'], routing: { prefixDefaultLocale: true } }
```

The default locale is unprefixed (`/proyectos/`); the other one is (`/en/projects/`).

Pages live under `src/pages/[...lang]/` and enumerate locales via `getStaticPaths` — one page file per route, not per language.

**Strings use the source sentence as the key**, not invented identifiers:

```astro
{t('Proyectos')}
```

Spanish is the source language, so `t()` returns the argument unchanged. `Phrase` is derived from the English catalogue, so an untranslated string fails the build.

`src/data/ui.ts` is therefore a registry of every source string, not a dictionary of invented ids. Values are the English translations; `PENDING` marks one that has not been written yet and falls back to Spanish at render time.

Two failure modes, deliberately different:

| | Result |
| --- | --- |
| String not in the catalogue | Build fails — `astro check` runs before `astro build`. |
| String present but `PENDING` | Builds, renders the Spanish source. `npm run i18n:status` lists them. |

Three kinds of text, three homes:

| Kind | Lives in |
| --- | --- |
| UI chrome | `src/data/ui.ts` |
| Route segments | `routes` in `src/core/i18n/locales.ts` |
| Content | data layer |

## Directory map

```
src/
├── content.config.ts · site.ts · site.css
├── core/             types.ts · i18n/ · downloads/ · timeline/ · privacy/ · projects/ · seo/
├── data/             profile · experience · education · emphasis · privacy · person · ui
├── adapters/         projects · project-schema · downloads · design
├── client/           downloads · storage
├── ui/
│   ├── components/   ContactList · DownloadCount · StackRow · StatusChip · ProjectGrid
│   │                 ProjectCard · Timeline · ExperienceItem · EducationRule · variant.ts
│   ├── layouts/      BaseLayout · PageLayout · PrintLayout · _partials/
│   └── translations.ts
├── pages/
│   ├── 404.astro · _partials/NotFound.astro · llms.txt.ts · robots.txt.ts
│   └── [...lang]/
│       ├── index.astro · _partials/
│       ├── [projects]/    index.astro · [slug].astro · _partials/
│       ├── [experience]/  index.astro · _partials/
│       ├── [cv]/          index.astro · _partials/
│       └── [privacy]/     index.astro · _partials/
└── content/projects/ es/ · en/
```

`ui/translations.ts` binds `core/i18n/translate.ts` to the phrases in `data/ui.ts`: `core/` cannot import the catalogue, so it receives it.

The route segment is a dynamic param named after the folder's English concept, because Astro derives the URL from the file path and the URL has to be localised: `[projects]` emits `/proyectos/` and `/en/projects/`. Sibling single-segment dynamic routes coexist fine in static output — each enumerates concrete paths.

`404.astro` sits at the root, outside `[...lang]`: GitHub Pages serves one `/404.html` for the whole site and cannot pick a locale, so the page carries both languages and the client script chooses.

## Conventions

- English for folders, files, component names, branches and commit messages.
- Conventional Commits. No AI attribution trailers.
- Components are `PascalCase.astro`, one per file. Names are full words, no abbreviations.
- Props typed with `interface Props`.
- Heading level is a prop, never hardcoded — the caller knows what precedes it, the component does not.
- Dev server: `astro dev --background`.

### Imports

**One alias, `@/*` → `src/*`.** Anything outside the file's own folder is imported through it, so the layer is written on the import line. Only a file's own folder and the `_partials/` below it are imported relatively: relative means colocated, `@/` means shared. Writing `../_partials/…` across pages means it is no longer a partial — promote it to `@/ui/components/`.
