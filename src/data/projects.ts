import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
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
