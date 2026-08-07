import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { defaultLocale } from '@i18n/ui';
import type { Locale } from '@i18n/ui';

export type ProjectEntry = CollectionEntry<'projects'>;
export type ProjectStatus = ProjectEntry['data']['status'];

export interface LocalisedProject {
  entry: ProjectEntry;
  /** True when this locale is falling back to the Spanish source. */
  translationPending: boolean;
}

function localeOf(entry: ProjectEntry): string {
  return entry.id.split('/')[0] ?? defaultLocale;
}

export async function getProjects(lang: Locale): Promise<LocalisedProject[]> {
  const all = await getCollection('projects');

  const bySlug = new Map<string, Map<string, ProjectEntry>>();
  for (const entry of all) {
    const group = bySlug.get(entry.data.slug) ?? new Map<string, ProjectEntry>();
    group.set(localeOf(entry), entry);
    bySlug.set(entry.data.slug, group);
  }

  const resolved: LocalisedProject[] = [];
  for (const group of bySlug.values()) {
    const wanted = group.get(lang);
    const entry = wanted ?? group.get(defaultLocale);
    if (!entry) continue;
    resolved.push({ entry, translationPending: !wanted });
  }

  return resolved.sort((a, b) => a.entry.data.order - b.entry.data.order);
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
