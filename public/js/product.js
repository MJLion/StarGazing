/**
 * product.js — StarGazing Product Detail Page
 *
 * Responsibilities:
 *  - Parse ?id= URL param and look up product in PRODUCTS
 *  - Redirect to 404.html on missing/invalid id
 *  - Render all product fields into the DOM
 *  - Build colour swatch buttons with aria-pressed, active gold ring + checkmark
 *  - Build thumbnail strip (one <img> per variant)
 *  - Colour swatch ↔ primary image sync
 *  - Thumbnail click → primary image sync
 *  - Size selector with .selected class + aria-pressed
 *  - Quantity stepper (decrement disabled at qty 1)
 *  - Add to Cart: validate size, call CartManager.addItem(), updateCartBadge(),
 *    confirmation state ("Added ✓", disabled) for 1500ms then revert
 *
 * Uses var throughout — no modules, no const/let.
 * Depends on: PRODUCTS (products.js), CartManager (cart.js), updateCartBadge (main.js)
 *
 * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11,
 *               5.13, 5.14, 5.15, 5.16, 13.2, 13.7, 13.8
 */

// ─── State ────────────────────────────────────────────────────────────────────

var product       = null;   // Product object from PRODUCTS
var selectedColor = null;   // string — current Variant.color
var selectedSize  = null;   // string | null
var qty           = 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Rendering ───────────────────────────────────────────────────────────────

function renderProduct() {
  // Set text fields
  document.getElementById('productName').textContent       = product.name;
  document.getElementById('productPrice').textContent      = 'R' + product.price;
  document.getElementById('productDescription').textContent = product.description;
  document.getElementById('productMaterial').textContent   = product.material;

  // Set page title
  document.title = 'StarGazing \u2013 ' + product.name;

  // Initial colour = first variant
  selectedColor = product.variants[0].color;
  document.getElementById('selectedColorLabel').textContent = selectedColor;

  // Primary image — resolve path for multiple formats
  var primaryImg = document.getElementById('primaryImage');
  resolveImagePath(product.variants[0].image).then(function(resolvedPath) {
    primaryImg.src = resolvedPath;
  });
  primaryImg.alt = product.name + ' in ' + selectedColor;

  // Thumbnail strip
  renderThumbnails();

  // Colour swatches
  renderSwatches();

  // Size selector
  renderSizes();

  // Quantity stepper initial state
  updateQtyDisplay();
}

function renderThumbnails() {
  var strip = document.getElementById('thumbnailStrip');
  strip.innerHTML = '';
  product.variants.forEach(function(v) {
    var img = document.createElement('img');
    img.alt       = v.color + ' variant';
    img.className = 'thumb';
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'View ' + v.color + ' colour');
    img.dataset.baseImage = v.image;
    if (v.color === selectedColor) {
      img.classList.add('active');
    }
    // Resolve image path asynchronously
    resolveImagePath(v.image).then(function(resolvedPath) {
      img.src = resolvedPath;
    });
    img.addEventListener('click', function() { syncToVariant(v); });
    img.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        syncToVariant(v);
      }
    });
    strip.appendChild(img);
  });
}

function renderSwatches() {
  var group = document.getElementById('swatchGroup');
  group.innerHTML = '';
  product.variants.forEach(function(v) {
    var btn = document.createElement('button');
    btn.className = 'swatch-btn';
    btn.setAttribute('aria-label', v.color);
    btn.setAttribute('aria-pressed', v.color === selectedColor ? 'true' : 'false');
    btn.style.backgroundColor = colorToHex(v.color);

    // Checkmark for active state (not colour-only — satisfies req 13.7)
    var check = document.createElement('span');
    check.className = 'swatch-check';
    check.textContent = '\u2713';
    check.setAttribute('aria-hidden', 'true');
    btn.appendChild(check);

    if (v.color === selectedColor) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', function() { syncToVariant(v); });
    group.appendChild(btn);
  });
}

