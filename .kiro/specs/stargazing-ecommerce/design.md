# Design Document — StarGazing E-Commerce Site

## Overview

StarGazing is a fully static, multi-page e-commerce site for a South African cosmic-themed clothing brand. The site sells nine products across three collections (Astronomy Edition, Little Explorers, Wish Edition). There is no backend, no build tool, and no network dependency beyond Google Fonts. Cart state persists in `localStorage`. Checkout is a mock flow. The site opens by double-clicking `index.html` or serving the project folder statically.

**Technology constraints:** HTML5, CSS3, vanilla JavaScript (ES2020 features are fine — no modules, no bundler). All asset paths are relative. No `fetch`, no `import`, no Node.js.

---

## Architecture

### File Structure

```
/
├── index.html
├── shop.html
├── product.html
├── cart.html
├── checkout.html
├── checkout-success.html
├── about.html
├── 404.html
├── css/
│   └── style.css
├── js/
│   ├── products.js      ← global PRODUCTS array (data only)
│   ├── cart.js          ← CartManager singleton
│   └── main.js          ← nav, night-sky, marquee, star-fact widget
└── images/
    └── products/        ← product variant images (e.g. saturn-wish-tee-black.jpg)
```

### Script Load Order

Every page loads scripts in this exact order, at the bottom of `<body>`, **before** `</body>`:

```html
<script src="js/products.js"></script>   <!-- defines window.PRODUCTS -->
<script src="js/cart.js"></script>       <!-- defines window.CartManager -->
<script src="js/main.js"></script>       <!-- nav badge, night-sky, marquee, star-fact -->
<script src="js/page-specific.js"></script> <!-- shop.js / product.js / cart-page.js / checkout.js -->
```

Pages that have no page-specific JS (about, 404, checkout-success) omit the fourth `<script>` tag.

`products.js` must come first because `cart.js` may reference product data for display, and `main.js` initialises the nav badge on load which reads from `CartManager`.

### How Pages Share CSS and JS

All pages include:
```html
<link rel="stylesheet" href="css/style.css">
```
in `<head>`, and the three shared scripts at the end of `<body>`. There is no CSS-in-JS, no scoped styles, and no per-page stylesheet. Per-collection visual differences are handled by scoped CSS classes (`.col-astronomy`, `.col-kids`, `.col-wish`) applied to wrapper elements.

### Page Map

| File | Purpose |
|---|---|
| `index.html` | Landing / hero / collections preview / star-fact widget |
| `shop.html` | Full product grid with filter + sort |
| `product.html` | Single product detail, swatch, size, add-to-cart |
| `cart.html` | Cart line items, quantity stepper, subtotal |
| `checkout.html` | Shipping form + order summary |
| `checkout-success.html` | Mock order confirmation |
| `about.html` | Brand story, founder note |
| `404.html` | Lost-in-space error page |

---

## Data Models

### Product Object

```js
{
  id: "saturn-wish-tee",          // string — kebab-case, URL-safe, unique
  name: "Saturn Wish Tee",        // string — display name
  collection: "astronomy",        // "astronomy" | "kids" | "wish"
  price: 450,                     // number — ZAR, no decimals
  description: "...",             // string — one paragraph
  material: "100% cotton",        // string — fabric/construction note
  sizes: ["XS","S","M","L","XL"], // string[] — empty [] if one-size
  variants: [                     // Variant[]
    { color: "Black", image: "images/products/saturn-wish-tee-black.jpg" },
    { color: "Navy",  image: "images/products/saturn-wish-tee-navy.jpg"  }
  ]
}
```

**Rule:** `sizes` is always an array. Products with no sizing (e.g. Telescope Patch Cap) set `sizes: []`. The size selector UI is rendered only when `sizes.length > 0`.

### Variant Object

```js
{
  color: "Black",                                          // string — display label
  image: "images/products/saturn-wish-tee-black.jpg"      // string — relative path
}
```

### CartItem Object

```js
{
  productId: "saturn-wish-tee",   // string — matches Product.id
  color: "Black",                 // string — matches Variant.color
  size: "M",                      // string | null — null when product has no sizes
  qty: 2,                         // number — positive integer ≥ 1
  price: 450,                     // number — unit price at time of add (ZAR)
  name: "Saturn Wish Tee",        // string — denormalised for cart display
  image: "images/products/saturn-wish-tee-black.jpg" // string — variant image path
}
```

A cart item is uniquely identified by the triple `(productId, color, size)`. If a shopper adds the same product+color+size again, `addItem` increments `qty` rather than appending a duplicate row.

### PRODUCTS Array (`js/products.js`)

```js
var PRODUCTS = [
  /* 1 */ { id:"saturn-wish-tee",      collection:"astronomy", price:450, ... },
  /* 2 */ { id:"orbit-line-tee",       collection:"astronomy", price:450, ... },
  /* 3 */ { id:"telescope-patch-cap",  collection:"astronomy", price:320, sizes:[], ... },
  /* 4 */ { id:"space-buddies-tee",    collection:"kids",      price:280, ... },
  /* 5 */ { id:"cool-planet-hoodie",   collection:"kids",      price:520, ... },
  /* 6 */ { id:"moonwalker-onesie",    collection:"kids",      price:310, ... },
  /* 7 */ { id:"make-a-wish-tee",      collection:"wish",      price:495, ... },
  /* 8 */ { id:"eye-of-saturn-tee",    collection:"wish",      price:495, ... },
  /* 9 */ { id:"drip-orbit-crew",      collection:"wish",      price:650, ... }
];
```

`var` (not `const`/`let`) ensures the name is on `window` and accessible from all subsequent scripts without modules.

