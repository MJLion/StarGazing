// Feature: stargazing-ecommerce, Task 3.4: CartManager localStorage fallback
// Validates: Requirements 7.4

'use strict';

// ── localStorage mock factory ──────────────────────────────────────────────

/** Working in-memory localStorage substitute */
function makeLocalStorageMock() {
  let store = {};
  return {
    getItem(key) { return store[key] !== undefined ? store[key] : null; },
    setItem(key, val) { store[key] = String(val); },
    removeItem(key) { delete store[key]; },
    clear() { store = {}; },
  };
}

/** Mock that throws on every access — simulates blocked storage (private browsing) */
function makeBlockedLocalStorageMock() {
  return {
    getItem()    { throw new DOMException('The operation is insecure.', 'SecurityError'); },
    setItem()    { throw new DOMException('The operation is insecure.', 'SecurityError'); },
    removeItem() { throw new DOMException('The operation is insecure.', 'SecurityError'); },
    clear()      { throw new DOMException('The operation is insecure.', 'SecurityError'); },
  };
}

/** Load a fresh CartManager with the supplied localStorage mock injected */
function loadFreshCartManager(lsMock) {
  global.localStorage = lsMock;
  jest.resetModules();
  const { CartManager } = require('../public/js/cart.js');
  return CartManager;
}

// ── Sample item used across tests ─────────────────────────────────────────

const sampleItem = {
  productId: 'orion-tee',
  color: 'Black',
  size: 'M',
  qty: 1,
  price: 350,
  name: 'Orion Tee',
  image: 'images/products/orion-tee-black.jpg',
};

// ── Unit tests: Requirement 7.4 ───────────────────────────────────────────

describe('Task 3.4 – CartManager localStorage fallback (unit)', () => {

  describe('addItem with blocked localStorage', () => {

    test('addItem does not throw when localStorage.setItem throws', () => {
      const CartManager = loadFreshCartManager(makeBlockedLocalStorageMock());
      expect(() => CartManager.addItem(sampleItem)).not.toThrow();
    });

    test('getCart returns the added item after addItem with blocked localStorage', () => {
      const CartManager = loadFreshCartManager(makeBlockedLocalStorageMock());
      CartManager.addItem(sampleItem);
      const cart = CartManager.getCart();
      const row = cart.find(
        (r) =>
          r.productId === sampleItem.productId &&
          r.color     === sampleItem.color &&
          r.size      === sampleItem.size
      );
      expect(row).toBeDefined();
      expect(row.productId).toBe(sampleItem.productId);
      expect(row.color).toBe(sampleItem.color);
      expect(row.size).toBe(sampleItem.size);
      expect(row.qty).toBeGreaterThanOrEqual(1);
    });

  });

  describe('_testStorage() indirectly — storage flag behaviour on load', () => {

    test('CartManager loaded with blocked storage falls back gracefully: addItem + getCart work', () => {
      // When localStorage is blocked, _testStorage() returns false and
      // _storageAvailable is set to false.  Verify the observable outcome:
      // the cart still works as an in-memory store for the session.
      const CartManager = loadFreshCartManager(makeBlockedLocalStorageMock());
      CartManager.addItem(sampleItem);
      const cart = CartManager.getCart();
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe(sampleItem.productId);
    });

    test('CartManager loaded with blocked storage does NOT persist between instances', () => {
      // With _storageAvailable === false nothing is written to localStorage,
      // so a "reloaded" instance starts with an empty cart — confirming the
      // flag correctly prevented writes.
      const blockedMock = makeBlockedLocalStorageMock();

      const CartManager1 = loadFreshCartManager(blockedMock);
      CartManager1.addItem(sampleItem);

      // Re-load (simulates a new page load) with the same blocked mock
      const CartManager2 = loadFreshCartManager(blockedMock);
      const cart = CartManager2.getCart();
      expect(cart).toHaveLength(0); // nothing was persisted
    });

    test('CartManager loaded with working storage DOES persist between instances', () => {
      // Contrast: with _storageAvailable === true, data survives a re-load.
      const lsMock = makeLocalStorageMock();

      const CartManager1 = loadFreshCartManager(lsMock);
      CartManager1.addItem(sampleItem);

      const CartManager2 = loadFreshCartManager(lsMock);
      const cart = CartManager2.getCart();
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe(sampleItem.productId);
    });

  });

});
