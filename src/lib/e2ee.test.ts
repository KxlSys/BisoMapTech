import { beforeAll, beforeEach, describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Minimal in-memory polyfills so the IndexedDB-backed E2EE service can run
// under Node/Vitest. The service only touches `window.*` and `indexedDB`
// inside function bodies (never at module load), so installing the globals in
// beforeAll is sufficient.
// ---------------------------------------------------------------------------

let memStore = new Map<string, unknown>();
let storeCreated = false;

function makeRequest<T>(resultFn: () => T) {
  const req: {
    onsuccess: (() => void) | null;
    onerror: (() => void) | null;
    result: T | undefined;
    error: unknown;
  } = { onsuccess: null, onerror: null, result: undefined, error: null };
  setTimeout(() => {
    try {
      req.result = resultFn();
      req.onsuccess?.();
    } catch (e) {
      req.error = e;
      req.onerror?.();
    }
  }, 0);
  return req;
}

const fakeDB = {
  objectStoreNames: { contains: () => storeCreated },
  createObjectStore: () => {
    storeCreated = true;
  },
  transaction: () => ({
    objectStore: () => ({
      put: (value: unknown, key: string) =>
        makeRequest(() => {
          memStore.set(key, value);
          return undefined;
        }),
      get: (key: string) => makeRequest(() => memStore.get(key)),
    }),
  }),
};

const indexedDBMock = {
  open: () => {
    const req: {
      onupgradeneeded: (() => void) | null;
      onsuccess: (() => void) | null;
      onerror: (() => void) | null;
      result: typeof fakeDB;
      error: unknown;
    } = { onupgradeneeded: null, onsuccess: null, onerror: null, result: fakeDB, error: null };
    setTimeout(() => {
      try {
        if (!storeCreated) req.onupgradeneeded?.();
        req.onsuccess?.();
      } catch (e) {
        req.error = e;
        req.onerror?.();
      }
    }, 0);
    return req;
  },
};

beforeAll(() => {
  (globalThis as unknown as { window: unknown }).window = {
    crypto: globalThis.crypto,
    btoa: globalThis.btoa,
    atob: globalThis.atob,
  };
  (globalThis as unknown as { indexedDB: unknown }).indexedDB = indexedDBMock;
});

beforeEach(() => {
  // Simulate a fresh device for each test.
  memStore = new Map<string, unknown>();
  storeCreated = false;
});

import {
  generateE2EEKeyPair,
  hasE2EELocalKey,
  getLocalPublicKeyJWK,
  publicKeysMatch,
  exportPortableKey,
  importPortableKey,
} from "./e2ee-service";

describe("E2EE key identity", () => {
  it("derives a local public key that matches the published public key", async () => {
    const { publicKeyJWK } = await generateE2EEKeyPair();
    expect(await hasE2EELocalKey()).toBe(true);

    const localPub = await getLocalPublicKeyJWK();
    expect(localPub).not.toBeNull();
    expect(publicKeysMatch(localPub!, publicKeyJWK)).toBe(true);
  });

  it("reports a mismatch between two distinct identities", async () => {
    const a = await generateE2EEKeyPair();
    // Re-generating overwrites the local key with a brand-new identity.
    const b = await generateE2EEKeyPair();
    expect(publicKeysMatch(a.publicKeyJWK, b.publicKeyJWK)).toBe(false);
  });
});

describe("E2EE portable key transfer (device → device)", () => {
  it("round-trips the SAME identity onto a fresh device", async () => {
    // Device A: create identity and export it.
    const { publicKeyJWK } = await generateE2EEKeyPair();
    const portable = await exportPortableKey("correct horse battery");
    expect(portable.split(":")).toHaveLength(3);

    // Device B: empty store, then import the portable key.
    memStore = new Map<string, unknown>();
    storeCreated = false;
    expect(await hasE2EELocalKey()).toBe(false);

    const ok = await importPortableKey(portable, "correct horse battery");
    expect(ok).toBe(true);

    // Device B now holds the SAME identity as device A.
    const localPubB = await getLocalPublicKeyJWK();
    expect(publicKeysMatch(localPubB!, publicKeyJWK)).toBe(true);
  });

  it("rejects an import with the wrong passphrase", async () => {
    await generateE2EEKeyPair();
    const portable = await exportPortableKey("right-pass");

    memStore = new Map<string, unknown>();
    storeCreated = false;

    expect(await importPortableKey(portable, "wrong-pass")).toBe(false);
    expect(await hasE2EELocalKey()).toBe(false);
  });

  it("rejects a malformed portable string", async () => {
    expect(await importPortableKey("not-a-valid-key", "whatever")).toBe(false);
    expect(await importPortableKey("only:two", "whatever")).toBe(false);
  });
});
