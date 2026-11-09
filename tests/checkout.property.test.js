// Feature: stargazing-ecommerce, Property 6: Order Number Format
// Validates: Requirement 8.7

'use strict';
var fc = require('fast-check');

// Stub out browser globals that checkout.js references at module load time
global.document = {
  addEventListener: function () {},
  getElementById: function () { return null; }
};
global.window = { location: { href: '' } };
global.sessionStorage = {
  setItem: function () {},
  getItem: function () { return null; },
  removeItem: function () {}
};
global.CartManager = {
  getCart: function () { return []; },
  clearCart: function () {}
};

var checkout = require('../js/checkout.js');

describe('Property 6: Order Number Format', function () {
  test('generateOrderNumber() always returns a string matching /^ORD-[A-Z0-9]{8}$/', function () {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999 }), function (_seed) {
        var result = checkout.generateOrderNumber();
        return /^ORD-[A-Z0-9]{8}$/.test(result);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: stargazing-ecommerce, Property 7: Email Validation Coverage
// Validates: Requirement 8.8
describe('Property 7: Email Validation Coverage', function () {

  test('valid email addresses (fc.emailAddress()) always return true', function () {
    fc.assert(
      fc.property(fc.emailAddress(), function (email) {
        return checkout.validateEmail(email) === true;
      }),
      { numRuns: 200 }
    );
  });

  test('strings without "@" always return false', function () {
    // Generate strings that are guaranteed to contain no "@" character
    var noAtArb = fc.string({ minLength: 1, maxLength: 50 }).filter(function (s) {
      return !s.includes('@');
    });
    fc.assert(
      fc.property(noAtArb, function (s) {
        return checkout.validateEmail(s) === false;
      }),
      { numRuns: 200 }
    );
  });

  test('strings with "@" but no "." after "@" always return false', function () {
    // Build strings like "local@domain" with no dot in the domain part
    var atNoDotArb = fc.tuple(
      fc.stringMatching(/^[^\s@]{1,20}$/),   // local part: no whitespace or @
      fc.stringMatching(/^[^\s@.]{1,20}$/)   // domain part: no whitespace, @, or dot
    ).map(function (parts) {
      return parts[0] + '@' + parts[1];
    });
    fc.assert(
      fc.property(atNoDotArb, function (s) {
        return checkout.validateEmail(s) === false;
      }),
      { numRuns: 200 }
    );
  });
});

// Feature: stargazing-ecommerce, Property 8: Phone Validation Coverage
// Validates: Requirement 8.9
describe('Property 8: Phone Validation Coverage', function () {

  test('strings of only digits/spaces/"+" with >=7 digit chars always return true', function () {
    // Build a string from the allowed charset with at least 7 digit characters
    var validPhoneArb = fc.array(
      fc.oneof(
        fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
        fc.constant(' '),
        fc.constant('+')
      ),
      { minLength: 7, maxLength: 30 }
    ).filter(function (chars) {
      // Ensure at least 7 digits are present
      return chars.filter(function (c) { return /\d/.test(c); }).length >= 7;
    }).map(function (chars) {
      return chars.join('');
    });

    fc.assert(
      fc.property(validPhoneArb, function (phone) {
        return checkout.validatePhone(phone) === true;
      }),
      { numRuns: 200 }
    );
  });

  test('strings containing at least one letter always return false', function () {
    // Build strings that contain at least one ASCII letter alongside other chars
    var withLetterArb = fc.tuple(
      fc.string({ minLength: 0, maxLength: 15 }),
      fc.constantFrom('a','b','c','d','e','f','g','h','i','j','k','l','m',
                      'n','o','p','q','r','s','t','u','v','w','x','y','z',
                      'A','B','C','D','E','F','G','H','I','J','K','L','M',
                      'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'),
      fc.string({ minLength: 0, maxLength: 15 })
    ).map(function (parts) {
      return parts[0] + parts[1] + parts[2];
    });
    fc.assert(
      fc.property(withLetterArb, function (s) {
        return checkout.validatePhone(s) === false;
      }),
      { numRuns: 200 }
    );
  });

  test('strings of only digits/spaces/"+" with <7 digit chars always return false', function () {
    // Build strings from the allowed charset with 0–6 digit characters
    var fewDigitsArb = fc.array(
      fc.oneof(
        fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
        fc.constant(' '),
        fc.constant('+')
      ),
      { minLength: 0, maxLength: 20 }
    ).filter(function (chars) {
      return chars.filter(function (c) { return /\d/.test(c); }).length < 7;
    }).map(function (chars) {
      return chars.join('');
    });

    fc.assert(
      fc.property(fewDigitsArb, function (phone) {
        return checkout.validatePhone(phone) === false;
      }),
      { numRuns: 200 }
    );
  });
});
