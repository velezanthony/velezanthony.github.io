# velezanthony.github.io

Portfolio and printable CV. Static site, two languages, no client-side JavaScript.

**Live:** https://velezanthony.github.io

---

## Requirements

| | Version |
| --- | --- |
| Node | **≥ 22.12** (enforced by `engines`) |
| npm | ships with Node |

Nothing else. No database, no services, no environment variables.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:4321 — it forwards to `/es/`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | `astro check` **then** `astro build`. Type errors fail the build |
| `npm run preview` | Serves `dist/` as it will be served in production |
| `npm run check` | Type checking on its own |
| `npm run i18n:status` | Lists source strings with no English translation |
| `npm run todo` | Lists the `todo:` entries still open in the case studies |

## Dependencies

**Runtime**

| Package | Why |
| --- | --- |
| `astro` | Static site generator. Routing, i18n, content collections, image pipeline, self-hosted fonts |
| `tailwindcss` + `@tailwindcss/vite` | Styling. Design tokens live in `@theme` inside `src/styles/theme.css` |
| `zod` | Schema for the project content collection. A malformed entry fails the build |

**Development**

| Package | Why |
| --- | --- |
| `@astrojs/check` | Type checking for `.astro` files, wired into `build` |
| `typescript` | — |

Fonts (IBM Plex Sans and Mono) are downloaded and self-hosted at build time by Astro's fonts API. They are not a dependency and nothing is fetched at runtime.

## Layout

```
src/
├── components/       atoms · molecules · organisms
├── layouts/          BaseLayout · PageLayout · PrintLayout
├── pages/[lang]/     routes, with page-specific sections in `_sections/`
├── content/projects/ case studies, one folder per locale
├── data/             experience · education · profile
├── i18n/             ui.ts · utils.ts · format.ts
└── styles/           theme.css
```

`doc/architecture.md` records the decisions and the reasoning behind them. Read it before changing structure.

## Editing content

| What | Where |
| --- | --- |
| A job, a degree, contact details | `src/data/` |
| A project case study | `src/content/projects/<locale>/<slug>.md` |
| UI strings | `src/i18n/ui.ts` |
| Colours, type scale, spacing | `@theme` in `src/styles/theme.css` |

Records in `src/data/` carry both languages on the same object, so a missing translation is a type error rather than a page that quietly renders Spanish.

## Deploying

Static output in `dist/`, published to GitHub Pages.

## Licence

MIT.