---

## Components and Interfaces

### CartManager Module (`js/cart.js`)

`CartManager` is an IIFE that attaches a singleton to `window.CartManager`. It owns all reads and writes to `localStorage` and exposes a clean API to the rest of the site.

#### Internal State

```js
var CartManager = (function() {
  var STORAGE_KEY = "stargazing_cart";
  var _cart = [];          // CartItem[] — in-memory working copy
  var _storageAvailable = false;
  // ...
})();
```

`_storageAvailable` is determined once at initialisation by calling `_testStorage()` which attempts a `localStorage.setItem` / `localStorage.removeItem` round trip inside a try/catch. If it throws (private browsing with blocked storage), `_storageAvailable` stays false and all reads/writes go to `_cart` only.

#### Initialisation (runs immediately on script load)

```
_storageAvailable = _testStorage()
_cart = _load()          // reads localStorage if available, else returns []
```

#### Public API

| Function | Signature | Behaviour |
|---|---|---|
| `getCart()` | `() → CartItem[]` | Returns a shallow copy of `_cart` |
| `addItem(item)` | `(CartItem) → void` | Finds existing row by `(productId, color, size)` and increments qty, or pushes new row. Calls `_save()`. |
| `updateQuantity(productId, color, size, qty)` | `(str,str,str\|null,num) → void` | Finds row, sets qty. If qty ≤ 0, calls `removeItem`. Calls `_save()`. |
| `removeItem(productId, color, size)` | `(str,str,str\|null) → void` | Filters `_cart` to remove matching row. Calls `_save()`. |
| `clearCart()` | `() → void` | Sets `_cart = []`. Calls `_save()`. Used by checkout-success page. |

#### Private Helpers

- `_save()` — serialises `_cart` to JSON, writes to `localStorage[STORAGE_KEY]` if available, silently skips if not.
- `_load()` — reads `localStorage[STORAGE_KEY]`, parses JSON, returns array. Returns `[]` on any error (malformed JSON, key missing, storage blocked).
- `_testStorage()` — tries `localStorage.setItem("__sg_test__","1")` / `removeItem`. Returns `true` on success, `false` on any exception.
- `_findIndex(productId, color, size)` — returns index of matching `_cart` row or `-1`.

#### localStorage Fallback Strategy

When `_storageAvailable === false`:
- `_save()` is a no-op (data lives only in `_cart` for the session).
- `_load()` returns `[]` (fresh cart each page load).
- No error is thrown or logged to the user.
- The cart still works fully within a single tab session.

#### Cart Badge Helper

`CartManager.getTotalItems()` returns the sum of all `qty` values in `_cart`. This is called by `main.js` to update the nav badge. It is not a storage operation and has no side effects.

---

### Nav Component (`js/main.js` + copy-pasted HTML)

#### HTML Pattern (copy-pasted verbatim on every page)

```html
<nav aria-label="Main navigation">
  <div class="nav-brand">
    <a href="index.html">
      <!-- Badge SVG (38×38) -->
      <svg viewBox="0 0 60 60" width="38" height="38" aria-hidden="true">
        <circle cx="30" cy="30" r="27" fill="none" stroke="#f2b632" stroke-width="2"/>
        <ellipse cx="30" cy="30" rx="24" ry="8" fill="none" stroke="#1f7a72"
          stroke-width="1.5" transform="rotate(-14 30 30)"/>
        <circle cx="30" cy="30" r="10" fill="#f2b632"/>
      </svg>
      <span class="display">STARGAZING</span>
    </a>
  </div>

  <div class="nav-links" id="navLinks">
    <a href="shop.html">Shop</a>
    <a href="about.html">About</a>
    <a href="cart.html" class="cart-link">
      Cart
      <span class="cart-badge" id="cartBadge" aria-live="polite" aria-atomic="true"></span>
    </a>
  </div>

  <button class="hamburger" id="hamburger"
    aria-label="Toggle menu" aria-expanded="false" aria-controls="navLinks">
    <span></span><span></span><span></span>
  </button>
</nav>
```

#### Cart Badge Update Mechanism

`main.js` defines `updateCartBadge()`:
```js
function updateCartBadge() {
  var count = CartManager.getTotalItems();
  var badge = document.getElementById('cartBadge');
  if (!badge) return;
  badge.textContent = count > 0 ? count : '';
  badge.style.display = count > 0 ? 'inline-flex' : 'none';
}
```

`updateCartBadge()` is called:
1. Once on every `DOMContentLoaded` (from `main.js`).
2. After every `CartManager.addItem`, `updateQuantity`, `removeItem`, `clearCart` call on cart/product pages.

Because `#cartBadge` carries `aria-live="polite"`, screen readers announce the updated count without focus moving.

#### Hamburger Toggle

`main.js` wires up the toggle once on `DOMContentLoaded`:

```js
var hamburger = document.getElementById('hamburger');
var navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', function() {
  var isOpen = navLinks.classList.toggle('nav-open');
  hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});
```

CSS hides `.nav-links` at ≤900px and shows them when `.nav-open` is present:
```css
@media (max-width: 900px) {
  .nav-links { display: none; }
  .nav-links.nav-open { display: flex; flex-direction: column; /* ... */ }
  .hamburger { display: flex; }
}
```

The hamburger has `aria-expanded="false"` in the static HTML, toggled by JS. Clicking anywhere outside the nav does **not** close the menu (simple toggle only — sufficient for a static site).

---

## Page-by-Page Design

### index.html — Home Page

**JS responsibilities (inline `<script>` + `main.js`):**
- Night-sky generator (see Night-Sky section below)
- Marquee animation (CSS handles it; JS only needed for `prefers-reduced-motion` check — CSS media query handles this natively)
- Star-fact widget click handler

