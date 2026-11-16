import { CONSENT_KEY, safeGet, safeSet } from './storage';

export type Consent = 'granted' | 'denied';

/** Bump it when the policy changes in a way that needs a fresh answer: a stored choice from
    another version reads as no choice at all, so everybody is asked again. */
export const CONSENT_VERSION = 1;

export function serializeConsent(choice: Consent, version = CONSENT_VERSION): string {
  return JSON.stringify({ v: version, choice });
}

/** The stored choice, if it is a readable one of this version. Anything else — corrupt, from
    another version, hand-edited — is "no choice yet": the visitor is asked, never assumed. */
export function parseConsent(raw: string | null): Consent | undefined {
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return undefined;
    const { v, choice } = value as { v?: unknown; choice?: unknown };
    if (v !== CONSENT_VERSION) return undefined;
    return choice === 'granted' || choice === 'denied' ? choice : undefined;
  } catch {
    return undefined;
  }
}

export function readConsent(storage: Storage | undefined): Consent | undefined {
  return parseConsent(safeGet(storage, CONSENT_KEY));
}

/** True when the choice was stored. */
export function writeConsent(storage: Storage | undefined, choice: Consent): boolean {
  return safeSet(storage, CONSENT_KEY, serializeConsent(choice));
}

/**
 * Every domain a cookie of this host could have been set on: the host and each parent, with and
 * without the leading dot. A bare top-level domain is left out — no cookie lives there, and the
 * browser would refuse it.
 */
export function domainsOf(hostname: string): string[] {
  const labels = hostname.split('.');
  const domains: string[] = [];
  for (let i = 0; i < labels.length - 1; i++) {
    const domain = labels.slice(i).join('.');
    domains.push(domain, `.${domain}`);
  }
  return domains;
}

const isAnalyticsCookie = (name: string) => /^_ga(_.+)?$/.test(name);

/**
 * `document.cookie` strings that expire the Google Analytics cookies (`_ga`, `_ga_<container>`).
 * A cookie can only be removed from the domain it was set on, and the page cannot tell which one
 * that was, so each is expired on the host alone and on every parent domain.
 */
export function analyticsCookiesToDelete(cookieJar: string, hostname: string): string[] {
  const names = cookieJar
    .split(';')
    .map((pair) => pair.split('=')[0]!.trim())
    .filter(isAnalyticsCookie);
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

  return names.flatMap((name) => [
    `${name}=; ${expired}`,
    ...domainsOf(hostname).map((domain) => `${name}=; ${expired}; domain=${domain}`),
  ]);
}

const GTM_SCRIPT_ID = 'gtm-script';

/** Idempotent: the container is loaded once however many times consent is granted. */
function loadGtm(doc: Document, id: string): boolean {
  if (doc.getElementById(GTM_SCRIPT_ID)) return false;

  const win = doc.defaultView as unknown as { dataLayer?: unknown[] };
  win.dataLayer ??= [];
  win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = doc.createElement('script');
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  doc.head.appendChild(script);
  return true;
}

export interface ConsentEnv {
  doc: Document;
  storage: Storage | undefined;
  hostname: string;
  reload: () => void;
}

/**
 * Wires the banner. Google Tag Manager is loaded here and only here, and only for a visitor who
 * said yes — nothing from Google is requested before that.
 *
 * Revoking has to be as easy as granting, and it has to be real: once the container is running
 * it cannot be unloaded, so a refusal after a grant deletes the cookies and reloads the page.
 */
export function initConsent({ doc, storage, hostname, reload }: ConsentEnv): void {
  const banner = doc.querySelector<HTMLElement>('[data-consent-banner]');
  if (!banner) return;

  const gtmId = banner.dataset.gtmId;
  let loaded = false;

  /* The banner is fixed to the bottom; the page gets room for it so it never hides the footer. */
  const show = () => {
    banner.removeAttribute('hidden');
    doc.documentElement.style.setProperty('--consent-space', `${banner.offsetHeight ?? 0}px`);
  };
  const hide = () => {
    banner.setAttribute('hidden', '');
    doc.documentElement.style.removeProperty('--consent-space');
  };

  const grant = () => {
    if (gtmId) loaded = loadGtm(doc, gtmId) || loaded;
  };

  const choose = (choice: Consent) => {
    writeConsent(storage, choice);
    hide();
    if (choice === 'granted') return grant();
    if (!loaded) return;
    for (const cookie of analyticsCookiesToDelete(doc.cookie, hostname)) doc.cookie = cookie;
    reload();
  };

  banner.querySelector('[data-consent-accept]')?.addEventListener('click', () => choose('granted'));
  banner.querySelector('[data-consent-reject]')?.addEventListener('click', () => choose('denied'));

  for (const opener of doc.querySelectorAll('[data-consent-open]')) {
    opener.addEventListener('click', () => {
      show();
      /* Keyboard users pressed a footer control: the choice is where they land. */
      banner.querySelector<HTMLElement>('[data-consent-accept]')?.focus();
    });
  }

  const stored = readConsent(storage);
  if (stored === 'granted') grant();
  if (stored === undefined) show();
}
