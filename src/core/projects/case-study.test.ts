import { describe, expect, it } from 'vitest';

import { caseStudyTitle } from './case-study';

describe('caseStudyTitle', () => {
  /* The docs site answers "what is it, how do I use it"; the portfolio answers "how was it made". */
  it('names the project as a case study, not as the product', () => {
    expect(caseStudyTitle('SnakeORM', 'es')).toBe('SnakeORM: caso de estudio');
    expect(caseStudyTitle('SnakeORM', 'en')).toBe('SnakeORM: case study');
  });

  /* The site adds « | <owner's name> » to every portfolio page: the longest project name must still fit. */
  it('leaves room for the owner name suffix within 60 characters', () => {
    expect(
      `${caseStudyTitle('@velezanthony/design', 'es')} | Anthony Velez Tapia`.length,
    ).toBeLessThanOrEqual(60);
  });
});
