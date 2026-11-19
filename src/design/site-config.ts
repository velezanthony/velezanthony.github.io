import config from 'virtual:@velezanthony/design/config';
import type { ComponentProps } from 'astro/types';
import type ThemeToggle from '@velezanthony/design/components/molecules/controls/ThemeToggle.astro';
import type { Locale } from '@i18n/ui';

/** The UI strings the library's components take, which its own types do not export. */
export type UiStrings = ComponentProps<typeof ThemeToggle>['strings'];

/** The library already merged the site's overrides into each locale's strings. */
export function designStrings(lang: Locale): UiStrings {
  return config.strings[lang] as UiStrings;
}

/** Resolved by the library from `PUBLIC_GTM_ID`, so it validates the format. */
export const gtmId: string | undefined = config.gtmId;
