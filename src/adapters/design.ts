import config from 'virtual:@velezanthony/design/config';
import type { UiStrings } from '@velezanthony/design/ui-strings';
import type { Locale } from '@/core/i18n/locales';

/** The library already merged the site's overrides into each locale's strings. */
export function designStrings(lang: Locale): UiStrings {
  return config.strings[lang] as UiStrings;
}

/** Resolved by the library from `PUBLIC_GTM_ID`, so it validates the format. */
export const gtmId: string | undefined = config.gtmId;
