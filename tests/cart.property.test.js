// Feature: stargazing-ecommerce, Property 5: Cart Round-Trip Persistence
// Validates: Requirements 7.1, 7.2, 7.3, 7.5

'use strict';
const fc = require('fast-check');

// ── localStorage mock factory ──────────────────────────────────────────────
// Returns a working in-memory localStorage-like object
function makeLocalStorageMock() {
  let store = {};
  return {
    getItem(key) { return store[key] !== undefined ? store[key] : null; },
    setItem(key, val) { store[key] = String(val); },
    removeItem(key) { delete store[key]; },
    clear() { store = {}; },
  };
}

// Returns a mock that always throws on access (simulates blocked storage)
function makeBlockedLocalStorageMock() {
  return {
    getItem() { throw new Error('Storage blocked'); },
    setItem() { throw new Error('Storage blocked'); },
    removeItem() { throw new Error('Storage blocked'); },
    clear() { throw new Error('Storage blocked'); },
  };
}

// Helper: load a fresh CartManager, injecting the given localStorage mock
function loadFreshCartManager(lsMock) {
  global.localStorage = lsMock;
  jest.resetModules();
  const { CartManager } = require('../js/cart.js');
  return CartManager;
}

// ── Arbitrary for CartItem ─────────────────────────────────────────────────
const cartItemArb = fc.record({
  productId: fc.stringMatching(/^[a-z][a-z0-9-]{2,19}$/),
  color: fc.constantFrom('Black', 'White', 'Navy', 'Red', 'Green'),
  size: fc.oneof(fc.constantFrom('XS', 'S', 'M', 'L', 'XL'), fc.constant(null)),
  qty: fc.integer({ min: 1, max: 10 }),
  price: fc.integer({ min: 100, max: 1000 }),
  name: fc.string({ minLength: 3, maxLength: 40 }),
  image: fc.string({ minLength: 5, maxLength: 60 }),
});

// ── Test suite ─────────────────────────────────────────────────────────────
describe('Property 5: Cart Round-Trip Persistence', () => {

  describe('Storage path (localStorage available)', () => {
    test('addItem then getCart returns matching row with qty >= 1', () => {
      fc.assert(
        fc.property(cartItemArb, (item) => {
          const CartManager = loadFreshCartManager(makeLocalStorageMock());
          CartManager.addItem(item);
          const cart = CartManager.getCart();
          const row = cart.find(
            (r) => r.productId === item.productId && r.color === item.color && r.size === item.size
          );
          return (
            row !== undefined &&
            row.productId === item.productId &&
            row.color === item.color &&
            row.size === item.size &&
            row.price === item.price &&
            row.qty >= 1
          );
        }),
        { numRuns: 100 }
      );
    });

    test('removeItem then getCart returns no matching row', () => {
      fc.assert(
        fc.property(cartItemArb, (item) => {
          const CartManager = loadFreshCartManager(makeLocalStorageMock());
          CartManager.addItem(item);
          CartManager.removeItem(item.productId, item.color, item.size);
          const cart = CartManager.getCart();
          return !cart.some(
            (r) => r.productId === item.productId && r.color === item.color && r.size === item.size
          );
        }),
        { numRuns: 100 }
      );
    });

    test('updateQuantity(n) then getCart returns qty === n', () => {
      fc.assert(
        fc.property(cartItemArb, fc.integer({ min: 1, max: 50 }), (item, newQty) => {
          const CartManager = loadFreshCartManager(makeLocalStorageMock());
          CartManager.addItem(item);
          CartManager.updateQuantity(item.productId, item.color, item.size, newQty);
          const cart = CartManager.getCart();
          const row = cart.find(
            (r) => r.productId === item.productId && r.color === item.color && r.size === item.size
          );
          return row !== undefined && row.qty === newQty;
        }),
        { numRuns: 100 }
      );
    });

    test('addItem persists to localStorage (data survives re-load)', () => {
      fc.assert(
        fc.property(cartItemArb, (item) => {
          const lsMock = makeLocalStorageMock();
          const CartManager1 = loadFreshCartManager(lsMock);
          CartManager1.addItem(item);

          // Simulate page reload: create a new CartManager with the same storage
          const CartManager2 = loadFreshCartManager(lsMock);
          const cart = CartManager2.getCart();
          const row = cart.find(
            (r) => r.productId === item.productId && r.color === item.color && r.size === item.size
          );
          return row !== undefined && row.qty >= 1;
        }),
        { numRuns: 50 }
      );
    });

    test('duplicate addItem increments qty rather than adding a new row', () => {
      fc.assert(
        fc.property(cartItemArb, (item) => {
          const CartManager = loadFreshCartManager(makeLocalStorageMock());
          CartManager.addItem({ ...item, qty: 1 });
          CartManager.addItem({ ...item, qty: 1 });
          const cart = CartManager.getCart();
          const matches = cart.filter(
            (r) => r.productId === item.productId && r.color === item.color && r.size === item.size
          );
          // Should be exactly 1 row with qty 2
          return matches.length === 1 && matches[0].qty === 2;
        }),
        { numRuns: 100 }
      );
    });

    test('updateQuantity <= 0 removes the row', () => {
      fc.assert(
        fc.property(cartItemArb, (item) => {
          const CartManager = loadFreshCartManager(makeLocalStorageMock());
          CartManager.addItem(item);
          CartManager.updateQuantity(item.productId, item.color, item.size, 0);
          const cart = CartManager.getCart();
          return !cart.some(
            (r) => r.productId === item.productId && r.color === item.color && r.size === item.size
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Fallback path (localStorage unavailable)', () => {
    test('addItem then getCart still returns matching row when storage is blocked', () => {
      fc.assert(
        fc.property(cartItemArb, (item) => {
          const CartManager = loadFreshCartManager(makeBlockedLocalStorageMock());
          CartManager.addItem(item);
          const cart = CartManager.getCart();
          const row = cart.find(
            (r) => r.productId === item.productId && r.color === item.color && r.size === item.size
          );
          return (
            row !== undefined &&
            row.productId === item.productId &&
            row.color === item.color &&
            row.size === item.size &&
            row.qty >= 1
          );
        }),
        { numRuns: 100 }
      );
    });

    test('removeItem works correctly when storage is blocked', () => {
      fc.assert(
        fc.property(cartItemArb, (item) => {
          const CartManager = loadFreshCartManager(makeBlockedLocalStorageMock());
          CartManager.addItem(item);
          CartManager.removeItem(item.productId, item.color, item.size);
          const cart = CartManager.getCart();
          return !cart.some(
            (r) => r.productId === item.productId && r.color === item.color && r.size === item.size
          );
        }),
        { numRuns: 100 }
      );
    });

    test('addItem does not throw when storage is blocked', () => {
      fc.assert(
        fc.property(cartItemArb, (item) => {
          const CartManager = loadFreshCartManager(makeBlockedLocalStorageMock());
          expect(() => CartManager.addItem(item)).not.toThrow();
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
});
