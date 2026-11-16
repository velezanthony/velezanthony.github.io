import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';

import {
  CONSENT_VERSION,
  analyticsCookiesToDelete,
  domainsOf,
  initConsent,
  parseConsent,
  readConsent,
  serializeConsent,
  writeConsent,
} from './consent';

const blocked = {
  getItem: () => {
    throw new DOMException('denied', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('denied', 'SecurityError');
  },
} as unknown as Storage;

function memory(initial: Record<string, string> = {}): Storage {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  } as Storage;
}

describe('parseConsent', () => {
  it.each(['granted', 'denied'] as const)('reads back a stored %s', (choice) => {
    expect(parseConsent(serializeConsent(choice))).toBe(choice);
  });

  /* Anything unreadable is "no choice yet": the visitor is asked again, never assumed. */
  it.each([null, '', 'granted', '{', 'null', '[]', '{"v":1}', '{"v":1,"choice":"maybe"}'])(
    'is no choice for %j',
    (raw) => {
      expect(parseConsent(raw)).toBeUndefined();
    },
  );

  /* A policy change bumps the version, which is how everybody gets asked again. */
  it('is no choice when the stored version is not the current one', () => {
    const old = serializeConsent('granted', CONSENT_VERSION - 1);
    expect(parseConsent(old)).toBeUndefined();
  });
});

describe('readConsent / writeConsent', () => {
  it('round-trips through storage', () => {
    const storage = memory();
    expect(writeConsent(storage, 'denied')).toBe(true);
    expect(readConsent(storage)).toBe('denied');
  });

  it('is no choice with an empty, blocked or missing storage', () => {
    expect(readConsent(memory())).toBeUndefined();
    expect(readConsent(blocked)).toBeUndefined();
    expect(readConsent(undefined)).toBeUndefined();
  });

  it('reports a write that did not land', () => {
    expect(writeConsent(blocked, 'granted')).toBe(false);
  });
});

describe('domainsOf', () => {
  it('lists the host and every parent a cookie could have been set on', () => {
    expect(domainsOf('velezanthony.github.io')).toEqual([
      'velezanthony.github.io',
      '.velezanthony.github.io',
      'github.io',
      '.github.io',
    ]);
  });

  it('never names a bare top-level domain', () => {
    expect(domainsOf('localhost')).toEqual([]);
    expect(domainsOf('example.com')).toEqual(['example.com', '.example.com']);
  });
});

describe('analyticsCookiesToDelete', () => {
  it('finds _ga and _ga_<container>, and nothing else', () => {
    const jar = 'theme=dark; _ga=GA1.1.1; _ga_ABC123=GS2.1; _gat=1; other_ga=2; _gid=3';
    const names = analyticsCookiesToDelete(jar, 'example.com').map((c) => c.split('=')[0]);
    expect([...new Set(names)]).toEqual(['_ga', '_ga_ABC123']);
  });

  it('expires each one on the current host and on every parent domain', () => {
    const cookies = analyticsCookiesToDelete('_ga=1', 'example.com');
    expect(cookies).toHaveLength(3);
    for (const cookie of cookies) {
      expect(cookie).toContain('expires=Thu, 01 Jan 1970 00:00:00 GMT');
      expect(cookie).toContain('path=/');
    }
    expect(cookies.some((c) => !c.includes('domain='))).toBe(true);
    expect(cookies.some((c) => c.includes('domain=.example.com'))).toBe(true);
  });

  it('is empty when the jar holds none', () => {
    expect(analyticsCookiesToDelete('', 'example.com')).toEqual([]);
    expect(analyticsCookiesToDelete('theme=dark', 'example.com')).toEqual([]);
  });
});

