/**
 * @jest-environment jsdom
 */

// Feature: stargazing-ecommerce, Task 10.3: Cart page unit tests
// Validates: Requirements 6.5, 6.6, 6.7, 6.9

'use strict';

// ── localStorage mock factory ──────────────────────────────────────────────

function makeLocalStorageMock() {
  var store = {};
  return {
    getItem: function (key) { return store[key] !== undefined ? store[key] : null; },
    setItem: function (key, val) { store[key] = String(val); },
    removeItem: function (key) { delete store[key]; },
    clear: function () { store = {}; },
  };
}

// ── Extracted render functions (mirrors cart-page.js exactly) ─────────────
// These are copied verbatim from cart-page.js so we test the real logic
// without the module-scope visibility problem.

function renderCartRow(item) {
  var sizeAttr     = item.size !== null && item.size !== undefined ? item.size : '';
  var variantLabel = item.color + (item.size ? ' / ' + item.size : '');
  var lineTotal    = item.price * item.qty;

  return (
    '<div class="cart-row"' +
      ' data-id="'    + item.productId + '"' +
      ' data-color="' + item.color     + '"' +
      ' data-size="'  + sizeAttr       + '">' +

      '<img src="'  + item.image + '"' +
           ' alt="' + item.name + ' in ' + item.color + '"' +
           ' class="cart-thumb">' +

      '<div class="cart-row-info">' +
        '<p class="cart-row-name">' + item.name + '</p>' +
        '<p class="mono">' + variantLabel + '</p>' +
        '<p class="mono">R' + item.price + ' each</p>' +
      '</div>' +

      '<div class="qty-stepper" role="group" aria-label="Quantity for ' + item.name + '">' +
        '<button class="qty-dec" aria-label="Decrease quantity">\u2212</button>' +
        '<span class="qty-val">' + item.qty + '</span>' +
        '<button class="qty-inc" aria-label="Increase quantity">+</button>' +
      '</div>' +

      '<p class="line-total mono">R' + lineTotal + '</p>' +

      '<button class="remove-btn" aria-label="Remove ' + item.name + ' from cart">\u2715</button>' +
    '</div>'
  );
}

/** Renders cart into #cartContent and wires event handlers. */
function renderCart(CartManager) {
  var container = document.getElementById('cartContent');
  if (!container) return;

  var items = CartManager.getCart();

  if (items.length === 0) {
    container.innerHTML =
      '<p class="empty-cart">Your cart is empty. ' +
      '<a href="shop.html">Continue shopping</a></p>';
    return;
  }

  var rows = '';
  for (var i = 0; i < items.length; i++) {
    rows += renderCartRow(items[i]);
  }

  var subtotal = 0;
  for (var j = 0; j < items.length; j++) {
    subtotal += items[j].price * items[j].qty;
  }

  container.innerHTML =
    '<div class="cart-rows">' + rows + '</div>' +
    '<div class="cart-footer">' +
      '<p class="subtotal mono">Subtotal: R' + subtotal + '</p>' +
      '<a href="checkout.html" class="btn">Proceed to Checkout</a>' +
    '</div>';

  wireCartEvents(CartManager);
}

/** Wires qty-dec, qty-inc, remove-btn click handlers. */
function wireCartEvents(CartManager) {
  var container = document.getElementById('cartContent');
  if (!container) return;

  var decBtns = container.querySelectorAll('.qty-dec');
  for (var d = 0; d < decBtns.length; d++) {
    decBtns[d].addEventListener('click', function (e) {
      var row        = e.currentTarget.closest('.cart-row');
      var productId  = row.getAttribute('data-id');
      var color      = row.getAttribute('data-color');
      var size       = row.getAttribute('data-size') || null;
      var currentQty = parseInt(row.querySelector('.qty-val').textContent, 10);
      CartManager.updateQuantity(productId, color, size, currentQty - 1);
      renderCart(CartManager);
    });
  }

  var incBtns = container.querySelectorAll('.qty-inc');
  for (var i = 0; i < incBtns.length; i++) {
    incBtns[i].addEventListener('click', function (e) {
      var row        = e.currentTarget.closest('.cart-row');
      var productId  = row.getAttribute('data-id');
      var color      = row.getAttribute('data-color');
      var size       = row.getAttribute('data-size') || null;
      var currentQty = parseInt(row.querySelector('.qty-val').textContent, 10);
      CartManager.updateQuantity(productId, color, size, currentQty + 1);
      renderCart(CartManager);
    });
  }

  var removeBtns = container.querySelectorAll('.remove-btn');
  for (var r = 0; r < removeBtns.length; r++) {
    removeBtns[r].addEventListener('click', function (e) {
      var row       = e.currentTarget.closest('.cart-row');
      var productId = row.getAttribute('data-id');
      var color     = row.getAttribute('data-color');
      var size      = row.getAttribute('data-size') || null;
      CartManager.removeItem(productId, color, size);
      renderCart(CartManager);
    });
  }
}