**Key DOM structure:**
```html
<section class="hero">
  <div class="night-sky" id="nightSky"></div>
  <!-- badge SVG (full 400×400 version) -->
  <h1 class="hero-title display">Apparel for anyone who's ever <span class="accent">looked up</span></h1>
  <div class="cta-row">
    <a href="shop.html?collection=kids" class="btn">Shop Little Explorers</a>
    <a href="shop.html?collection=astronomy" class="btn alt">Shop Astronomy Edition</a>
  </div>
</section>

<div class="marquee" role="marquee" aria-hidden="true">
  <div class="marquee-track mono"><!-- fact spans --></div>
</div>

<section class="section collections-preview">
  <!-- 3 collection cards, each linking to shop.html?collection=X -->
</section>

<section class="starfield-section">
  <div class="starfield" id="starfield">
    <!-- 6+ .wish-star buttons with data-fact -->
  </div>
  <p class="wish-fact mono" id="wishFact" aria-live="polite"></p>
</section>

<section class="split"><!-- brand story --></section>
<footer><!-- nav columns, copyright --></footer>
```

**Data flow:** No product data needed on home page. `main.js` reads `CartManager.getTotalItems()` for the badge on load.

**Star-fact widget handler (in `main.js`):**
```js
document.querySelectorAll('.wish-star').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var el = document.getElementById('wishFact');
    if (!el) return;
    el.textContent = btn.dataset.fact;
    el.classList.remove('show');
    void el.offsetWidth; // force reflow to restart transition
    el.classList.add('show');
  });
});
```

---

### shop.html — Shop Page

**JS responsibilities (`js/shop.js`):**
- Read URL params on load, pre-set active filter
- Render all/filtered product cards into `#productGrid`
- Wire filter buttons and sort select
- Handle color swatch hover/click on cards
- Navigate to `product.html?id=X` on card click

**Key DOM structure:**
```html
<section class="shop-controls">
  <div class="filter-group" role="group" aria-label="Filter by collection">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="astronomy">Astronomy Edition</button>
    <button class="filter-btn" data-filter="kids">Little Explorers</button>
    <button class="filter-btn" data-filter="wish">Wish Edition</button>
  </div>
  <select id="sortSelect" aria-label="Sort products">
    <option value="default">Featured</option>
    <option value="price-asc">Price: Low to High</option>
    <option value="price-desc">Price: High to Low</option>
  </select>
</section>

<div id="productGrid" class="grid"></div>
```

**Filter/Sort Pipeline (in-memory):**

```js
function getFilteredSortedProducts(filter, sort) {
  var result = PRODUCTS.slice(); // copy
  if (filter && filter !== 'all') {
    result = result.filter(function(p) { return p.collection === filter; });
  }
  if (sort === 'price-asc') {
    result.sort(function(a, b) { return a.price - b.price; });
  } else if (sort === 'price-desc') {
    result.sort(function(a, b) { return b.price - a.price; });
  }
  // 'default' preserves PRODUCTS order
  return result;
}
```

State variables: `var activeFilter = 'all'; var activeSort = 'default';`

Both filter buttons and sort select call `renderGrid(getFilteredSortedProducts(activeFilter, activeSort))` after updating state.

**URL pre-filter on load:**
```js
var params = new URLSearchParams(window.location.search);
var col = params.get('collection');
if (col && ['astronomy','kids','wish'].includes(col)) {
  activeFilter = col;
  // visually activate the matching filter button
}
```

**Card HTML (generated per product):**
```html
<div class="card col-{collection}" data-id="{id}" tabindex="0" role="link" aria-label="{name}">
  <div class="card-visual">
    <img src="{variants[0].image}" alt="{name}" class="card-img" data-current-color="{variants[0].color}">
  </div>
  <div class="card-name">{name}</div>
  <div class="card-meta">
    <div class="swatch-row" role="group" aria-label="Colours for {name}">
      <!-- swatch buttons -->
    </div>
    <span class="card-price mono">R{price}</span>
  </div>
</div>
```

Swatch click calls `event.stopPropagation()` to prevent card navigation. Card click (when not on a swatch) navigates to `product.html?id={id}`.

---

### product.html — Product Detail Page

**JS responsibilities (`js/product.js`):**
- Parse `?id=` param → find product in `PRODUCTS` → redirect to `404.html` if not found
- Render full product detail into `#productDetail`
- Manage selected color, size, quantity state
- Swatch ↔ primary image sync
- Thumbnail click → primary image sync
- Add to Cart with validation and confirmation state

**Key DOM structure:**
```html
<div id="productDetail">
  <div class="product-images">
    <img id="primaryImage" src="" alt="">
    <div class="thumbnail-strip" id="thumbnailStrip">
      <!-- one <img> per variant -->
    </div>
  </div>

  <div class="product-info">
    <h1 id="productName" class="display"></h1>
    <p id="productPrice" class="mono"></p>
    <p id="productDescription"></p>
    <p id="productMaterial" class="mono"></p>

    <div class="swatch-group" id="swatchGroup"
      role="group" aria-label="Select colour">
      <!-- one .swatch button per variant -->
    </div>
    <p id="selectedColorLabel" class="mono"></p>

    <div class="size-selector" id="sizeSelector"
      role="group" aria-label="Select size">
      <!-- one .size-btn per size string -->
    </div>
    <p id="sizeError" class="error" aria-live="polite" hidden></p>

    <div class="qty-stepper" role="group" aria-label="Quantity">
      <button id="qtyDec" aria-label="Decrease quantity">−</button>
      <span id="qtyValue">1</span>
      <button id="qtyInc" aria-label="Increase quantity">+</button>
    </div>

    <button id="addToCartBtn" class="btn">Add to Cart</button>
  </div>
</div>
```

