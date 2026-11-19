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
| `npm run todo` | Lists the `todo:` entries still open in the case studies |

## Dependencies

**Runtime**

| Package | Why |
| --- | --- |
| `astro` | Static site generator. Routing, i18n, content collections, image pipeline, self-hosted fonts |
| `@velezanthony/design` | The design library. It brings Tailwind, the code themes, the build steps and the last-modified dates. The portfolio's own tokens live in `@theme` inside `src/site.css` (the `theme` option of `docs.config.mjs`) |

**Development**

| Package | Why |
| --- | --- |
| `@astrojs/check` | Type checking for `.astro` files, wired into `build` |
| `typescript` | — |

Fonts (IBM Plex Sans and Mono) are downloaded and self-hosted at build time by Astro's fonts API. They are not a dependency and nothing is fetched at runtime.

## Layout

```
src/
├── core/             pure logic: i18n, downloads, timeline, privacy, seo (no Astro, no fetch)
├── data/             content: profile · experience · education · privacy · ui phrases
├── adapters/         Astro and network: projects · downloads
├── client/           browser scripts
├── ui/               components/ · layouts/
├── pages/            routes, with page-specific pieces in `_partials/`
├── content/projects/ case studies, one folder per locale
└── site.css
```

`doc/architecture.md` records the decisions and the reasoning behind them. Read it before changing structure.

## Editing content

| What | Where |
| --- | --- |
| A job, a degree, contact details | `src/data/` |
| A project case study | `src/content/projects/<locale>/<slug>.md` |
| UI strings | `src/data/ui.ts` |
| Colours, type scale, spacing | `@theme` in `src/site.css` (the library's tokens come with `@velezanthony/design`) |

Records in `src/data/` carry both languages on the same object, so a missing translation is a type error rather than a page that quietly renders Spanish.

## Deploying

Static output in `dist/`, published to GitHub Pages.

## Licence

MIT.
