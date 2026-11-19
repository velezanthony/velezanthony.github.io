import { defaultLocale } from '@/data/ui';
import type { Locale } from '@/data/ui';
import { localeOfEntry } from './utils';

export interface Resolved<T> {
  entry: T;
  /** True when this locale is falling back to the Spanish source. */
  translationPending: boolean;
}

/**
 * One entry per key, in `lang` when it exists and in the default locale otherwise. Spanish is
 * the source, so an entry missing from it as well is not shown at all. Keys keep the order in
 * which they first appear.
 */
export function resolveLocalized<T extends { id: string }>(
  entries: T[],
  lang: Locale,
  keyOf: (entry: T) => string,
): Resolved<T>[] {
  const byKey = new Map<string, Map<Locale, T>>();
  for (const entry of entries) {
    const group = byKey.get(keyOf(entry)) ?? new Map<Locale, T>();
    group.set(localeOfEntry(entry.id), entry);
    byKey.set(keyOf(entry), group);
  }

  const resolved: Resolved<T>[] = [];
  for (const group of byKey.values()) {
    const wanted = group.get(lang);
    const entry = wanted ?? group.get(defaultLocale);
    if (entry) resolved.push({ entry, translationPending: !wanted });
  }
  return resolved;
}