**State variables (module-scoped in `product.js`):**
```js
var product = null;       // Product — loaded from PRODUCTS
var selectedColor = null; // string — Variant.color
var selectedSize  = null; // string | null
var qty = 1;
```

**Color swatch ↔ image sync:**
1. On swatch click: set `selectedColor` to `variant.color`; update `#primaryImage.src` to `variant.image`; add `.active` class to clicked swatch, remove from others; update `#selectedColorLabel.textContent`; scroll matching thumbnail into view.
2. On thumbnail click: find variant by matching `variant.image` to thumbnail `src`; call same update logic as swatch click.

Active swatch is differentiated by a gold border + checkmark icon (not color alone — satisfies accessibility requirement 13.7).

**Size selector state:**
Clicking a size button adds `.selected` class to it and removes from siblings; sets `selectedSize`. Selected size is differentiated by border + background change (not color alone).

**Add-to-Cart flow:**
```
1. IF product.sizes.length > 0 AND selectedSize === null:
     show #sizeError, return
   ELSE: hide #sizeError

2. CartManager.addItem({
     productId: product.id,
     color: selectedColor,
     size: selectedSize,   // null if no sizes
     qty: qty,
     price: product.price,
     name: product.name,
     image: currentVariant.image
   })

3. updateCartBadge()

4. addToCartBtn.textContent = 'Added ✓'
   addToCartBtn.disabled = true
   setTimeout(function() {
     addToCartBtn.textContent = 'Add to Cart'
     addToCartBtn.disabled = false
   }, 1500)
```

**Quantity stepper:**
- Decrement button: disabled when `qty === 1`. On click: `qty--`, update `#qtyValue`, enable/disable button.
- Increment button: always enabled. On click: `qty++`, update `#qtyValue`, ensure decrement is enabled.

---

### cart.html — Cart Page

**JS responsibilities (`js/cart-page.js`):**
- On load: read `CartManager.getCart()`, render rows or empty state
- Quantity stepper changes: call `CartManager.updateQuantity`, re-render affected row + subtotal
- Remove button: call `CartManager.removeItem`, remove row, update subtotal and badge
- Subtotal recalculation on any change

**Key DOM structure:**
```html
<section class="cart-section">
  <div id="cartContent">
    <!-- populated by JS -->
  </div>
</section>
```

**Render loop:**
```js
function renderCart() {
  var items = CartManager.getCart();
  var container = document.getElementById('cartContent');
  if (items.length === 0) {
    container.innerHTML = '<p class="empty-cart">Your cart is empty. ' +
      '<a href="shop.html">Continue shopping</a></p>';
    return;
  }
  var rows = items.map(renderCartRow).join('');
  var subtotal = items.reduce(function(sum, i) { return sum + i.price * i.qty; }, 0);
  container.innerHTML =
    '<div class="cart-rows">' + rows + '</div>' +
    '<div class="cart-footer">' +
      '<p class="subtotal mono">Subtotal: R' + subtotal + '</p>' +
      '<a href="checkout.html" class="btn">Proceed to Checkout</a>' +
    '</div>';
  wireCartEvents();
}
```

**Cart row HTML (generated):**
```html
<div class="cart-row" data-id="{productId}" data-color="{color}" data-size="{size}">
  <img src="{image}" alt="{name}" class="cart-thumb">
  <div class="cart-row-info">
    <p class="cart-row-name">{name}</p>
    <p class="mono">{color}{size ? ' / ' + size : ''}</p>
    <p class="mono">R{price} each</p>
  </div>
  <div class="qty-stepper" role="group" aria-label="Quantity for {name}">
    <button class="qty-dec" aria-label="Decrease quantity">−</button>
    <span class="qty-val">{qty}</span>
    <button class="qty-inc" aria-label="Increase quantity">+</button>
  </div>
  <p class="line-total mono">R{price * qty}</p>
  <button class="remove-btn" aria-label="Remove {name} from cart">✕</button>
</div>
```

Quantity decrement to 0 removes the row (CartManager calls `removeItem` internally). After any change, `renderCart()` is called again (full re-render approach is simple and correct for this scale). `updateCartBadge()` is called after every mutation.

---

### checkout.html — Checkout Page

**JS responsibilities (`js/checkout.js`):**
- On load: check cart — redirect to `cart.html` if empty
- Render order summary sidebar from `CartManager.getCart()`
- Validate form fields on "Place Order" click
- Generate mock order number
- Write order number to `sessionStorage`, clear cart, navigate to confirmation page

**Key DOM structure:**
```html
<section class="checkout-layout">
  <form id="checkoutForm" novalidate>
    <h2 class="display">Shipping Details</h2>
    <div class="field-group">
      <label for="fullName">Full Name</label>
      <input id="fullName" name="fullName" type="text" required autocomplete="name">
      <span class="field-error" id="fullNameError" aria-live="polite"></span>
    </div>
    <!-- street, city, province, postalCode, email, phone — same pattern -->
    <button type="submit" id="placeOrderBtn" class="btn">Place Order</button>
  </form>

  <aside class="order-summary" aria-label="Order summary">
    <h2 class="display">Your Order</h2>
    <div id="summaryItems"></div>
    <p class="subtotal mono" id="summarySubtotal"></p>
  </aside>
</section>
```

**Form Validation Rules:**

