import type { Locale } from '@i18n/ui';

/**
 * Content, not UI chrome, so it lives here rather than in the translation
 * catalogue. A missing translation is a type error, not a page that
 * quietly renders Spanish to an English reader.
 */
export type Localized<T = string> = Record<Locale, T>;

/** `YYYY-MM`. Formatted per locale at render time, never stored as prose. */
export type YearMonth = `${number}-${number}`;

export interface DateRange {
  start: YearMonth;
  /** `null` means the role is current. */
  end: YearMonth | null;
}

export interface Job extends DateRange {
  /** Company names are not translated. */
  company: string;
  role: Localized;
  /** Omitted when the real location is not known. Never guessed. */
  location?: Localized;
  highlights: Localized<string[]>;
  /** Technology names are not translated either. */
  stack: string[];
}

/** Only years are known for education, so only years are modelled. */
export interface Study {
  title: Localized;
  /** How the timeline names it. Declared rather than cut out of `title`'s parentheses:
      the shape of a title is not a place to store a field. Not translated. */
  abbr: string;
  school: string;
  startYear: number;
  endYear: number;
}

export interface SpokenLanguage {
  name: Localized;
  level: Localized;
}

export interface ContactLink {
  label: string;
  href: string;
  /** Key of an icon in `src/components/atoms/Icon.astro`. */
  icon: 'mail' | 'external' | 'github' | 'linkedin';
  /** Shown as the visible text; falls back to `label`. */
  handle?: string;
}

export interface StackGroup {
  label: Localized;
  /** The list itself is technology names, so it is shared. */
  items: string;
}
