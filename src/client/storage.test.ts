import { afterEach, describe, expect, it } from 'vitest';

import { safeGet, safeSet, storageOf } from './storage';

/** What a browser hands over with site data blocked: every access throws. */
const blocked = {
  getItem: () => {
    throw new DOMException('denied', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('denied', 'SecurityError');
  },
} as unknown as Storage;

function memory(): Storage {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  } as Storage;
}

describe('safeGet / safeSet', () => {
  it('reads back what was written', () => {
    const storage = memory();
    expect(safeSet(storage, 'theme', 'dark')).toBe(true);
    expect(safeGet(storage, 'theme')).toBe('dark');
  });

  it('is null for a key never written', () => {
    expect(safeGet(memory(), 'theme')).toBeNull();
  });

  /* Private windows and blocked site data throw on access; the page must keep working. */
  it('swallows a storage that throws', () => {
    expect(safeGet(blocked, 'theme')).toBeNull();
    expect(safeSet(blocked, 'theme', 'dark')).toBe(false);
  });

  it('copes with no storage at all', () => {
    expect(safeGet(undefined, 'theme')).toBeNull();
    expect(safeSet(undefined, 'theme', 'dark')).toBe(false);
  });
});

/* With site data blocked, some browsers throw on merely naming `localStorage`. */
describe('storageOf', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
    else delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
  });

  it('hands over the storage when there is one', () => {
    const storage = memory();
    Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true });
    expect(storageOf('sessionStorage')).toBe(storage);
  });

  it('is undefined when reaching it throws', () => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      get: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      configurable: true,
    });
    expect(storageOf('sessionStorage')).toBeUndefined();
  });
});
