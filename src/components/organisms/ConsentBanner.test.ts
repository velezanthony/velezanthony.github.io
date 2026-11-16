import { describe, expect, it } from 'vitest';

import { render, text } from '@/test/render';
import ConsentBanner from './ConsentBanner.astro';

const props = { lang: 'en', gtmId: 'GTM-TEST' } as const;

describe('ConsentBanner', () => {
  /* Shown by the script once it knows there is no stored choice: without JavaScript there is
     nothing to answer it, so there is nothing to show. */
  it('starts hidden', async () => {
    const banner = (await render(ConsentBanner, props)).querySelector('[data-consent-banner]')!;
    expect(banner.hasAttribute('hidden')).toBe(true);
  });

  it('is a labelled region, not a modal', async () => {
    const banner = (await render(ConsentBanner, props)).querySelector('[data-consent-banner]')!;
    expect(banner.tagName).toBe('SECTION');
    expect(banner.getAttribute('aria-label')).toBe('Cookie notice');
    expect(banner.getAttribute('role')).toBeNull();
    expect(banner.getAttribute('aria-modal')).toBeNull();
  });

  it('hands the container id to the script', async () => {
    const banner = (await render(ConsentBanner, props)).querySelector('[data-consent-banner]')!;
    expect(banner.getAttribute('data-gtm-id')).toBe('GTM-TEST');
  });

  it('links to the privacy page of its language', async () => {
    const en = await render(ConsentBanner, props);
    const es = await render(ConsentBanner, { ...props, lang: 'es' });
    expect(en.querySelector('a[href="/en/privacy/"]')).not.toBeNull();
    expect(es.querySelector('a[href="/privacidad/"]')).not.toBeNull();
  });

  it('offers accept and reject, the same size and look', async () => {
    const doc = await render(ConsentBanner, props);
    const accept = doc.querySelector('[data-consent-accept]')!;
    const reject = doc.querySelector('[data-consent-reject]')!;
    expect(text(accept)).toBe('Accept');
    expect(text(reject)).toBe('Reject');
    expect(accept.tagName).toBe('BUTTON');
    expect(reject.tagName).toBe('BUTTON');
    expect(accept.getAttribute('class')).toBe(reject.getAttribute('class'));
  });

  it('speaks Spanish by default', async () => {
    const doc = await render(ConsentBanner, { ...props, lang: 'es' });
    expect(text(doc.querySelector('[data-consent-accept]'))).toBe('Aceptar');
    expect(text(doc.querySelector('[data-consent-reject]'))).toBe('Rechazar');
  });
});
