/**
 * shop.js — StarGazing Shop Page
 *
 * Responsibilities:
 *  - Read URL ?collection= param on load and pre-set active filter
 *  - Render all/filtered products into #productGrid as styled cards
 *  - Wire filter buttons and sort select for in-memory filtering/sorting
 *  - Handle colour swatch clicks on cards (swap card thumbnail)
 *  - Navigate to product.html?id=X on card click/Enter
 *
 * Depends on:
 *  - PRODUCTS global array (set by js/products.js, loaded first)
 *  - CartManager (set by js/cart.js, loaded second)
 *
 * Uses var throughout — no modules, no bundler, runs directly in browser.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11
 */

// ─── State ────────────────────────────────────────────────────────────────────

var activeFilter = 'all';
var activeSort   = 'default';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * colorToHex — maps a colour name string to a CSS hex value for swatch styling.
 * Falls back to #9a97b0 (--dim) for unmapped colours.
 *
 * @param {string} colorName
 * @returns {string} hex colour string
 */
function colorToHex(colorName) {
  var map = {
    'Black':            '#0d0e1a',
    'Navy':             '#1a2744',
    'Charcoal':         '#3d3d3d',
    'White':            '#f5efe0',
    'Cream':            '#f5efe0',
    'Yellow':           '#f2b632',
    'Pink':             '#ff3ea5',
    'Blue':             '#3d6fa8',
    'Brown':            '#5a4433',
    'Rust':             '#e0502a',
    'Rusty Grey':       '#6e5a52',
    'Rusty Light Grey': '#a89a92',
    'Grey':             '#9a97b0'
  };
  return map[colorName] || '#9a97b0';
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

/**
 * getFilteredSortedProducts — pure function that filters and sorts a copy
 * of the global PRODUCTS array. Never mutates the original array.
 *
 * @param {string} filter — 'all' | 'astronomy' | 'kids' | 'wish'
 * @param {string} sort   — 'default' | 'price-asc' | 'price-desc'
 * @returns {Array} filtered and sorted product array
 */
function getFilteredSortedProducts(filter, sort) {
  var result = PRODUCTS.slice(); // copy — never mutate the global

  // Filter step
  if (filter && filter !== 'all') {
    result = result.filter(function(p) {
      return p.collection === filter;
    });
  }

  // Sort step
  if (sort === 'price-asc') {
    result.sort(function(a, b) { return a.price - b.price; });
  } else if (sort === 'price-desc') {
    result.sort(function(a, b) { return b.price - a.price; });
  }
  // 'default' preserves original PRODUCTS order

  return result;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/**
 * renderGrid — clears #productGrid and renders one card per product.
 * After building innerHTML, wires card interaction events.
 * Uses resolveImagePath to support multiple image formats (.png, .jpg, .jpeg).
 *
 * @param {Array} products — array of product objects to render
 */
function renderGrid(products) {
  var grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.innerHTML = '';

  products.forEach(function(p) {
    var firstVariant = p.variants[0];

    // Build swatch buttons HTML
    var swatchesHtml = p.variants.map(function(v) {
      var isFirst = v.color === firstVariant.color;
      return '<button class="swatch"' +
        ' style="background-color: ' + colorToHex(v.color) + '"' +
        ' aria-label="' + v.color + '"' +
        ' aria-pressed="' + (isFirst ? 'true' : 'false') + '"' +
        ' data-color="' + v.color + '"' +
        ' data-image="' + v.image + '"' +
        '></button>';
    }).join('');

    // Build card HTML with placeholder image (will be resolved asynchronously)
    var cardHtml =
      '<div class="card col-' + p.collection + '"' +
        ' data-id="' + p.id + '"' +
        ' tabindex="0"' +
        ' role="link"' +
        ' aria-label="' + p.name + '"' +
        '>' +
        '<div class="card-visual">' +
          '<img src=""' +
            ' alt="' + p.name + ' in ' + firstVariant.color + '"' +
            ' class="card-img"' +
            ' data-current-color="' + firstVariant.color + '"' +
            ' data-base-image="' + firstVariant.image + '">' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-name">' + p.name + '</div>' +
          '<div class="card-meta">' +
            '<div class="swatch-row" role="group" aria-label="Colours for ' + p.name + '">' +
              swatchesHtml +
            '</div>' +
            '<span class="card-price mono">R' + p.price + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    var wrapper = document.createElement('div');
    wrapper.innerHTML = cardHtml;
    var card = wrapper.firstChild;
    grid.appendChild(card);

    // Resolve image path asynchronously
    var img = card.querySelector('.card-img');
    resolveImagePath(firstVariant.image).then(function(resolvedPath) {
      if (img) img.src = resolvedPath;
    });
  });

  wireCardEvents();
}

/**
 * wireCardEvents — called after every renderGrid.
 * Wires click/keydown navigation on cards and swatch image-swap behaviour.
 */
function wireCardEvents() {
  var grid = document.getElementById('productGrid');
  if (!grid) return;

  var cards = grid.querySelectorAll('.card');

  cards.forEach(function(card) {
    var productId = card.dataset.id;

    // Card click — navigate unless the click target is a swatch
    card.addEventListener('click', function(e) {
      if (e.target.classList.contains('swatch')) return;
      window.location.href = 'product.html?id=' + productId;
    });

    // Card keydown Enter — navigate
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        window.location.href = 'product.html?id=' + productId;
      }
    });

    // Swatch click — swap card image, stop propagation
    var swatches = card.querySelectorAll('.swatch');
    swatches.forEach(function(swatch) {
      swatch.addEventListener('click', function(e) {
        e.stopPropagation();
        var img = card.querySelector('.card-img');
        if (img) {
          var basePath = swatch.dataset.image;
          resolveImagePath(basePath).then(function(resolvedPath) {
            img.src = resolvedPath;
            img.alt = card.getAttribute('aria-label') + ' in ' + swatch.dataset.color;
            img.dataset.currentColor = swatch.dataset.color;
          });
        }
        // Update aria-pressed on all swatches in this card
        swatches.forEach(function(s) {
          s.setAttribute('aria-pressed', s === swatch ? 'true' : 'false');
        });
      });
    });
  });
}

// ─── DOMContentLoaded Bootstrap ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {

  // ── Filter button wiring ───────────────────────────────────────────────────
  var filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      // Remove active from all, add to clicked
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      activeFilter = btn.dataset.filter;
      renderGrid(getFilteredSortedProducts(activeFilter, activeSort));
    });
  });

  // ── Sort select wiring ─────────────────────────────────────────────────────
  var sortSelect = document.getElementById('sortSelect');

  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      activeSort = sortSelect.value;
      renderGrid(getFilteredSortedProducts(activeFilter, activeSort));
    });
  }

  // ── URL pre-filter ─────────────────────────────────────────────────────────
  var params = new URLSearchParams(window.location.search);
  var col = params.get('collection');
  var validCollections = ['astronomy', 'kids', 'wish'];

  if (col && validCollections.indexOf(col) !== -1) {
    activeFilter = col;
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.filter === col);
    });
  }

  // ── Initial render ─────────────────────────────────────────────────────────
  renderGrid(getFilteredSortedProducts(activeFilter, activeSort));

});

// ─── Module export guard (Node.js / Jest) ─────────────────────────────────────

if (typeof module !== 'undefined') {
  module.exports = {
    getFilteredSortedProducts: getFilteredSortedProducts,
    renderGrid: renderGrid
  };
}