| Field | Rule | Error message |
|---|---|---|
| Full Name | `value.trim().length > 0` | "Please enter your full name" |
| Street Address | `value.trim().length > 0` | "Please enter your street address" |
| City | `value.trim().length > 0` | "Please enter your city" |
| Province | `value.trim().length > 0` | "Please enter your province" |
| Postal Code | `value.trim().length > 0` | "Please enter your postal code" |
| Email | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)` | "Please enter a valid email address" |
| Phone | `/^[\d\s+]{7,}$/.test(value) && (value.match(/\d/g)\|\|[]).length >= 7` | "Please enter a valid phone number (min 7 digits)" |

Validation runs on form submit. All failing fields show their error `<span>` inline. Validation does not run on blur (keeps it simple for a static site). The form uses `novalidate` to suppress browser native bubbles and rely entirely on custom validation display.

**Email regex breakdown:** `^[^\s@]+@[^\s@]+\.[^\s@]+$` — at least one non-whitespace/non-@ before `@`, a domain part, a dot, a TLD. Covers standard emails without being overly strict.

**Phone regex breakdown:** `^[\d\s+]+$` with a minimum of 7 digit characters. Accepts formats like `+27 82 555 1234`, `0821234567`, `+1 555 123 4567`.

**Mock order number generation:**
```js
function generateOrderNumber() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var suffix = '';
  for (var i = 0; i < 8; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'ORD-' + suffix;
}
```

**Handoff to confirmation page:**
```js
// On valid form submit:
var orderNumber = generateOrderNumber();
sessionStorage.setItem('sg_order_number', orderNumber);
CartManager.clearCart();
window.location.href = 'checkout-success.html';
```

---

### checkout-success.html — Confirmation Page

**JS (inline `<script>`):**
```js
var orderNumber = sessionStorage.getItem('sg_order_number') || 'ORD-XXXXXXXX';
document.getElementById('orderNumber').textContent = orderNumber;
sessionStorage.removeItem('sg_order_number');
// CartManager.clearCart() is called here again as safety net
// (already cleared in checkout.js but guard against direct navigation)
updateCartBadge();
```

**Key DOM:**
```html
<section class="confirmation">
  <div class="star-burst">★</div>
  <h1 class="display">Your wish is on its way!</h1>
  <p class="mono">Order <strong id="orderNumber"></strong></p>
  <p>Thank you for stargazing with us. Make a wish while you wait.</p>
  <a href="shop.html" class="btn">Continue Shopping</a>
</section>
```

---

### about.html — Brand Story

No page-specific JS. Static HTML with the full nav, hero-style header section (using the shared night-sky CSS background but without JS-generated stars), two content sections (brand narrative + founder note), and footer.

---

### 404.html — Error Page

No page-specific JS. Uses the night-sky CSS background (static, no JS generation needed — the CSS radial-gradient dot pattern from `.starfield-section` in the mockup is sufficient). Displays a large "404" headline, a "lost in space" message, and a link back to `index.html`. Includes shared nav and footer.

---

## Shop Page Filter/Sort Logic (Detail)

### In-Memory Pipeline

```
PRODUCTS (global array, never mutated)
  → filter step: .filter(p => activeFilter === 'all' || p.collection === activeFilter)
  → sort step:   .sort(comparator based on activeSort)
  → renderGrid(result)
```

Both filter and sort are applied every time either state changes. There is no intermediate cached state — the pipeline runs from scratch on each user interaction. For 9 products this is trivially fast.

### URL Param Pre-Filter on Load

```js
document.addEventListener('DOMContentLoaded', function() {
  var params = new URLSearchParams(window.location.search);
  var col = params.get('collection');
  var valid = ['astronomy','kids','wish'];
  if (col && valid.indexOf(col) !== -1) {
    activeFilter = col;
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.filter === col);
    });
  }
  renderGrid(getFilteredSortedProducts(activeFilter, activeSort));
});
```

### Simultaneous Filter + Sort

Because `getFilteredSortedProducts` always uses the current `activeFilter` and `activeSort`, changing either one automatically applies both. No special case needed.

### Card Generation

`renderGrid(products)` clears `#productGrid.innerHTML` and appends one card element per product. Cards are plain `<div>` elements with `tabindex="0"` and `role="link"` so keyboard users can activate them. The Enter key triggers navigation:

```js
card.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') window.location.href = 'product.html?id=' + product.id;
});
```

---

## CSS Architecture

### Custom Properties (`:root`)

All seven palette variables are defined in `css/style.css`:

```css
:root {
  --void:      #0d0e1a;   /* primary background — void navy-black */
  --void-deep: #07070f;   /* deeper background for contrast sections */
  --gold:      #f2b632;   /* primary accent — Astronomy Edition, headings */
  --teal:      #1f7a72;   /* secondary accent — orbit rings, split accent */
  --rust:      #e0502a;   /* Wish Edition accent */
  --cream:     #f5efe0;   /* body text, stars */
  --dim:       #9a97b0;   /* secondary text, nav links */
}
```

### Shared Utility Classes

| Class | Purpose |
|---|---|
| `.display` | `font-family: 'Bungee', cursive; text-transform: uppercase` |
| `.mono` | `font-family: 'Space Mono', monospace` |
| `.btn` | Primary gold CTA button |
| `.btn.alt` | Teal outline variant |
| `.section` | `padding: 100px 5vw` |
| `.section-head` | Centered heading block |
| `.section-label` | Small gold uppercase Space Mono label |
| `.grid` | `display: grid; grid-template-columns: repeat(3,1fr); gap: 22px` |
| `.card` | Product card base styles |
| `.error` | Red inline validation message |
| `.visually-hidden` | Accessible text hidden visually but readable by screen readers |