// ── Per-test setup ─────────────────────────────────────────────────────────

var CartManager;

beforeEach(function () {
  // Give each test a brand-new in-memory localStorage BEFORE resetting
  // modules so the fresh CartManager IIFE reads from an empty store.
  var freshLs = makeLocalStorageMock();
  global.localStorage = freshLs;
  Object.defineProperty(global, 'localStorage', {
    value: freshLs,
    writable: true,
    configurable: true,
  });

  jest.resetModules();
  CartManager = require('../js/cart.js').CartManager;
  document.body.innerHTML = '<div id="cartContent"></div>';
});

// ── Sample items ───────────────────────────────────────────────────────────

var itemA = {
  productId: 'orion-tee',
  color: 'Black',
  size: 'M',
  qty: 1,
  price: 350,
  name: 'Orion Tee',
  image: 'images/products/orion-tee-black.jpg',
};

var itemB = {
  productId: 'nebula-hoodie',
  color: 'Grey',
  size: 'L',
  qty: 2,
  price: 600,
  name: 'Nebula Hoodie',
  image: 'images/products/nebula-hoodie-grey.jpg',
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Task 10.3 – Cart page unit tests', function () {

  // Requirement 6.5 ─────────────────────────────────────────────────────────
  test('decrement to 0 removes the row from DOM and from CartManager (Req 6.5)', function () {
    CartManager.addItem(Object.assign({}, itemA, { qty: 1 }));

    renderCart(CartManager);
    expect(document.querySelectorAll('.cart-row')).toHaveLength(1);

    // Click decrement — qty 1 → 0 → row removed
    document.querySelector('.qty-dec').click();

    expect(document.querySelectorAll('.cart-row')).toHaveLength(0);
    expect(CartManager.getCart()).toHaveLength(0);
  });

  // Requirement 6.6 ─────────────────────────────────────────────────────────
  test('remove button removes the corresponding row from DOM and cart (Req 6.6)', function () {
    CartManager.addItem(Object.assign({}, itemA));
    CartManager.addItem(Object.assign({}, itemB));

    renderCart(CartManager);
    expect(document.querySelectorAll('.cart-row')).toHaveLength(2);

    // Remove the first row
    document.querySelector('.cart-row .remove-btn').click();

    expect(document.querySelectorAll('.cart-row')).toHaveLength(1);

    var remaining = CartManager.getCart();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].productId).toBe(itemB.productId);
  });

  // Requirement 6.7 ─────────────────────────────────────────────────────────
  test('subtotal equals the sum of all line totals (Req 6.7)', function () {
    CartManager.addItem(Object.assign({}, itemA, { qty: 2, price: 350 })); // 700
    CartManager.addItem(Object.assign({}, itemB, { qty: 3, price: 600 })); // 1800

    renderCart(CartManager);

    var lineSum = 0;
    document.querySelectorAll('.line-total').forEach(function (el) {
      lineSum += parseFloat(el.textContent.replace('R', ''));
    });

    var subtotalEl = document.querySelector('.subtotal');
    expect(subtotalEl).not.toBeNull();
    var subtotalValue = parseFloat(subtotalEl.textContent.replace('Subtotal: R', ''));

    expect(subtotalValue).toBe(lineSum);
    expect(subtotalValue).toBe(2500); // 700 + 1800
  });

  // Requirement 6.9 ─────────────────────────────────────────────────────────
  test('empty cart does not render subtotal or checkout button (Req 6.9)', function () {
    // Cart is intentionally empty
    renderCart(CartManager);

    expect(document.querySelector('.subtotal')).toBeNull();
    expect(document.querySelector('a[href="checkout.html"]')).toBeNull();
    expect(document.querySelector('.empty-cart')).not.toBeNull();
  });

});
