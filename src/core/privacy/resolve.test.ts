import { describe, expect, it } from 'vitest';

import { resolvePrivacy } from './resolve';
import type { PrivacySection } from './resolve';

const sections: PrivacySection[] = [
  {
    id: 'data',
    title: { es: 'Datos', en: 'Data' },
    blocks: [
      { kind: 'text', text: { es: 'Hola', en: 'Hello' } },
      { kind: 'list', items: { es: ['uno'], en: ['one'] } },
      {
        kind: 'table',
        caption: { es: 'Tabla', en: 'Table' },
        head: { es: ['A'], en: ['B'] },
        rows: { es: [['a1']], en: [['b1']] },
      },
      {
        kind: 'links',
        items: [{ label: { es: 'Enlace', en: 'Link' }, href: 'https://example.com' }],
      },
    ],
  },
];

describe('resolvePrivacy', () => {
  it('picks one language for every kind of block', () => {
    expect(resolvePrivacy(sections, 'en')).toEqual([
      {
        id: 'data',
        title: 'Data',
        blocks: [
          { kind: 'text', text: 'Hello' },
          { kind: 'list', items: ['one'] },
          { kind: 'table', caption: 'Table', head: ['B'], rows: [['b1']] },
          { kind: 'links', items: [{ label: 'Link', href: 'https://example.com' }] },
        ],
      },
    ]);
  });

  it('keeps the section id, which is the anchor, untranslated', () => {
    expect(resolvePrivacy(sections, 'es')[0]?.id).toBe('data');
  });
});
