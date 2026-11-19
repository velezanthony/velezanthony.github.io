import type { Locale } from '@core/i18n/locales';
import type { Downloads } from './counts';

const words = {
  es: { perMonth: 'descargas al mes', total: 'descargas' },
  en: { perMonth: 'downloads a month', total: 'downloads' },
} satisfies Record<Locale, Record<'perMonth' | 'total', string>>;

/** "811 descargas al mes", "1,794 downloads": always with its unit, never as users. */
export function formatDownloads(
  downloads: Pick<Downloads, 'perMonth' | 'total' | 'approximate'>,
  lang: Locale,
): string | undefined {
  const number = (n: number) =>
    new Intl.NumberFormat(lang, downloads.approximate ? { notation: 'compact' } : {}).format(n);
  if (downloads.perMonth !== undefined) {
    return `${number(downloads.perMonth)} ${words[lang].perMonth}`;
  }
  if (downloads.total !== undefined) return `${number(downloads.total)} ${words[lang].total}`;
  return undefined;
}
