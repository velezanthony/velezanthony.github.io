/**
 * The files a sitemap URL is built from. Its `<lastmod>` is the newest commit
 * among them, so a path that drifts from the tree does not fail — it silently
 * freezes the date at whatever last touched the old path.
 *
 * `segments` are canonical route keys (`cv`, `projects`…), not the localized
 * URL segments.
 */
export const sourcesOf = (locale: string, [section, slug]: string[]): string[] => {
  const page = 'src/pages/[...lang]';
  const data = 'src/data';

  if (!section) {
    return [`${page}/index.astro`, `${page}/_sections`, `${data}/profile.ts`, `${data}/projects.ts`];
  }
  if (section === 'cv') {
    return [
      `${page}/[cv]`,
      `${data}/profile.ts`,
      `${data}/experience.ts`,
      `${data}/education.ts`,
      `${data}/projects.ts`,
    ];
  }
  if (section === 'experience') {
    return [`${page}/[experience]`, `${data}/experience.ts`, `${data}/education.ts`];
  }
  if (section === 'projects') {
    return slug
      ? [`src/content/projects/${locale}/${slug}.md`, `${page}/[projects]/[slug].astro`, `${data}/projects.ts`]
      : [
          `${page}/[projects]/index.astro`,
          `${page}/[projects]/_sections/ProjectIndexSection.astro`,
          `${data}/projects.ts`,
        ];
  }
  return [];
};
