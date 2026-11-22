import { describe, expect, it } from 'vitest';

import { caseStudyTitle, suffixFits } from './case-study';

describe('caseStudyTitle', () => {
  /* The docs site answers "what is it, how do I use it"; the portfolio answers "how was it made". */
  it('names the project as a case study, not as the product', () => {
    expect(caseStudyTitle('SnakeORM', 'es')).toBe('SnakeORM: decisiones, errores y límites');
    expect(caseStudyTitle('SnakeORM', 'en')).toBe('SnakeORM: decisions, mistakes and limits');
  });
});

describe('suffixFits', () => {
  it('is true when title, separator and suffix fit in 60 characters', () => {
    expect(suffixFits('x'.repeat(38), 'Anthony Velez Tapia')).toBe(true);
  });

  it('is false when the whole title would run past 60 characters', () => {
    expect(suffixFits('x'.repeat(39), 'Anthony Velez Tapia')).toBe(false);
  });
});
