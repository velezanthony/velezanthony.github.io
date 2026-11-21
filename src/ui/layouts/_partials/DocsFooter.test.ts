import { describe, expect, it } from 'vitest';

import { designStrings } from '@velezanthony/design/site';
import { render, text } from '@ui/test-utils';
import DocsFooter from './DocsFooter.astro';

/* The props the library hands the docs pages' footer (`FooterProps`). */
function props(lang: 'es' | 'en', extra: Record<string, unknown> = {}) {
  return {
    lang,
    siteName: 'Anthony Velez Tapia',
    year: 2026,
    strings: designStrings(lang),
    privacyUrl: lang === 'es' ? '/privacidad/' : '/en/privacy/',
    cookieControl: false,
    ...extra,
  };
}

describe('DocsFooter (the site footer on docs pages)', () => {
  it('is the site footer: contact, source, library and privacy', async () => {
    const doc = await render(DocsFooter, props('es'));
    expect(doc.querySelectorAll('footer')).toHaveLength(1);
    expect(text(doc)).toContain('Contacto');
    expect(text(doc)).toContain('@velezanthony/design');
    expect(doc.querySelector('a[href="/privacidad/"]')).not.toBeNull();
  });

  it('follows the page locale', async () => {
    const doc = await render(DocsFooter, props('en'));
    expect(text(doc)).toContain('Contact');
    expect(doc.querySelector('a[href="/en/privacy/"]')).not.toBeNull();
  });

  it('lets the footer sit at the bottom of the docs page column', async () => {
    const doc = await render(DocsFooter, props('es'));
    expect(doc.querySelector('footer')!.classList.contains('mt-auto')).toBe(true);
  });

  it('reopens the cookie choice only when the site asks for consent', async () => {
    expect((await render(DocsFooter, props('es'))).querySelector('[data-consent-open]')).toBeNull();
    const doc = await render(DocsFooter, props('es', { cookieControl: true }));
    expect(text(doc.querySelector('button[data-consent-open]'))).toBe('Preferencias de cookies');
  });
});
