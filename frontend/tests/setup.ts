import '@testing-library/jest-dom/vitest';

// Polyfill localStorage when running under environments where jsdom hasn't
// provided it (e.g., Node 22 native localStorage requires --localstorage-file).
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: polyfill,
    writable: true,
    configurable: true,
  });
}
