import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { downloadsOf, formatDownloads } from '@data/downloads';
import { resolveLocalized } from '@i18n/localized';
import type { Resolved } from '@i18n/localized';
import type { Locale } from '@i18n/ui';

export type ProjectEntry = CollectionEntry<'projects'>;

export type LocalisedProject = Resolved<ProjectEntry>;

export async function getProjects(lang: Locale): Promise<LocalisedProject[]> {
  const all = await getCollection('projects');
  return resolveLocalized(all, lang, (entry) => entry.data.slug).sort(
    (a, b) => a.entry.data.order - b.entry.data.order,
  );
}

export async function getProject(
  lang: Locale,
  slug: string,
): Promise<LocalisedProject | undefined> {
  const projects = await getProjects(lang);
  return projects.find((project) => project.entry.data.slug === slug);
}

/** Every slug that must be built, regardless of locale coverage. */
export async function getProjectSlugs(): Promise<string[]> {
  const all = await getCollection('projects');
  return [...new Set(all.map((entry) => entry.data.slug))];
}

/** Each project's download count, worded for `lang`, by slug. Projects no store answered for are
    left out. Shares the build's cache with every other page asking. */
export async function getDownloadLabels(
  projects: LocalisedProject[],
  lang: Locale,
): Promise<Record<string, string>> {
  const labels = await Promise.all(
    projects.map(async ({ entry }) => {
      const label = formatDownloads(await downloadsOf(entry.data.downloads), lang);
      return [entry.data.slug, label] as const;
    }),
  );
  return Object.fromEntries(
    labels.filter((pair): pair is [string, string] => pair[1] !== undefined),
  );
}
