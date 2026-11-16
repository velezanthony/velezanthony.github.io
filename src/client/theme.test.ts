import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { isDark, nextTheme, parseTheme, syncThemeColor, syncToggle } from './theme';

describe('parseTheme', () => {
  it.each(['dark', 'light'])('accepts %s', (value) => {
    expect(parseTheme(value)).toBe(value);
  });

  it.each([null, '', 'Dark', 'system'])('ignores %j', (value) => {
    expect(parseTheme(value)).toBeUndefined();
  });
});

describe('isDark', () => {
  it('follows an explicit choice over the system', () => {
    expect(isDark('dark', false)).toBe(true);
    expect(isDark('light', true)).toBe(false);
  });

  it('follows the system when nothing was chosen', () => {
    expect(isDark(undefined, true)).toBe(true);
    expect(isDark(undefined, false)).toBe(false);
  });
});

describe('nextTheme', () => {
  it('switches away from whatever is showing, chosen or not', () => {
    expect(nextTheme(undefined, true)).toBe('light');
    expect(nextTheme(undefined, false)).toBe('dark');
    expect(nextTheme('dark', false)).toBe('light');
  });
});

/* The button switches dark mode on and off, so `aria-pressed` is whether dark mode is on. */
describe('syncToggle', () => {
  const button = () => parseHTML('<button></button>').document.querySelector('button')!;

  it('reports dark mode as pressed', () => {
    const b = button();
    syncToggle(b, true);
    expect(b.getAttribute('aria-pressed')).toBe('true');
  });

  it('reports light mode as not pressed', () => {
    const b = button();
    syncToggle(b, false);
    expect(b.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('syncThemeColor', () => {
  /* Each tag answers to the system's preference; a choice must override both, or the browser bar
     keeps the system's colour under a page of the other one. */
  it('gives every theme-color tag the chosen colour', () => {
    const { document } = parseHTML(
      '<html><head>' +
        '<meta name="theme-color" content="#fcfefe" media="(prefers-color-scheme: light)">' +
        '<meta name="theme-color" content="#0e1111" media="(prefers-color-scheme: dark)">' +
        '</head></html>',
    );
    syncThemeColor(document, '#0e1111');
    const contents = [...document.querySelectorAll('meta[name="theme-color"]')].map((meta) =>
      meta.getAttribute('content'),
    );
    expect(contents).toEqual(['#0e1111', '#0e1111']);
  });
});