describe('initConsent', () => {
  const markup = `
    <section data-consent-banner data-gtm-id="GTM-TEST" hidden>
      <button data-consent-accept>Accept</button>
      <button data-consent-reject>Reject</button>
    </section>
    <button data-consent-open>Preferences</button>`;

  function setup(storage: Storage | undefined, cookie = '') {
    const { document } = parseHTML(
      `<!doctype html><html><head></head><body>${markup}</body></html>`,
    );
    let jar = cookie;
    Object.defineProperty(document, 'cookie', {
      get: () => jar,
      set: (value: string) => {
        written.push(value);
        jar = value;
      },
    });
    const written: string[] = [];
    const reload = vi.fn();
    initConsent({ doc: document, storage, hostname: 'example.com', reload });
    const banner = document.querySelector('[data-consent-banner]')!;
    const click = (selector: string) =>
      document.querySelector(selector)!.dispatchEvent(new document.defaultView!.Event('click'));
    const gtm = () => document.querySelector('script[src*="googletagmanager.com"]');
    return { document, banner, click, gtm, reload, written };
  }

  it('asks when nothing was chosen, and loads nothing', () => {
    const { banner, gtm } = setup(memory());
    expect(banner.hasAttribute('hidden')).toBe(false);
    expect(gtm()).toBeNull();
  });

  it('asks when storage is blocked', () => {
    expect(setup(blocked).banner.hasAttribute('hidden')).toBe(false);
  });

  it('stays hidden and loads GTM for a stored grant', () => {
    const { banner, gtm } = setup(memory({ consent: serializeConsent('granted') }));
    expect(banner.hasAttribute('hidden')).toBe(true);
    expect(gtm()?.getAttribute('src')).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST');
  });

  it('stays hidden and loads nothing for a stored refusal', () => {
    const { banner, gtm } = setup(memory({ consent: serializeConsent('denied') }));
    expect(banner.hasAttribute('hidden')).toBe(true);
    expect(gtm()).toBeNull();
  });

  it('accepting stores the choice, hides the banner and loads GTM', () => {
    const storage = memory();
    const { banner, click, gtm, reload } = setup(storage);
    click('[data-consent-accept]');
    expect(readConsent(storage)).toBe('granted');
    expect(banner.hasAttribute('hidden')).toBe(true);
    expect(gtm()).not.toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  it('accepting twice loads GTM once', () => {
    const { click, document } = setup(memory());
    click('[data-consent-accept]');
    click('[data-consent-accept]');
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(1);
  });

  it('rejecting from the start stores the refusal and reloads nothing', () => {
    const storage = memory();
    const { banner, click, gtm, reload, written } = setup(storage, '_ga=1');
    click('[data-consent-reject]');
    expect(readConsent(storage)).toBe('denied');
    expect(banner.hasAttribute('hidden')).toBe(true);
    expect(gtm()).toBeNull();
    expect(reload).not.toHaveBeenCalled();
    expect(written).toEqual([]);
  });

  /* GTM is already running on this page, and the only way to take it down is to leave it. */
  it('rejecting after a grant deletes the GA cookies and reloads', () => {
    const storage = memory({ consent: serializeConsent('granted') });
    const { click, reload, written } = setup(storage, '_ga=1; _ga_X=2');
    click('[data-consent-reject]');
    expect(readConsent(storage)).toBe('denied');
    expect(written.length).toBeGreaterThan(0);
    expect(written.every((c) => c.includes('1970'))).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('the preferences control reopens the banner and focuses a choice', () => {
    const { banner, click, document } = setup(memory({ consent: serializeConsent('denied') }));
    const accept = document.querySelector<HTMLElement>('[data-consent-accept]')!;
    accept.focus = vi.fn();
    click('[data-consent-open]');
    expect(banner.hasAttribute('hidden')).toBe(false);
    expect(accept.focus).toHaveBeenCalled();
  });

  it('does nothing on a page without the banner', () => {
    const { document } = parseHTML('<!doctype html><html><body></body></html>');
    expect(() =>
      initConsent({ doc: document, storage: memory(), hostname: 'x.com', reload: vi.fn() }),
    ).not.toThrow();
  });
});