function renderSizes() {
  var selector = document.getElementById('sizeSelector');
  selector.innerHTML = '';

  // Hide the size selector entirely when no sizes
  if (!product.sizes || product.sizes.length === 0) {
    selector.style.display = 'none';
    selectedSize = null;
    return;
  }

  selector.style.display = '';
  product.sizes.forEach(function(size) {
    var btn = document.createElement('button');
    btn.className    = 'size-btn';
    btn.textContent  = size;
    btn.setAttribute('aria-pressed', 'false');

    btn.addEventListener('click', function() {
      selectedSize = size;
      // Visual: remove .selected + aria-pressed=false from all, set on clicked
      selector.querySelectorAll('.size-btn').forEach(function(b) {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      // Hide size error if it was showing
      var sizeError = document.getElementById('sizeError');
      if (sizeError) sizeError.hidden = true;
    });

    selector.appendChild(btn);
  });
}

function syncToVariant(v) {
  selectedColor = v.color;

  // Update primary image — resolve path for multiple formats
  var primaryImg = document.getElementById('primaryImage');
  resolveImagePath(v.image).then(function(resolvedPath) {
    primaryImg.src = resolvedPath;
  });
  primaryImg.alt = product.name + ' in ' + v.color;

  // Update colour label
  document.getElementById('selectedColorLabel').textContent = v.color;

  // Update swatch buttons active state
  var group = document.getElementById('swatchGroup');
  group.querySelectorAll('.swatch-btn').forEach(function(btn) {
    var isActive = btn.getAttribute('aria-label') === v.color;
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    btn.classList.toggle('active', isActive);
  });

  // Update thumbnail active state and scroll into view
  var strip = document.getElementById('thumbnailStrip');
  strip.querySelectorAll('.thumb').forEach(function(img) {
    var isActive = img.dataset.baseImage === v.image;
    img.classList.toggle('active', isActive);
    if (isActive) {
      img.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  });
}

function updateQtyDisplay() {
  var valEl = document.getElementById('qtyValue');
  var decBtn = document.getElementById('qtyDec');
  if (valEl) valEl.textContent = qty;
  if (decBtn) decBtn.disabled = qty <= 1;
}

// ─── Quantity Stepper ────────────────────────────────────────────────────────

function wireQtyStepper() {
  var decBtn = document.getElementById('qtyDec');
  var incBtn = document.getElementById('qtyInc');

  if (decBtn) {
    decBtn.addEventListener('click', function() {
      if (qty > 1) {
        qty--;
        updateQtyDisplay();
      }
    });
  }

  if (incBtn) {
    incBtn.addEventListener('click', function() {
      qty++;
      updateQtyDisplay();
    });
  }
}

// ─── Add to Cart ──────────────────────────────────────────────────────────────

function wireAddToCart() {
  var addBtn = document.getElementById('addToCartBtn');
  if (!addBtn) return;

  addBtn.addEventListener('click', function() {
    var sizeError = document.getElementById('sizeError');

    // Validate: require size when product has sizes
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      if (sizeError) {
        sizeError.textContent = 'Please select a size before adding to cart.';
        sizeError.hidden = false;
      }
      return;
    }

    // Clear any previous size error
    if (sizeError) sizeError.hidden = true;

    // Find the current variant image
    var currentVariant = null;
    for (var i = 0; i < product.variants.length; i++) {
      if (product.variants[i].color === selectedColor) {
        currentVariant = product.variants[i];
        break;
      }
    }
    if (!currentVariant) currentVariant = product.variants[0];

    // Add item to cart
    CartManager.addItem({
      productId: product.id,
      color:     selectedColor,
      size:      selectedSize,
      qty:       qty,
      price:     product.price,
      name:      product.name,
      image:     currentVariant.image
    });

    // Update nav badge
    updateCartBadge();

    // Confirmation state — "Added ✓" for 1500ms then revert
    addBtn.textContent = 'Added \u2713';
    addBtn.disabled    = true;
    addBtn.classList.add('added');
    setTimeout(function() {
      addBtn.textContent = 'Add to Cart';
      addBtn.disabled    = false;
      addBtn.classList.remove('added');
    }, 1500);
  });
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  // Parse ?id= from URL
  var params = new URLSearchParams(window.location.search);
  var id     = params.get('id');

  // Redirect to 404 when id is missing or not found in PRODUCTS
  if (!id) {
    window.location.href = '404.html';
    return;
  }

  product = null;
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === id) {
      product = PRODUCTS[i];
      break;
    }
  }

  if (!product) {
    window.location.href = '404.html';
    return;
  }

  // Render product
  renderProduct();

  // Wire interactions
  wireQtyStepper();
  wireAddToCart();
});

// ─── Node.js export guard (Jest) ─────────────────────────────────────────────

if (typeof module !== 'undefined') {
  module.exports = {
    colorToHex:    colorToHex,
    renderProduct: renderProduct,
    syncToVariant: syncToVariant,
    wireAddToCart: wireAddToCart
  };
}
