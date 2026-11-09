/**
 * cart.js — StarGazing Cart Manager
 *
 * Exposes window.CartManager as an IIFE singleton.
 * Manages all cart reads and writes against localStorage.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 6.4, 6.5
 *
 * CartItem shape:
 * {
 *   productId: string,   // matches Product.id
 *   color:     string,   // matches Variant.color
 *   size:      string|null,
 *   qty:       number,   // positive integer >= 1
 *   price:     number,   // unit price in ZAR at time of add
 *   name:      string,
 *   image:     string    // variant image path
 * }
 *
 * A cart item is uniquely identified by (productId, color, size).
 * Adding the same triple increments qty rather than appending a duplicate row.
 */

var CartManager = (function () {

  // ─── Internal State ───────────────────────────────────────────────────────

  var STORAGE_KEY = "stargazing_cart";
  var _cart = [];
  var _storageAvailable = false;

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * _testStorage — verifies localStorage is accessible.
   * Returns true when a set/remove round-trip succeeds; false on any exception
   * (e.g. private browsing with storage blocked, SecurityError).
   */
  function _testStorage() {
    try {
      localStorage.setItem("__sg_test__", "1");
      localStorage.removeItem("__sg_test__");
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * _load — reads and parses the cart array from localStorage.
   * Returns [] on any error: missing key, malformed JSON, storage blocked,
   * or _storageAvailable === false.
   */
  function _load() {
    if (!_storageAvailable) return [];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * _save — serialises _cart to JSON and writes it to localStorage.
   * Silently skips (no-op) when _storageAvailable is false.
   */
  function _save() {
    if (!_storageAvailable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_cart));
    } catch (e) {
      // Storage quota exceeded or access revoked mid-session — fail silently.
    }
  }

  /**
   * _findIndex — finds the index of a cart row matching all three identity fields.
   * Returns -1 when no match is found.
   *
   * @param {string}      productId
   * @param {string}      color
   * @param {string|null} size
   * @returns {number}
   */
  function _findIndex(productId, color, size) {
    for (var i = 0; i < _cart.length; i++) {
      if (
        _cart[i].productId === productId &&
        _cart[i].color === color &&
        _cart[i].size === size
      ) {
        return i;
      }
    }
    return -1;
  }

  // ─── Initialisation (runs immediately on script load) ─────────────────────

  _storageAvailable = _testStorage();
  _cart = _load();

  // ─── Public API ───────────────────────────────────────────────────────────

  return {

    /**
     * getCart — returns a shallow copy of the current cart array.
     * Callers receive a snapshot; mutations to the returned array
     * do not affect the internal state.
     *
     * @returns {CartItem[]}
     */
    getCart: function () {
      return _cart.slice();
    },

    /**
     * addItem — adds a CartItem to the cart.
     * If a row with the same (productId, color, size) triple already exists,
     * its qty is incremented by the incoming item's qty (defaults to 1).
     * Otherwise the item is pushed as a new row.
     * Persists to localStorage via _save().
     *
     * @param {CartItem} item
     */
    addItem: function (item) {
      var idx = _findIndex(item.productId, item.color, item.size);
      if (idx !== -1) {
        _cart[idx].qty += (item.qty || 1);
      } else {
        _cart.push(item);
      }
      _save();
    },

    /**
     * removeItem — removes the cart row that matches the given triple.
     * No-op when no matching row exists.
     * Persists to localStorage via _save().
     *
     * @param {string}      productId
     * @param {string}      color
     * @param {string|null} size
     */
    removeItem: function (productId, color, size) {
      _cart = _cart.filter(function (row) {
        return !(
          row.productId === productId &&
          row.color === color &&
          row.size === size
        );
      });
      _save();
    },

    /**
     * updateQuantity — sets the qty of the matching row.
     * If qty <= 0, delegates to removeItem to remove the row entirely.
     * Persists to localStorage via _save().
     *
     * @param {string}      productId
     * @param {string}      color
     * @param {string|null} size
     * @param {number}      qty
     */
    updateQuantity: function (productId, color, size, qty) {
      if (qty <= 0) {
        this.removeItem(productId, color, size);
        return;
      }
      var idx = _findIndex(productId, color, size);
      if (idx !== -1) {
        _cart[idx].qty = qty;
        _save();
      }
    },

    /**
     * clearCart — empties the cart completely.
     * Persists the empty state to localStorage via _save().
     * Used by checkout-success.html after a mock order is placed.
     */
    clearCart: function () {
      _cart = [];
      _save();
    },

    /**
     * getTotalItems — returns the total number of items in the cart
     * (sum of all qty values). No storage side effects.
     * Used by main.js to update the nav cart badge.
     *
     * @returns {number}
     */
    getTotalItems: function () {
      var total = 0;
      for (var i = 0; i < _cart.length; i++) {
        total += _cart[i].qty;
      }
      return total;
    }

  };

})();

// Node.js / CommonJS export for testing (no-op in browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CartManager: CartManager };
}
