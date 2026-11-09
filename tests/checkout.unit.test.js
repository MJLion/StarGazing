// Feature: stargazing-ecommerce, Task 11.6: Checkout Unit Tests
// Validates: Requirements 8.2, 8.6, 8.7

'use strict';

// ── Runs in Node environment (same as checkout.property.test.js).
// ── We stub document/window/sessionStorage/CartManager so checkout.js
// ── can be required without a real browser runtime.

// ─────────────────────────────────────────────────────────────────────────────
// Minimal in-memory DOM factory
//
// checkout.js uses only:
//   document.addEventListener('DOMContentLoaded', fn)  — store & call manually
//   document.getElementById(id)                         — return element stubs
//   element.value / element.textContent / element.innerHTML  — read/write
//   form.addEventListener('submit', fn)                 — store & call manually
// ─────────────────────────────────────────────────────────────────────────────

var FORM_FIELDS = [
  'fullName', 'streetAddress', 'city', 'province', 'postalCode', 'email', 'phone'
];

/**
 * makeElement() — a minimal element stub with the properties checkout.js reads.
 */
function makeElement() {
  return {
    value:       '',
    textContent: '',
    innerHTML:   '',
    _listeners:  {},
    addEventListener: function (evt, fn) {
      this._listeners[evt] = fn;
    },
    dispatchEvent: function (evtName) {
      if (this._listeners[evtName]) {
        this._listeners[evtName]({ preventDefault: function () {} });
      }
    },
  };
}

/**
 * makeDOM(cartItems) — builds a fresh in-memory DOM and returns:
 *   { doc, win, ss, cartManager, fireDCL, submitForm }
 *
 * fireDCL()  — calls the DOMContentLoaded listener registered by checkout.js
 * submitForm() — calls the submit listener on the form element
 */
function makeDOM(cartItems) {
  var dcl = null;      // DOMContentLoaded handler registered by checkout.js
  var elements = {};   // id → element stub

  // Create input stubs for each field + its error span
  FORM_FIELDS.forEach(function (id) {
    elements[id]          = makeElement(); // input
    elements[id + 'Error'] = makeElement(); // error span
  });

  // Summary elements
  elements['summaryItems']    = makeElement();
  elements['summarySubtotal'] = makeElement();

  // The form element itself
  var formEl = makeElement();
  elements['checkoutForm'] = formEl;

  var doc = {
    addEventListener: function (evt, fn) {
      if (evt === 'DOMContentLoaded') { dcl = fn; }
    },
    getElementById: function (id) {
      return elements[id] || null;
    },
  };

  var win = {
    location: { href: 'http://localhost/' },
  };

  // In-memory sessionStorage
  var _ss = {};
  var ss = {
    getItem:    function (k)    { return _ss[k] !== undefined ? _ss[k] : null; },
    setItem:    function (k, v) { _ss[k] = String(v); },
    removeItem: function (k)    { delete _ss[k]; },
    clear:      function ()     { _ss = {}; },
  };

  var cartManager = {
    getCart:   function () { return cartItems.slice(); },
    clearCart: jest.fn(),
  };

  return {
    doc:  doc,
    win:  win,
    ss:   ss,
    cartManager: cartManager,
    elements: elements,

    /** Call the DOMContentLoaded handler that checkout.js registered. */
    fireDCL: function () {
      if (dcl) { dcl(); }
    },

    /** Call the submit handler that checkout.js registered on the form. */
    submitForm: function () {
      formEl.dispatchEvent('submit');
    },
  };
}

// ── Populated cart used in form tests ─────────────────────────────────────

var SAMPLE_CART = [
  {
    productId: 'orion-tee',
    name:      'Orion Tee',
    color:     'Black',
    size:      'M',
    qty:       1,
    price:     350,
    image:     'images/products/orion-tee-black.jpg',
  },
];

/**
 * loadCheckout(env) — installs env globals, requires a fresh checkout.js,
 * then fires DOMContentLoaded.
 */
function loadCheckout(env) {
  global.document     = env.doc;
  global.window       = env.win;
  global.sessionStorage = env.ss;
  global.CartManager  = env.cartManager;

  jest.resetModules();
  require('../public/js/checkout.js');

  env.fireDCL();
}

