// Feature: stargazing-ecommerce, Property 3: Filter Correctness
// Validates: Requirements 4.3, 4.5

'use strict';

const fc = require('fast-check');
const { PRODUCTS } = require('../js/products.js');

// ── DOM stubs installed BEFORE requiring shop.js ───────────────────────────
// shop.js runs document.addEventListener('DOMContentLoaded', …) at the
// module top-level, so globals must exist before the first require().

global.document = {
  addEventListener() {},           // silently absorb DOMContentLoaded registration
  getElementById()  { return null; },
  querySelectorAll() { return []; },
};

global.window = {
  location: { search: '' },
};

// Set PRODUCTS global so shop.js can reference it when loaded in Node
global.PRODUCTS = PRODUCTS;

const { getFilteredSortedProducts } = require('../js/shop.js');

const VALID_COLLECTIONS = ['astronomy', 'kids', 'wish'];

describe('Property 3: Filter Correctness', () => {

  test('filtering by a specific collection returns ONLY products with that collection', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('astronomy', 'kids', 'wish'),
        (collection) => {
          const result = getFilteredSortedProducts(collection, 'default');

          // Every returned product must belong to the requested collection
          return result.every((p) => p.collection === collection);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('filtering by a specific collection returns ALL products with that collection', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('astronomy', 'kids', 'wish'),
        (collection) => {
          const result = getFilteredSortedProducts(collection, 'default');
          const expected = PRODUCTS.filter((p) => p.collection === collection);

          // Result must contain every product that belongs to the collection
          return (
            result.length === expected.length &&
            expected.every((p) => result.some((r) => r.id === p.id))
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  test('filtering by "all" returns all products', () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(PRODUCTS),
        (_ignored) => {
          // getFilteredSortedProducts always operates on the global PRODUCTS —
          // we use shuffledSubarray only to satisfy the fc.property signature
          // and confirm the result is stable across runs
          const result = getFilteredSortedProducts('all', 'default');

          return (
            result.length === PRODUCTS.length &&
            PRODUCTS.every((p) => result.some((r) => r.id === p.id))
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  test('no product from a different collection appears in filtered results', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('astronomy', 'kids', 'wish'),
        (collection) => {
          const result = getFilteredSortedProducts(collection, 'default');
          const otherCollections = VALID_COLLECTIONS.filter((c) => c !== collection);

          // None of the returned products should belong to a different collection
          return !result.some((p) => otherCollections.includes(p.collection));
        }
      ),
      { numRuns: 50 }
    );
  });

  test('filter result count equals the number of matching products in PRODUCTS', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('astronomy', 'kids', 'wish'),
        (collection) => {
          const result = getFilteredSortedProducts(collection, 'default');
          const expectedCount = PRODUCTS.filter((p) => p.collection === collection).length;

          return result.length === expectedCount;
        }
      ),
      { numRuns: 50 }
    );
  });

});

// Feature: stargazing-ecommerce, Property 4: Sort Order Invariant
// Validates: Requirements 4.6, 4.7

describe('Property 4: Sort Order Invariant', () => {

  test('price-asc returns a non-decreasing price sequence for any subset of products', () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(PRODUCTS),
        (subset) => {
          // Override global PRODUCTS with the generated subset so
          // getFilteredSortedProducts operates on it
          global.PRODUCTS = subset;

          const result = getFilteredSortedProducts('all', 'price-asc');

          // Restore original PRODUCTS after the call
          global.PRODUCTS = PRODUCTS;

          // Every adjacent pair must satisfy non-decreasing price order
          for (let i = 0; i < result.length - 1; i++) {
            if (result[i].price > result[i + 1].price) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('price-desc returns a non-increasing price sequence for any subset of products', () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(PRODUCTS),
        (subset) => {
          // Override global PRODUCTS with the generated subset so
          // getFilteredSortedProducts operates on it
          global.PRODUCTS = subset;

          const result = getFilteredSortedProducts('all', 'price-desc');

          // Restore original PRODUCTS after the call
          global.PRODUCTS = PRODUCTS;

          // Every adjacent pair must satisfy non-increasing price order
          for (let i = 0; i < result.length - 1; i++) {
            if (result[i].price < result[i + 1].price) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

});
