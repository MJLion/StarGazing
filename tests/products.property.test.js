// Feature: stargazing-ecommerce, Property 1: Product Object Shape
// Validates: Requirements 1.2, 1.3, 1.5, 1.6

'use strict';

const fc = require('fast-check');
const { PRODUCTS } = require('../js/products.js');

const VALID_COLLECTIONS = ['astronomy', 'kids', 'wish'];
const REQUIRED_STRING_FIELDS = ['id', 'name', 'collection', 'description', 'material'];

describe('Property 1: Product Object Shape', () => {
  test('every product has all required fields with correct types', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PRODUCTS), (product) => {
        // Required string fields
        for (const field of REQUIRED_STRING_FIELDS) {
          if (typeof product[field] !== 'string' || product[field].length === 0) {
            return false;
          }
        }

        // price must be a number
        if (typeof product.price !== 'number') {
          return false;
        }

        // sizes must always be an array (may be empty for one-size products)
        if (!Array.isArray(product.sizes)) {
          return false;
        }

        // variants must be a non-empty array
        if (!Array.isArray(product.variants) || product.variants.length === 0) {
          return false;
        }

        // collection must be one of the three valid values
        if (!VALID_COLLECTIONS.includes(product.collection)) {
          return false;
        }

        // each variant must have color (string) and image (string)
        for (const variant of product.variants) {
          if (typeof variant.color !== 'string' || variant.color.length === 0) {
            return false;
          }
          if (typeof variant.image !== 'string' || variant.image.length === 0) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: PRODUCTS.length }
    );
  });

  test('sizes is always an array (including empty array for one-size products)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PRODUCTS), (product) => {
        return Array.isArray(product.sizes);
      })
    );
  });

  test('collection is always one of "astronomy", "kids", or "wish"', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PRODUCTS), (product) => {
        return VALID_COLLECTIONS.includes(product.collection);
      })
    );
  });

  test('every variant has a color string and an image string', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PRODUCTS), (product) => {
        return product.variants.every(
          (v) =>
            typeof v.color === 'string' &&
            v.color.length > 0 &&
            typeof v.image === 'string' &&
            v.image.length > 0
        );
      })
    );
  });
});
