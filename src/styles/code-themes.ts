import type { BundledTheme } from 'shiki';

/**
 * Shiki's themes for every highlighted block: Markdown's fences and the cards' code visuals. One
 * place, so the two never drift apart.
 */
export const codeThemes = {
  light: 'github-light-default',
  dark: 'github-dark-default',
} as const satisfies Record<'light' | 'dark', BundledTheme>;