### Per-Collection Scoped Accent Classes

These classes are applied to collection wrapper elements (`<section>`, `<div>`) and scope all descendant card styles. They **must not** appear on `<nav>` or `<footer>`.

```css
/* Astronomy Edition — gold/teal */
.col-astronomy .card { background: rgba(31,122,114,0.06); border-color: rgba(242,182,50,0.15); }
.col-astronomy .card:hover { border-color: var(--gold); }
.col-astronomy .card-price { color: var(--gold); }

/* Little Explorers — neon pink (locally scoped) */
.col-kids { background: linear-gradient(180deg, rgba(255,62,165,0.06), transparent); }
.col-kids .card { border-color: rgba(255,62,165,0.2); }
.col-kids .card:hover { border-color: #ff3ea5; }
.col-kids .card-price { color: #ff3ea5; }

/* Wish Edition — rust-orange */
.col-wish .card { border-color: rgba(224,80,42,0.2); }
.col-wish .card:hover { border-color: var(--rust); }
.col-wish .card-price { color: var(--rust); }
```

Kids accent colors (`#ff3ea5`, `#00c2ff`, `#8b5cf6`) appear **only** within `.col-kids` selectors and product detail pages for kids products. They are never applied as global accents or used in nav/footer rules.

### Responsive Breakpoints

```css
/* ≤900px — tablet/mobile */
@media (max-width: 900px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
  .nav-links { display: none; }
  .hamburger { display: flex; }
  .split { grid-template-columns: 1fr; }
  .checkout-layout { flex-direction: column; }
}

/* ≤560px — small mobile */
@media (max-width: 560px) {
  .grid { grid-template-columns: 1fr; }
  .cta-row { flex-direction: column; align-items: center; }
  .foot-links { flex-direction: column; gap: 24px; }
}
```

### Animation Keyframes

```css
/* Twinkling stars */
@keyframes twinkle {
  0%, 100% { opacity: 0.15; }
  50%       { opacity: 1; }
}

/* Shooting stars — SW diagonal (translate + fixed 135deg rotation) */
@keyframes shoot {
  0%   { opacity: 0; transform: translate(0, 0) rotate(135deg); }
  4%   { opacity: 1; }
  22%  { opacity: 1; transform: translate(-320px, 220px) rotate(135deg); }
  26%  { opacity: 0; transform: translate(-340px, 236px) rotate(135deg); }
  100% { opacity: 0; }
}

/* Marquee scroll */
@keyframes scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-100%); }
}
```

The shooting star element starts at its CSS `top`/`left` position and translates 320px left + 220px down over the animation, maintaining `rotate(135deg)` throughout (the element itself is a horizontal line; rotation makes it appear to travel diagonally SW).

### `prefers-reduced-motion` Rules

```css
@media (prefers-reduced-motion: reduce) {
  .night-sky .star { animation: none; opacity: 0.6; }
  .night-sky .shooting-star { display: none; }
  .marquee-track { animation: none; padding-left: 2%; }
  * { transition: none !important; }
}
```

### Focus-Visible Outline

```css
:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 4px;
  border-radius: 3px;
}
```

Applied globally. Interaction-specific elements (swatches, size buttons) add `border-radius: 50%` or `border-radius: 6px` as appropriate via scoped rules.

### Badge SVG Markup (nav, 38×38)

```html
<svg viewBox="0 0 60 60" width="38" height="38" aria-hidden="true">
  <circle cx="30" cy="30" r="27" fill="none" stroke="#f2b632" stroke-width="2"/>
  <ellipse cx="30" cy="30" rx="24" ry="8" fill="none" stroke="#1f7a72"
    stroke-width="1.5" transform="rotate(-14 30 30)"/>
  <circle cx="30" cy="30" r="10" fill="#f2b632"/>
</svg>
```

### Full Badge SVG (hero/footer, 400×400 viewBox)

The full badge (used in hero and footer) is the SVG from `stargazing-mockup-v3.html` verbatim:
- Outer gold circle border, inner teal ring
- Saturn planet group (gold sphere gradient + stipple pattern + two-tone ring — partial ring visible via `stroke-dasharray`)
- `<textPath>` arched "STARGAZING" in Bungee along top arc
- "MAKE A WISH" in Space Mono at `y="330"`
- 4 starburst path accents at corners

---

## Accessibility Patterns

### Focus-Visible Outlines

All interactive elements (`a`, `button`, `input`, `select`, `[tabindex]`) receive the global `:focus-visible` gold outline. No element suppresses `:focus-visible` with `outline: none` unless a custom replacement is provided.

### ARIA Live Regions

| Element | Attribute | Purpose |
|---|---|---|
| `#cartBadge` | `aria-live="polite" aria-atomic="true"` | Announces cart count changes to screen readers |
| `#wishFact` | `aria-live="polite"` | Announces star fact text when revealed |
| `.field-error` spans | `aria-live="polite"` | Announces validation errors on checkout form |
| `#sizeError` | `aria-live="polite"` | Announces "please select a size" on product page |

### Hamburger Toggle

```html
<button class="hamburger" id="hamburger"
  aria-label="Toggle menu"
  aria-expanded="false"
  aria-controls="navLinks">
```

`aria-expanded` is updated to `"true"` / `"false"` in JS when toggled. `aria-controls` references the `id` of the nav links container.

### Swatch Group Roles

```html
<div class="swatch-group" role="group" aria-label="Select colour">
  <button class="swatch" aria-label="{color}" aria-pressed="{true|false}"
    style="background:{colorHex}">
  </button>
</div>
```

