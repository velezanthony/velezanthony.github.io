import { describe, expect, it } from 'vitest';

import { resolveLocalized } from './localized';

type Entry = { id: string; slug: string; order: number };
const entry = (id: string, order = 0): Entry => ({ id, slug: id.split('/')[1]!, order });

const resolve = (entries: Entry[], lang: 'es' | 'en') =>
  resolveLocalized(entries, lang, (e) => e.slug).map(({ entry, translationPending }) => [
    entry.id,
    translationPending,
  ]);

describe('resolveLocalized', () => {
  it('picks each entry in the wanted locale', () => {
    const entries = [entry('es/a'), entry('en/a')];
    expect(resolve(entries, 'en')).toEqual([['en/a', false]]);
    expect(resolve(entries, 'es')).toEqual([['es/a', false]]);
  });

  it('falls back to Spanish, and says so', () => {
    expect(resolve([entry('es/a')], 'en')).toEqual([['es/a', true]]);
  });

  /* Spanish is the source: an English-only entry has nothing to fall back to in Spanish. */
  it('drops an entry the default locale does not have when it is not in the wanted one either', () => {
    expect(resolve([entry('en/a')], 'es')).toEqual([]);
  });

  it('keeps one entry per key, in input order', () => {
    const entries = [entry('es/b'), entry('es/a'), entry('en/b')];
    expect(resolve(entries, 'en')).toEqual([
      ['en/b', false],
      ['es/a', true],
    ]);
  });
});
