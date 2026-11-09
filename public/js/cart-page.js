/**
 * cart-page.js — StarGazing Cart Page
 *
 * Responsibilities:
 *  1. renderCart()     — reads CartManager.getCart(), renders rows or empty state,
 *                        subtotal, and checkout button; calls wireCartEvents() after render
 *  2. wireCartEvents() — wires qty-dec, qty-inc, and remove-btn buttons to
 *                        CartManager mutations, then re-renders and updates badge
 *
 * Runs in browser context. CartManager and updateCartBadge are already on window
 * via cart.js and main.js respectively.
 * Uses var throughout (no modules, no const/let).
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 13.2
 */

// ─── Render Helpers ───────────────────────────────────────────────────────────

/**
 * renderCartRow — builds the HTML string for a single cart row.
 *
 * @param {CartItem} item
 * @returns {string} HTML string
 */
function renderCartRow(item) {
  var sizeAttr   = item.size !== null && item.size !== undefined ? item.size : '';
  var variantLabel = item.color + (item.size ? ' / ' + item.size : '');
  var lineTotal  = item.price * item.qty;

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
        '<span class="qty-val" aria-live="polite" aria-atomic="true">' + item.qty + '</span>' +
        '<button class="qty-inc" aria-label="Increase quantity">+</button>' +
      '</div>' +

      '<p class="line-total mono">R' + lineTotal + '</p>' +

      '<button class="remove-btn" aria-label="Remove ' + item.name + ' from cart">\u2715</button>' +
    '</div>'
  );
}

// ─── renderCart ───────────────────────────────────────────────────────────────

/**
 * renderCart — main render function for the cart page.
 *
 * Reads CartManager.getCart() and builds the full cart UI into #cartContent.
 * Shows an empty-state message when the cart has no items (subtotal and
 * checkout button are not rendered in that case).
 * After rendering items, calls wireCartEvents() to attach event listeners.
 */
function renderCart() {
  var container = document.getElementById('cartContent');
  if (!container) return;

  var items = CartManager.getCart();

  if (items.length === 0) {
    container.innerHTML =
      '<p class="empty-cart">Your cart is empty. ' +
      '<a href="shop.html">Continue shopping</a></p>';
    return;
  }

  // Build rows
  var rows = '';
  for (var i = 0; i < items.length; i++) {
    rows += renderCartRow(items[i]);
  }

  // Calculate subtotal
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

  wireCartEvents();
}

// ─── wireCartEvents ───────────────────────────────────────────────────────────

/**
 * wireCartEvents — attaches click handlers to all interactive controls
 * within the rendered cart rows.
 *
 * Must be called after renderCart() has populated #cartContent.
 * Each handler reads the row's data-id / data-color / data-size attributes
 * to identify the cart item, calls the appropriate CartManager method,
 * then re-renders the cart and updates the nav badge.
 */
function wireCartEvents() {
  var container = document.getElementById('cartContent');
  if (!container) return;

  // ── Decrement qty buttons ────────────────────────────────────────────────
  var decBtns = container.querySelectorAll('.qty-dec');
  for (var d = 0; d < decBtns.length; d++) {
    decBtns[d].addEventListener('click', function (e) {
      var row       = e.currentTarget.closest('.cart-row');
      var productId = row.getAttribute('data-id');
      var color     = row.getAttribute('data-color');
      var size      = row.getAttribute('data-size') || null;
      var currentQty = parseInt(row.querySelector('.qty-val').textContent, 10);

      // updateQuantity with qty <= 0 internally calls removeItem
      CartManager.updateQuantity(productId, color, size, currentQty - 1);
      renderCart();
      updateCartBadge();
    });
  }

  // ── Increment qty buttons ────────────────────────────────────────────────
  var incBtns = container.querySelectorAll('.qty-inc');
  for (var i = 0; i < incBtns.length; i++) {
    incBtns[i].addEventListener('click', function (e) {
      var row       = e.currentTarget.closest('.cart-row');
      var productId = row.getAttribute('data-id');
      var color     = row.getAttribute('data-color');
      var size      = row.getAttribute('data-size') || null;
      var currentQty = parseInt(row.querySelector('.qty-val').textContent, 10);

      CartManager.updateQuantity(productId, color, size, currentQty + 1);
      renderCart();
      updateCartBadge();
    });
  }

  // ── Remove buttons ───────────────────────────────────────────────────────
  var removeBtns = container.querySelectorAll('.remove-btn');
  for (var r = 0; r < removeBtns.length; r++) {
    removeBtns[r].addEventListener('click', function (e) {
      var row       = e.currentTarget.closest('.cart-row');
      var productId = row.getAttribute('data-id');
      var color     = row.getAttribute('data-color');
      var size      = row.getAttribute('data-size') || null;

      CartManager.removeItem(productId, color, size);
      renderCart();
      updateCartBadge();
    });
  }
}

// ─── Initialisation ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  renderCart();
});
