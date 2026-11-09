/**
 * checkout.js — StarGazing Checkout Page
 *
 * Responsibilities:
 *  1. Redirect to cart.html if cart is empty
 *  2. Render order summary (#summaryItems, #summarySubtotal)
 *  3. Validate all shipping fields on form submit
 *  4. On valid submission: generate order number, store in sessionStorage,
 *     clear cart, redirect to checkout-success.html
 *
 * Uses var throughout (no modules, no const/let).
 * validateEmail, validatePhone, and generateOrderNumber are exposed at
 * top scope so tests can reference them directly.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

// ─── Validation Utilities ────────────────────────────────────────────────────

/**
 * validateEmail — returns true when value matches a basic email pattern.
 * Requires at least one non-whitespace/@ character on each side of @,
 * and at least one non-whitespace/@ character after the final dot.
 *
 * @param {string} value
 * @returns {boolean}
 */
function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * validatePhone — returns true when value contains only digits, spaces, and
 * plus signs, AND has at least 7 digit characters.
 *
 * @param {string} value
 * @returns {boolean}
 */
function validatePhone(value) {
  return /^[\d\s+]+$/.test(value) && (value.match(/\d/g) || []).length >= 7;
}

// ─── Order Number Generator ───────────────────────────────────────────────────

/**
 * generateOrderNumber — produces a random order number of the form
 * "ORD-XXXXXXXX" where X is an alphanumeric character (A-Z, 0-9).
 *
 * @returns {string}
 */
function generateOrderNumber() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var suffix = '';
  for (var i = 0; i < 8; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'ORD-' + suffix;
}

// ─── DOMContentLoaded Bootstrap ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {

  // ── 1. Redirect if cart is empty ──────────────────────────────────────────
  if (CartManager.getCart().length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // ── 2. Render order summary ───────────────────────────────────────────────
  var cart = CartManager.getCart();
  var summaryItems = document.getElementById('summaryItems');
  var summarySubtotal = document.getElementById('summarySubtotal');

  if (summaryItems) {
    var html = '';
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var variant = item.color + (item.size ? ' / ' + item.size : '');
      var lineTotal = item.price * item.qty;
      html += '<p class="summary-row mono">' +
        item.name + ' \u2014 ' + variant +
        ' \u00d7 ' + item.qty +
        ' = R' + lineTotal +
        '</p>';
    }
    summaryItems.innerHTML = html;
  }

  if (summarySubtotal) {
    var subtotal = 0;
    for (var j = 0; j < cart.length; j++) {
      subtotal += cart[j].price * cart[j].qty;
    }
    summarySubtotal.textContent = 'Subtotal: R' + subtotal;
  }

  // ── 3. Form submission handler ────────────────────────────────────────────
  var form = document.getElementById('checkoutForm');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var isValid = true;

    // Helper to set or clear a field error
    function setError(fieldId, message) {
      var el = document.getElementById(fieldId + 'Error');
      if (el) el.textContent = message;
      if (message) { isValid = false; }
    }

    // Required text fields (non-empty)
    var textFields = [
      { id: 'fullName',      label: 'Full Name' },
      { id: 'streetAddress', label: 'Street Address' },
      { id: 'city',          label: 'City' },
      { id: 'province',      label: 'Province' },
      { id: 'postalCode',    label: 'Postal Code' }
    ];

    for (var k = 0; k < textFields.length; k++) {
      var field = textFields[k];
      var input = document.getElementById(field.id);
      var value = input ? input.value : '';
      if (value.trim().length > 0) {
        setError(field.id, '');
      } else {
        setError(field.id, 'Please enter your ' + field.label);
      }
    }

    // Email
    var emailInput = document.getElementById('email');
    var emailValue = emailInput ? emailInput.value : '';
    if (validateEmail(emailValue)) {
      setError('email', '');
    } else {
      setError('email', 'Please enter a valid email address');
    }

    // Phone
    var phoneInput = document.getElementById('phone');
    var phoneValue = phoneInput ? phoneInput.value : '';
    if (validatePhone(phoneValue)) {
      setError('phone', '');
    } else {
      setError('phone', 'Please enter a valid phone number (min 7 digits)');
    }

    // Stop if validation failed
    if (!isValid) return;

    // ── All valid: place order ──────────────────────────────────────────────
    var orderNumber = generateOrderNumber();
    sessionStorage.setItem('sg_order_number', orderNumber);
    CartManager.clearCart();
    window.location.href = 'checkout-success.html';
  });

});

// Node.js / CommonJS export for testing (no-op in browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateEmail: validateEmail,
    validatePhone: validatePhone,
    generateOrderNumber: generateOrderNumber
  };
}