`aria-pressed` reflects whether the swatch is the active selection (toggled by JS). Active swatch also has a visible gold ring + inner checkmark icon so color is not the only differentiator.

### Size Selector Roles

```html
<div class="size-selector" role="group" aria-label="Select size">
  <button class="size-btn" aria-pressed="false">XS</button>
  <!-- ... -->
</div>
```

Selected size button has `.selected` class (border + background change) and `aria-pressed="true"`.

### Quantity Steppers

```html
<div class="qty-stepper" role="group" aria-label="Quantity">
  <button aria-label="Decrease quantity" id="qtyDec">−</button>
  <span aria-live="polite" id="qtyValue">1</span>
  <button aria-label="Increase quantity" id="qtyInc">+</button>
</div>
```

`aria-live="polite"` on the quantity value span announces changes.

### Image Alt Text Rules

- Product images: `alt="{Product name} in {color}"` (e.g., "Saturn Wish Tee in Black")
- Thumbnail images: `alt="{color} variant"` (e.g., "Navy variant")
- Badge SVG: `aria-hidden="true"` (decorative — brand name is in adjacent text)
- Decorative illustrations/SVGs: `aria-hidden="true"` or `alt=""`

### Marquee Accessibility

The `.marquee` strip carries `aria-hidden="true"`. The facts it contains are purely supplementary (astronomy trivia) and are not required for any purchasing decision. Per requirement 13.6, this satisfies the accessibility requirement.

### Minimum Touch Targets

All buttons, swatches, and links have minimum `44×44px` effective tap area. Swatches that appear visually smaller (e.g., 20×20px color dots) are wrapped in `<button>` elements with `padding: 8px` to reach the 44px minimum, matching the pattern in the mockup (`.wish-star { padding: 8px }`).

---

## Night-Sky Generator Algorithm

The generator runs once on `DOMContentLoaded` in `main.js`. It attaches to `#nightSky` which is inside `.hero` on `index.html`. The same JS is also called on `404.html` if that page includes a `#nightSky` element.

### Twinkling Stars (60–70)

```js
function generateNightSky(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  // Check reduced motion preference
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var starCount = 60 + Math.floor(Math.random() * 11); // 60–70 inclusive
  for (var i = 0; i < starCount; i++) {
    var star = document.createElement('div');
    star.className = 'star';
    var size = Math.random() * 2 + 1; // 1–3px
    star.style.width  = size + 'px';
    star.style.height = size + 'px';
    star.style.top    = (Math.random() * 100) + '%';
    star.style.left   = (Math.random() * 100) + '%';
    if (!reducedMotion) {
      star.style.animationDelay    = (Math.random() * 3.6) + 's';
      star.style.animationDuration = (2.5 + Math.random() * 2.5) + 's'; // 2.5–5s
    }
    container.appendChild(star);
  }
```

Star properties:
- **Size:** 1–3px, random float
- **Position:** 0–100% both axes, random float (allows placement anywhere in the hero)
- **Animation delay:** 0–3.6s (matches the `twinkle` keyframe duration)
- **Animation duration:** 2.5–5s (variation prevents synchronised pulsing)
- **Reduced motion:** No animation properties set; CSS `animation: none; opacity: 0.6` applies via media query

### Shooting Stars (6)

```js
  var shootCount = 6;
  for (var j = 0; j < shootCount; j++) {
    var shoot = document.createElement('div');
    shoot.className = 'shooting-star';
    shoot.style.width            = (60 + Math.random() * 60) + 'px'; // 60–120px
    shoot.style.top              = (Math.random() * 55) + '%';        // upper 55%
    shoot.style.left             = (55 + Math.random() * 40) + '%';   // right 55–95%
    shoot.style.animationDelay   = (Math.random() * 8) + 's';         // 0–8s stagger
    shoot.style.animationDuration = (4 + Math.random() * 3) + 's';   // 4–7s duration
    if (!reducedMotion) {
      container.appendChild(shoot);
    }
  }
}
```

Shooting star properties:
- **Width:** 60–120px (the line element; longer = more dramatic trail)
- **Top:** Upper 55% of hero only (shooting stars originate from upper-right area)
- **Left:** Right 55–95% (start off-screen right or near-right edge before translating left)
- **Delay:** 0–8s (ensures shots are staggered — no two start simultaneously)
- **Duration:** 4–7s (total animation cycle including invisible pause period)
- **Reduced motion:** Element is not appended at all (JS-level suppression, not just CSS `display:none`)

