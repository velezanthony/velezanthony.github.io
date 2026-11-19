import { describe, expect, it } from 'vitest';

import { createTranslations } from './translate';

const PENDING = 'TODO:translate';
const useTranslations = createTranslations(
  { Proyectos: 'Projects', 'Frase pendiente': PENDING },
  PENDING,
);

describe('useTranslations', () => {
  it('returns the Spanish phrase itself, since it is the key', () => {
    expect(useTranslations('es')('Proyectos')).toBe('Proyectos');
  });

  it('translates into English', () => {
    expect(useTranslations('en')('Proyectos')).toBe('Projects');
  });

  it('falls back to Spanish while the English is pending', () => {
    expect(useTranslations('en')('Frase pendiente')).toBe('Frase pendiente');
  });
});
