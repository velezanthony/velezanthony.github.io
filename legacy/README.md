# Legacy

Parked code, outside tsconfig, ESLint, Prettier and Vitest. One line per item.

- `seo/sitemap/links.ts` (+ test): `isIndexable` and `createSerialize`, the filter and the hreflang/`<lastmod>` serializer for `@astrojs/sitemap`. Parked because `@velezanthony/design` generates the sitemap now, without `<lastmod>`. To bring it back: reinstall `@astrojs/sitemap`, restore the `sitemap()` integration with `serialize: createSerialize(createLastmod(git, sourcesOf))` and fix its relative imports (`lastmod` and `git` stay live in `src/seo/`).
- `seo/sitemap/sources.ts` (+ test): the source files each URL's `<lastmod>` is the newest commit of. Parked together with the serializer; needed only if `<lastmod>` returns.
- `seo/sitemap/files.ts`: the `sitemap-pages.xml` and `sitemap-style.xml` names the old index used. Parked: the library owns both names now (`/sitemap-pages.xml`, `/_design/sitemap.css`).