The `shoot` keyframe translates the element −320px X and +220px Y — southwest diagonal — while maintaining `rotate(135deg)` (the rotation is baked into the element at render time via the keyframe's starting transform, no separate CSS `transform` property on the element itself).

**Why start positions are upper-right:** The translate moves the star southwest. Starting upper-right means it travels across the visible hero area diagonally before exiting lower-left — maximising visible screen time.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `product.html` with missing/invalid `?id=` | `window.location.replace('404.html')` immediately on load |
| `checkout.html` with empty cart | `window.location.replace('cart.html')` immediately on load |
| `checkout-success.html` with no `sessionStorage` order number | Display fallback `'ORD-XXXXXXXX'` — still a valid confirmation UX |
| `localStorage` unavailable | `CartManager` falls back to in-memory `_cart`; no error surfaced to user |
| `localStorage` contains malformed JSON | `_load()` catches parse error, returns `[]` (fresh cart) |
| Image fails to load (product img 404) | CSS `background-color` on `.card-visual` provides a fallback; `alt` text is always set |
| `PRODUCTS` not yet loaded when `cart.js` runs | Script order (`products.js` → `cart.js`) prevents this if the load order rule is followed |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Product Object Shape

*For any* product in `PRODUCTS`, the object shall have all required fields (`id`, `name`, `collection`, `price`, `description`, `material`, `sizes`, `variants`), each `variant` shall have `color` and `image`, each element of `sizes` (when non-empty) shall be a string, and `collection` shall be one of `"astronomy"`, `"kids"`, or `"wish"`.

**Validates: Requirements 1.2, 1.3, 1.5, 1.6**

---

### Property 2: Night-Sky Star Count

*For any* execution of `generateNightSky()`, the number of `.star` elements appended to the container shall be between 60 and 70 inclusive.

**Validates: Requirement 3.2**

---

### Property 3: Filter Correctness

*For any* collection value in `{astronomy, kids, wish}` and any array of products, `getFilteredSortedProducts(products, collection, 'default')` shall return only products whose `collection` field matches the filter value. Conversely, for filter value `'all'`, all products shall be returned.

**Validates: Requirements 4.3, 4.5**

---

### Property 4: Sort Order Invariant

*For any* array of products, `getFilteredSortedProducts(products, 'all', 'price-asc')` shall return a sequence where each product's price is less than or equal to the next product's price. Symmetrically, `'price-desc'` shall return a non-increasing price sequence.

**Validates: Requirements 4.6, 4.7**

---

### Property 5: Cart Round-Trip Persistence

*For any* `CartItem`, calling `CartManager.addItem(item)` followed by `CartManager.getCart()` shall return an array containing a row with matching `productId`, `color`, `size`, `price`, and `qty ≥ 1`. Calling `CartManager.removeItem(item.productId, item.color, item.size)` and then `CartManager.getCart()` shall return an array with no row matching that triple. Calling `CartManager.updateQuantity(id, color, size, n)` and then `CartManager.getCart()` shall return a row with `qty === n` for that triple.

**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

---

### Property 6: Order Number Format

*For any* call to `generateOrderNumber()`, the result shall match the regular expression `/^ORD-[A-Z0-9]{8}$/`.

**Validates: Requirement 8.7**

---

### Property 7: Email Validation Coverage

*For any* string that contains exactly one `@` character, at least one non-whitespace character before it, at least one non-whitespace character between `@` and a `.`, and at least one non-whitespace character after the final `.`, `validateEmail(string)` shall return `true`. For any string that omits `@` or omits a `.` after `@`, it shall return `false`.

**Validates: Requirement 8.8**

---

### Property 8: Phone Validation Coverage

*For any* string composed solely of digit characters, spaces, and `+` characters that contains at least 7 digit characters, `validatePhone(string)` shall return `true`. For any string containing a letter or containing fewer than 7 digit characters, it shall return `false`.

**Validates: Requirement 8.9**

---

## Testing Strategy

### Dual Testing Approach

Unit and property tests are complementary:
- **Unit/example tests** verify specific scenarios (cart renders correctly, redirect fires, form error appears).
- **Property-based tests** verify universal invariants across generated inputs (shape of all products, sort order for any permutation, cart round-trip for any item).

### Property-Based Testing Library

Use **fast-check** (JavaScript) for property-based tests. Each property test runs a minimum of **100 iterations**.

```
npm install --save-dev fast-check
```

Tag format for each test:
```
// Feature: stargazing-ecommerce, Property {N}: {property_text}
```

### Property Test Implementations (Summary)

| Property | What to generate | What to assert |
|---|---|---|
| P1: Product shape | Each product in PRODUCTS array | All required keys present, types correct, collection valid |
| P2: Star count | Call generateNightSky() in JSDOM | `.star` count ∈ [60, 70] |
| P3: Filter correctness | fc.constantFrom('astronomy','kids','wish'), fc.shuffledSubarray(PRODUCTS) | All results match filter, or all returned when 'all' |
| P4: Sort order | fc.shuffledSubarray(PRODUCTS) | Adjacent price pairs satisfy ordering |
| P5: Cart round-trip | fc.record({productId, color, size, qty, price, name, image}) | Add→get contains item; remove→get excludes item; update→get reflects qty |
| P6: Order number | Generate N order numbers | Each matches /^ORD-[A-Z0-9]{8}$/ |
| P7: Email validation | fc.emailAddress() for valid; fc.string() filtered for invalid | Returns true for valid, false for invalid |
| P8: Phone validation | fc.string({minLength:7}).map(s => s.replace(/[^0-9]/g,'')).filter(s=>s.length>=7) for valid | Returns true for valid, false for invalid |

### Unit Test Examples

| Test | What to verify |
|---|---|
| Cart badge hidden when empty | `#cartBadge` has `display:none` when `CartManager.getCart()` is empty |
| Hamburger toggles `aria-expanded` | Click → `aria-expanded="true"`; click again → `"false"` |
| Product redirect on bad id | `product.js` with `?id=nonexistent` → `window.location` is `404.html` |
| Add without size shows error | Click Add to Cart with no size selected → `#sizeError` is visible |
| Confirmation state reverts | After `addItem`, button text is "Added ✓"; after 1500ms it reverts |
| Cart decrement to 0 removes row | `updateQuantity(..., 0)` → item gone from `getCart()` and DOM |
| Checkout redirects on empty cart | `checkout.js` with empty cart → redirect to `cart.html` |
| Order number written to sessionStorage | `placeOrder()` → `sessionStorage.getItem('sg_order_number')` matches `ORD-` pattern |
| `localStorage` unavailable fallback | Mock `localStorage.setItem` to throw → `addItem` doesn't throw, `getCart()` returns item |
| Telescope Patch Cap has empty sizes | `PRODUCTS.find(p=>p.id==='telescope-patch-cap').sizes` is `[]` |