/** Fill all form fields in env with valid values. */
function fillValidForm(env) {
  env.elements['fullName'].value      = 'Jane Smith';
  env.elements['streetAddress'].value = '1 Cosmic Drive';
  env.elements['city'].value          = 'Cape Town';
  env.elements['province'].value      = 'Western Cape';
  env.elements['postalCode'].value    = '8001';
  env.elements['email'].value         = 'jane@example.com';
  env.elements['phone'].value         = '0821234567';
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 – Req 8.2: Redirect to cart.html when cart is empty on load
// ─────────────────────────────────────────────────────────────────────────────

describe('Task 11.6 – Req 8.2: empty-cart redirect', function () {

  test('redirects to cart.html when CartManager.getCart() returns an empty array', function () {
    var env = makeDOM([]);
    loadCheckout(env);

    expect(env.win.location.href).toMatch(/cart\.html$/);
  });

  test('does NOT redirect when cart has items', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);

    expect(env.win.location.href).not.toMatch(/cart\.html$/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 – Req 8.6: Inline error shown for empty required field; no navigation
// ─────────────────────────────────────────────────────────────────────────────

describe('Task 11.6 – Req 8.6: inline validation errors on submit', function () {

  test('submitting with all fields empty shows an error on fullName field', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);

    env.submitForm();

    expect(env.elements['fullNameError'].textContent.trim().length).toBeGreaterThan(0);
  });

  test('submitting with only fullName empty shows error on fullName and does not navigate', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    fillValidForm(env);
    env.elements['fullName'].value = '';

    env.submitForm();

    expect(env.elements['fullNameError'].textContent.trim().length).toBeGreaterThan(0);
    expect(env.win.location.href).not.toMatch(/checkout-success\.html/);
  });

  test('submitting with only email empty shows an error on email field and does not navigate', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    fillValidForm(env);
    env.elements['email'].value = '';

    env.submitForm();

    expect(env.elements['emailError'].textContent.trim().length).toBeGreaterThan(0);
    expect(env.win.location.href).not.toMatch(/checkout-success\.html/);
  });

  test('submitting with an invalid email shows an error on email field and does not navigate', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    fillValidForm(env);
    env.elements['email'].value = 'not-an-email';

    env.submitForm();

    expect(env.elements['emailError'].textContent.trim().length).toBeGreaterThan(0);
    expect(env.win.location.href).not.toMatch(/checkout-success\.html/);
  });

  test('submitting with only phone empty shows an error on phone field and does not navigate', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    fillValidForm(env);
    env.elements['phone'].value = '';

    env.submitForm();

    expect(env.elements['phoneError'].textContent.trim().length).toBeGreaterThan(0);
    expect(env.win.location.href).not.toMatch(/checkout-success\.html/);
  });

  test('submitting with a phone with fewer than 7 digits shows an error and does not navigate', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    fillValidForm(env);
    env.elements['phone'].value = '12345'; // only 5 digits

    env.submitForm();

    expect(env.elements['phoneError'].textContent.trim().length).toBeGreaterThan(0);
    expect(env.win.location.href).not.toMatch(/checkout-success\.html/);
  });

  test('error span is cleared when field is corrected and form re-submitted successfully', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);

    // First submit with empty fullName
    fillValidForm(env);
    env.elements['fullName'].value = '';
    env.submitForm();
    expect(env.elements['fullNameError'].textContent.trim().length).toBeGreaterThan(0);

    // Fix the field and re-submit
    env.elements['fullName'].value = 'Jane Smith';
    env.submitForm();
    expect(env.elements['fullNameError'].textContent).toBe('');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 – Req 8.7: Order number stored in sessionStorage and matches pattern
// ─────────────────────────────────────────────────────────────────────────────

describe('Task 11.6 – Req 8.7: order number stored in sessionStorage on success', function () {

  test('sessionStorage contains sg_order_number after valid form submit', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    fillValidForm(env);
    env.submitForm();

    expect(env.ss.getItem('sg_order_number')).not.toBeNull();
  });

  test('stored order number matches /^ORD-[A-Z0-9]{8}$/', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    fillValidForm(env);
    env.submitForm();

    var stored = env.ss.getItem('sg_order_number');
    expect(stored).toMatch(/^ORD-[A-Z0-9]{8}$/);
  });

  test('navigation proceeds to checkout-success.html on valid submit', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    fillValidForm(env);
    env.submitForm();

    expect(env.win.location.href).toMatch(/checkout-success\.html$/);
  });

  test('clearCart is called exactly once on valid submit', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    fillValidForm(env);
    env.submitForm();

    expect(env.cartManager.clearCart).toHaveBeenCalledTimes(1);
  });

  test('sessionStorage does NOT receive order number when form is invalid', function () {
    var env = makeDOM(SAMPLE_CART);
    loadCheckout(env);
    // Leave all fields empty — form is invalid
    env.submitForm();

    expect(env.ss.getItem('sg_order_number')).toBeNull();
  });

});
