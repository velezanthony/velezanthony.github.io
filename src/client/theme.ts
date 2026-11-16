export type Theme = 'dark' | 'light';

/** A stored or attribute value, if it names a theme. */
export function parseTheme(value: string | null | undefined): Theme | undefined {
  return value === 'dark' || value === 'light' ? value : undefined;
}

/** An explicit choice wins; without one, the system decides. */
export function isDark(chosen: Theme | undefined, systemDark: boolean): boolean {
  return chosen ? chosen === 'dark' : systemDark;
}

/** The theme the toggle switches to: away from whatever is showing. */
export function nextTheme(chosen: Theme | undefined, systemDark: boolean): Theme {
  return isDark(chosen, systemDark) ? 'light' : 'dark';
}

/** The button switches dark mode on and off, so it is pressed while dark mode is on. */
export function syncToggle(button: Element, dark: boolean): void {
  button.setAttribute('aria-pressed', String(dark));
}

/**
 * `<meta name="theme-color">` comes in two, one per system preference, so a choice against the
 * system would leave the browser bar in the other theme. A choice gives both its colour.
 */
export function syncThemeColor(doc: Document, color: string): void {
  for (const meta of doc.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', color);
  }
}
