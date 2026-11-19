import type { Locale } from '@/core/i18n/locales';
import type { Localized } from '@/core/types';

export type PrivacyBlock =
  | { kind: 'text'; text: Localized }
  | { kind: 'list'; items: Localized<string[]> }
  | { kind: 'table'; caption: Localized; head: Localized<string[]>; rows: Localized<string[][]> }
  | { kind: 'links'; items: { label: Localized; href: string }[] };

export interface PrivacySection {
  /** The anchor of the section, and its key. Not translated. */
  id: string;
  title: Localized;
  blocks: PrivacyBlock[];
}

export type ResolvedBlock =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] }
  | { kind: 'links'; items: { label: string; href: string }[] };

export interface ResolvedSection {
  id: string;
  title: string;
  blocks: ResolvedBlock[];
}

/** The policy in one language, for a presentational component that knows no `Localized`. */
export function resolvePrivacy(sections: PrivacySection[], lang: Locale): ResolvedSection[] {
  return sections.map(({ id, title, blocks }) => ({
    id,
    title: title[lang],
    blocks: blocks.map((block): ResolvedBlock => {
      switch (block.kind) {
        case 'text':
          return { kind: 'text', text: block.text[lang] };
        case 'list':
          return { kind: 'list', items: block.items[lang] };
        case 'table':
          return {
            kind: 'table',
            caption: block.caption[lang],
            head: block.head[lang],
            rows: block.rows[lang],
          };
        case 'links':
          return {
            kind: 'links',
            items: block.items.map(({ label, href }) => ({ label: label[lang], href })),
          };
      }
    }),
  }));
}
