import { describe, expect, it } from 'vitest';

import { locales } from '@/core/i18n/locales';
import { email, profile } from './profile';
import { privacySections, privacyUpdated, resolvePrivacy } from './privacy';

const blocksOf = (kind: string) =>
  resolvePrivacy('en')
    .flatMap((section) => section.blocks)
    .filter((block) => block.kind === kind);

describe('privacySections', () => {
  it('has unique ids, for anchors', () => {
    const ids = privacySections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('names the controller from the profile, not from a copy', () => {
    const [first] = resolvePrivacy('en');
    expect(JSON.stringify(first)).toContain(profile.name);
    expect(JSON.stringify(first)).toContain(`mailto:${email}`);
  });

  /* A row with a missing cell shifts every cell after it, in one language only. */
  it.each(locales)('every table row has a cell per column in %s', (lang) => {
    for (const block of resolvePrivacy(lang).flatMap((section) => section.blocks)) {
      if (block.kind !== 'table') continue;
      for (const row of block.rows) expect(row).toHaveLength(block.head.length);
    }
  });

  it('has the same table shape in every locale', () => {
    const shape = (lang: (typeof locales)[number]) =>
      resolvePrivacy(lang)
        .flatMap((section) => section.blocks)
        .map((block) =>
          block.kind === 'table'
            ? [block.kind, block.head.length, block.rows.length]
            : block.kind === 'list'
              ? [block.kind, block.items.length]
              : [block.kind],
        );
    expect(shape('en')).toEqual(shape('es'));
  });

  it('links only over https or mailto', () => {
    for (const block of blocksOf('links')) {
      if (block.kind !== 'links') continue;
      for (const { href } of block.items) expect(href).toMatch(/^(https:\/\/|mailto:)/);
    }
  });

  /* What the page promises must be what the code deletes (`analyticsCookiesToDelete`). */
  it('lists the Google Analytics cookies the consent code removes', () => {
    const section = resolvePrivacy('es').find(({ id }) => id === 'cookies');
    const table = section?.blocks.find((block) => block.kind === 'table');
    expect(table?.kind === 'table' && table.rows.map((row) => row[0])).toEqual(['_ga', '_ga_<ID>']);
  });

  it('has no empty text in either language', () => {
    for (const lang of locales) {
      const json = JSON.stringify(resolvePrivacy(lang));
      expect(json).not.toContain('""');
    }
  });
});

describe('privacyUpdated', () => {
  it('is an ISO date', () => {
    expect(privacyUpdated).toBe('2026-11-10');
  });
});
