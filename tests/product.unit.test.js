// Feature: stargazing-ecommerce, Task 9.4: Product page unit tests

'use strict';

// ── Document mock factory ─────────────────────────────────────────────────────

/**
 * Build a minimal document mock sufficient for product.js.
 * Tracks registered DOMContentLoaded listeners so tests can fire them manually.
 */
function makeDocumentMock() {
  var elements = {};
  var domListeners = {};

  function makeElement(id) {
    var el = {
      id:          id,
      textContent: '',
      innerHTML:   '',
      hidden:      true,
      disabled:    false,
      style:       {},
      className:   '',
      src:         '',
      alt:         '',
      title:       '',
      _listeners:  {},
      addEventListener: function(evt, fn) {
        if (!this._listeners[evt]) this._listeners[evt] = [];
        this._listeners[evt].push(fn);
      },
      dispatchClick: function() {
        var fns = this._listeners['click'] || [];
        fns.forEach(function(fn) { fn(); });
      },
      querySelectorAll: function() { return []; },
      appendChild:      function() {},
      scrollIntoView:   function() {},
      classList: {
        _classes: [],
        add:    function(c) { if (this._classes.indexOf(c) === -1) this._classes.push(c); },
        remove: function(c) { this._classes = this._classes.filter(function(x) { return x !== c; }); },
        toggle: function(c, force) {
          if (force === undefined) force = this._classes.indexOf(c) === -1;
          if (force) this.add(c); else this.remove(c);
        },
        contains: function(c) { return this._classes.indexOf(c) !== -1; }
      },
      setAttribute: function(name, val) { this['_attr_' + name] = val; },
      getAttribute: function(name) {
        return this['_attr_' + name] !== undefined ? this['_attr_' + name] : null;
      },
    };
    return el;
  }

  return {
    _elements: elements,
    title: '',
    getElementById: function(id) {
      if (!elements[id]) elements[id] = makeElement(id);
      return elements[id];
    },
    createElement: function() {
      return makeElement('__el__' + Math.random());
    },
    querySelectorAll: function() { return []; },
    addEventListener: function(evt, fn) {
      if (!domListeners[evt]) domListeners[evt] = [];
      domListeners[evt].push(fn);
    },
    _triggerEvent: function(evt) {
      (domListeners[evt] || []).forEach(function(fn) { fn(); });
    },
  };
}

// ── Shared setup ──────────────────────────────────────────────────────────────

beforeEach(function() {
  jest.resetModules();

  // node testEnvironment has no `window` — point it at global
  global.window = global;

  // Fresh document mock
  global.document = makeDocumentMock();

  // Default location (tests override as needed)
  global.location = { href: '', search: '' };

  // Real PRODUCTS catalog
  global.PRODUCTS = require('../public/js/products.js').PRODUCTS;

  // Mock CartManager
  global.CartManager = {
    addItem:       jest.fn(),
    getCart:       jest.fn().mockReturnValue([]),
    getTotalItems: jest.fn().mockReturnValue(0),
  };

  // Mock updateCartBadge
  global.updateCartBadge = jest.fn();
});

afterEach(function() {
  jest.useRealTimers();
});

// ── Helper: load product module with a valid product pre-selected ─────────────
//
// product.js uses module-level `var product` that is set inside the
// DOMContentLoaded handler.  wireAddToCart() closes over that var.
// The only reliable way to prime it is to fire DOMContentLoaded with a
// valid ?id= so the module sets product itself.

function loadModuleWithProduct(productId) {
  global.location = { href: '', search: '?id=' + productId };

  var mod = require('../public/js/product.js');

  // Fire DOMContentLoaded so the module sets its own `product` var
  // and wires renderProduct / wireQtyStepper / wireAddToCart.
  // We only care that `product` is now set; the DOM mock silently absorbs
  // all renderProduct DOM writes.
  global.document._triggerEvent('DOMContentLoaded');

  return mod;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Task 9.4 – Product page unit tests', function() {

  // ── Test 1: Redirect to 404 on nonexistent id ──────────────────────────────

  describe('DOMContentLoaded — redirect on nonexistent id', function() {

    test('sets location.href to "404.html" when id is not in PRODUCTS', function() {
      global.location = { href: '', search: '?id=nonexistent' };

      require('../public/js/product.js');
      global.document._triggerEvent('DOMContentLoaded');

      expect(global.location.href).toBe('404.html');
    });

    test('sets location.href to "404.html" when ?id= param is missing', function() {
      global.location = { href: '', search: '' };

      require('../public/js/product.js');
      global.document._triggerEvent('DOMContentLoaded');

      expect(global.location.href).toBe('404.html');
    });

  });

  // ── Test 2: Size error shown, addItem NOT called ───────────────────────────

  describe('wireAddToCart — size validation', function() {

    test('shows #sizeError and does NOT call CartManager.addItem when no size selected', function() {
      // Load with a product that requires a size (saturn-wish-tee has sizes: ["XS","S","M","L","XL"])
      // DOMContentLoaded will call wireAddToCart internally, but we want to test
      // the add-to-cart click in isolation with selectedSize = null.
      // After DOMContentLoaded runs, selectedSize is null (nothing clicked yet).

      loadModuleWithProduct('saturn-wish-tee');

      var sizeError = global.document.getElementById('sizeError');
      var addBtn    = global.document.getElementById('addToCartBtn');

      // Confirm starting state
      sizeError.hidden = true;

      // Simulate clicking Add to Cart with no size chosen
      addBtn.dispatchClick();

      expect(sizeError.hidden).toBe(false);
      expect(global.CartManager.addItem).not.toHaveBeenCalled();
    });

  });

  // ── Test 3: Confirmation state after successful add ────────────────────────

  describe('wireAddToCart — confirmation state', function() {

    test('button shows "Added ✓" / disabled immediately, reverts after 1500ms', function() {
      jest.useFakeTimers();

      // telescope-patch-cap has sizes: [] — no size required, click goes straight through
      loadModuleWithProduct('telescope-patch-cap');

      var btn = global.document.getElementById('addToCartBtn');

      // Simulate click
      btn.dispatchClick();

      // Immediately: confirmation state
      expect(btn.textContent).toBe('Added \u2713');
      expect(btn.disabled).toBe(true);

      // After 1500ms: reverted state
      jest.advanceTimersByTime(1500);

      expect(btn.textContent).toBe('Add to Cart');
      expect(btn.disabled).toBe(false);
    });

    test('CartManager.addItem is called with correct item on successful add', function() {
      jest.useFakeTimers();

      loadModuleWithProduct('telescope-patch-cap');

      global.document.getElementById('addToCartBtn').dispatchClick();

      expect(global.CartManager.addItem).toHaveBeenCalledTimes(1);

      var arg = global.CartManager.addItem.mock.calls[0][0];
      expect(arg.productId).toBe('telescope-patch-cap');
      expect(arg.qty).toBeGreaterThanOrEqual(1);
    });

  });

});
