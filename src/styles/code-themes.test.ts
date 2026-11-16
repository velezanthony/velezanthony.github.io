import { readFileSync } from 'node:fs';
import { bundledThemes } from 'shiki';
import { describe, expect, it } from 'vitest';

import { codeThemes } from './code-themes';

/** WCAG relative luminance of `#rgb`, `#rrggbb` or `#rrggbbaa` (alpha ignored). */
function luminance(hex: string): number {
  let digits = hex.slice(1);
  if (digits.length === 3) digits = [...digits].map((d) => d + d).join('');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(digits.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('codeThemes', () => {
  it.each(Object.entries(codeThemes))(
    '%s: every token reads at 4.5:1 on the block',
    async (_, name) => {
      const theme = (await bundledThemes[name]()).default;
      const background = theme.colors?.['editor.background'];
      expect(background).toBeDefined();
      /* A token with a background of its own (a stray carriage return, say) is not text on the
       block's background. */
      const failing = (theme.tokenColors ?? [])
        .filter((token) => token.settings.foreground && !token.settings.background)
        .map((token) => ({
          scope: token.scope,
          foreground: token.settings.foreground!,
          ratio: contrast(token.settings.foreground!, background!),
        }))
        .filter(({ ratio }) => ratio < 4.5);
      expect(failing).toEqual([]);
    },
  );
});

/* Shiki writes the dark colours as `--shiki-dark` and leaves switching to the site. The site goes
   dark two ways — the system asks, or the visitor picks it — and the code must follow both. */
describe('the dark code theme', () => {
  const selectors = [
    ...readFileSync('src/styles/theme.css', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/([^{}]+)\{[^{}]*color:\s*var\(--shiki-dark\)/g),
  ]
    .flatMap((match) => match[1]!.split(','))
    .map((selector) => selector.trim());

  it.each([":root:not([data-theme='light'])", ":root[data-theme='dark']"])(
    'applies under %s',
    (root) => {
      expect(selectors).toContain(`${root} .astro-code`);
      expect(selectors).toContain(`${root} .astro-code span`);
    },
  );
});
