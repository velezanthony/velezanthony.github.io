/* Browser storage keys, in one place. The pre-paint script in BaseLayout is inline and cannot
   import, so it receives THEME_KEY through `define:vars`. */
export const THEME_KEY = 'theme';
/** The locale of the last page visited, read back by the 404, which has no locale of its own. */
export const LANG_KEY = 'lang';

/**
 * Storage access that cannot break the page. Private windows and blocked site data throw on
 * every call, and a remembered theme or locale is a convenience, never worth an exception.
 */
export function safeGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** True when the value was stored. */
export function safeSet(storage: Storage | undefined, key: string, value: string): boolean {
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** The browser's storage, or undefined. With site data blocked, some browsers throw on merely
    reading `localStorage`, before any call is made. */
export function storageOf(name: 'localStorage' | 'sessionStorage'): Storage | undefined {
  try {
    return globalThis[name];
  } catch {
    return undefined;
  }
}
