import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { themeColors } from './theme-colors';

/* `<meta name="theme-color">` cannot read a custom property, so the values are written twice.
   This is what keeps the copy honest when the palette changes. */
describe('themeColors', () => {
  const canvas = [
    ...readFileSync('src/styles/theme.css', 'utf8').matchAll(/--color-canvas:\s*([^;]+);/g),
  ].map((match) => match[1]!.trim());

  it('matches the light canvas token', () => {
    expect(canvas[0]).toBe(themeColors.light);
  });

  it('matches every dark canvas token', () => {
    expect(canvas.slice(1).length).toBeGreaterThan(0);
    for (const value of canvas.slice(1)) expect(value).toBe(themeColors.dark);
  });
});
