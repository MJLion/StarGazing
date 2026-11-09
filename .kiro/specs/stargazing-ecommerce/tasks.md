# Implementation Plan: StarGazing E-Commerce Site

## Overview

Build a fully static, multi-page e-commerce site for the StarGazing clothing brand using HTML5, CSS3, and vanilla JavaScript (ES2020, no modules, no bundler). The implementation covers the product catalog data file, shared cart logic, shared navigation and UI utilities, all eight pages, a shared stylesheet, and a fast-check property/unit test suite. Each task builds incrementally so the site is browsable at each checkpoint.

---

## Tasks

- [x] 1. Set up project structure and global CSS foundation
  - Create all eight HTML file stubs (`index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `checkout-success.html`, `about.html`, `404.html`) with correct `<meta viewport>`, Google Fonts `<link>` (Bungee, Nunito, Space Mono), and `<link rel="stylesheet" href="css/style.css">` in `<head>`
  - Create `css/style.css` with CSS custom properties (`:root` palette variables `--void`, `--void-deep`, `--gold`, `--teal`, `--rust`, `--cream`, `--dim`), global resets, typography utility classes (`.display`, `.mono`), button classes (`.btn`, `.btn.alt`), layout utilities (`.section`, `.section-head`, `.section-label`, `.grid`, `.card`), error class (`.error`), `.visually-hidden`, and `:focus-visible` gold outline rule
  - Add per-collection scoped accent classes (`.col-astronomy`, `.col-kids`, `.col-wish`) to `css/style.css`
  - Add responsive breakpoint rules (`≤900px` two-column grid and hamburger, `≤560px` single-column) and `prefers-reduced-motion` rules (stars static, marquee stopped, transitions off) to `css/style.css`
  - Add CSS keyframes: `twinkle`, `shoot`, `scroll` to `css/style.css`
  - Create placeholder `images/products/` directory with a `.gitkeep` (or note for images)
  - _Requirements: 14.1, 14.2, 14.3, 14.6, 12.1, 12.2, 12.3, 15.1, 15.3, 15.4_

- [x] 2. Implement product catalog data (`js/products.js`)
  - [x] 2.1 Create `js/products.js` with the global `var PRODUCTS` array containing all nine product objects (Saturn Wish Tee R450, Orbit Line Tee R450, Telescope Patch Cap R320 `sizes:[]`, Space Buddies Tee R280, Cool Planet Hoodie R520, Moonwalker Onesie R310, Make A Wish Tee R495, Eye of Saturn Tee R495, Drip Orbit Crew R650), each with `id`, `name`, `collection`, `price`, `description`, `material`, `sizes`, and `variants` fields matching the data model spec
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 2.2 Write property test for product object shape (Property 1)
    - **Property 1: Product Object Shape** — for any product in `PRODUCTS`, all required fields are present with correct types, each variant has `color` and `image`, `collection` is one of `"astronomy"|"kids"|"wish"`, and `sizes` is always an array
    - **Validates: Requirements 1.2, 1.3, 1.5, 1.6**
    - Set up fast-check (`npm install --save-dev fast-check`) and a test runner (Jest or equivalent) in a `tests/` directory
    - Tag: `// Feature: stargazing-ecommerce, Property 1: Product Object Shape`

- [x] 3. Implement CartManager (`js/cart.js`)
  - [x] 3.1 Create `js/cart.js` as an IIFE that attaches `window.CartManager` with internal `_cart` array and `_storageAvailable` flag; implement `_testStorage()`, `_load()`, `_save()`, and `_findIndex()` private helpers; run initialisation immediately on script load (`_storageAvailable = _testStorage(); _cart = _load()`)
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 3.2 Implement `CartManager.addItem(item)`, `getCart()`, `removeItem(productId, color, size)`, `updateQuantity(productId, color, size, qty)`, `clearCart()`, and `getTotalItems()` public methods; `addItem` must increment qty on duplicate `(productId, color, size)` triple; `updateQuantity` with qty ≤ 0 must call `removeItem`; all mutations must call `_save()`
    - _Requirements: 7.2, 7.5, 6.4, 6.5_

  - [x] 3.3 Write property test for CartManager round-trip persistence (Property 5)
    - **Property 5: Cart Round-Trip Persistence** — for any `CartItem`, `addItem` then `getCart` returns a row with matching `productId/color/size/price` and `qty ≥ 1`; `removeItem` then `getCart` returns no matching row; `updateQuantity(n)` then `getCart` returns `qty === n`
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**
    - Use `fc.record` to generate arbitrary `CartItem` objects; mock `localStorage` to test storage path and fallback path
    - Tag: `// Feature: stargazing-ecommerce, Property 5: Cart Round-Trip Persistence`

  - [x] 3.4 Write unit tests for CartManager localStorage fallback
    - Mock `localStorage.setItem` to throw; verify `addItem` does not throw and `getCart()` still returns the added item
    - Verify `_testStorage()` returns `false` when storage throws
    - _Requirements: 7.4_

- [x] 4. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement shared utilities and navigation (`js/main.js` + nav HTML)
  - [x] 5.1 Create `js/main.js` with `updateCartBadge()` function (reads `CartManager.getTotalItems()`, shows/hides `#cartBadge`), hamburger toggle (wires `#hamburger` click to toggle `.nav-open` on `#navLinks` and update `aria-expanded`), and star-fact widget handler (`querySelectorAll('.wish-star')` click → update `#wishFact` text with reflow trick to restart CSS transition)
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 3.13, 3.14_

  - [x] 5.2 Implement `generateNightSky(containerId)` in `js/main.js`; generate 60–70 twinkling `.star` elements with random size (1–3px), random top/left (0–100%), random `animationDelay` (0–3.6s) and `animationDuration` (2.5–5s) unless `prefers-reduced-motion`; generate exactly 6 `.shooting-star` elements with random width (60–120px), top (0–55%), left (55–95%), delay (0–8s), duration (4–7s), skipped entirely if `prefers-reduced-motion`; call on `DOMContentLoaded` for `#nightSky`
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 5.3 Write property test for night-sky star count (Property 2)
    - **Property 2: Night-Sky Star Count** — for any execution of `generateNightSky()` in a JSDOM environment, the number of `.star` elements appended is between 60 and 70 inclusive
    - **Validates: Requirement 3.2**
    - Run the generator 100+ times and assert `.star` count ∈ [60, 70] each time
    - Tag: `// Feature: stargazing-ecommerce, Property 2: Night-Sky Star Count`

  - [x] 5.4 Add the copy-pasted nav HTML block (Badge SVG 38×38, brand name `<span class="display">`, Shop/About/Cart links, `#cartBadge` with `aria-live="polite" aria-atomic="true"`, hamburger button with `aria-label`, `aria-expanded`, `aria-controls`) to all eight HTML pages; add shared three-script `<script>` load order (`products.js → cart.js → main.js`) at the bottom of `<body>` on every page; add footer HTML (Badge SVG, three nav columns, copyright) on every page
    - _Requirements: 2.1, 2.2, 2.8, 2.9, 2.10, 13.1, 13.3, 13.8, 15.2, 15.5_

- [x] 6. Implement `index.html` home page content
  - [x] 6.1 Build the hero section in `index.html`: `#nightSky` container div, full 400×400 Badge SVG, `<h1>` with "looked up" in `<span class="accent">`, two CTA `<a>` buttons linking to `shop.html?collection=kids` and `shop.html?collection=astronomy`
    - _Requirements: 3.1, 3.5, 3.6, 3.7, 3.8_

  - [x] 6.2 Add the marquee strip below the hero (`role="marquee" aria-hidden="true"` on outer, `<div class="marquee-track mono">` with duplicated astronomy-fact `<span>` elements for seamless loop), three collections-preview cards linking to `shop.html?collection=X`, Star_Fact_Widget section (6+ `.wish-star` buttons each with unique `data-fact`, `aria-live="polite"` `#wishFact` output), and brand story teaser section
    - _Requirements: 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15, 3.16, 13.4, 13.6_

- [x] 7. Implement shop page (`shop.html` + `js/shop.js`)
  - [x] 7.1 Build `shop.html` static skeleton: filter button group (All / Astronomy Edition / Little Explorers / Wish Edition) with `role="group" aria-label="Filter by collection"`, sort `<select id="sortSelect">` with three options, empty `<div id="productGrid" class="grid">`; add `<script src="js/shop.js"></script>` as the fourth script
    - _Requirements: 4.1, 4.4_

  - [x] 7.2 Create `js/shop.js` with `getFilteredSortedProducts(filter, sort)` pure function (filter step then sort step on a `PRODUCTS.slice()` copy), `renderGrid(products)` function that generates card HTML with `.card.col-{collection}` wrapper, card image, name, price, and swatch-row; wire filter buttons (click → update `activeFilter`, call `renderGrid`), sort select (change → update `activeSort`, call `renderGrid`), URL param pre-filter on `DOMContentLoaded`, and card click/keydown navigation to `product.html?id={id}` (swatch clicks call `event.stopPropagation()`)
    - _Requirements: 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

  - [x] 7.3 Write property test for filter correctness (Property 3)
    - **Property 3: Filter Correctness** — for any collection value in `{astronomy, kids, wish}` and any subset of products, `getFilteredSortedProducts(collection, 'default')` returns only products with matching `collection`; for `'all'`, all products are returned
    - **Validates: Requirements 4.3, 4.5**
    - Use `fc.constantFrom('astronomy','kids','wish')` and `fc.shuffledSubarray(PRODUCTS)`
    - Tag: `// Feature: stargazing-ecommerce, Property 3: Filter Correctness`

  - [x] 7.4 Write property test for sort order invariant (Property 4)
    - **Property 4: Sort Order Invariant** — for any array of products, `getFilteredSortedProducts('all', 'price-asc')` returns a non-decreasing price sequence; `'price-desc'` returns a non-increasing price sequence
    - **Validates: Requirements 4.6, 4.7**
    - Use `fc.shuffledSubarray(PRODUCTS)`; assert adjacent price pairs satisfy ordering
    - Tag: `// Feature: stargazing-ecommerce, Property 4: Sort Order Invariant`

- [x] 8. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement product detail page (`product.html` + `js/product.js`)
  - [x] 9.1 Build `product.html` static skeleton: `<div id="productDetail">` containing `.product-images` (with `#primaryImage` and `#thumbnailStrip`) and `.product-info` (with `#productName`, `#productPrice`, `#productDescription`, `#productMaterial`, `#swatchGroup` with `role="group" aria-label="Select colour"`, `#selectedColorLabel`, `#sizeSelector` with `role="group" aria-label="Select size"`, `#sizeError` with `aria-live="polite"`, qty stepper group with `#qtyDec`/`#qtyValue`/`#qtyInc` and `aria-live="polite"` on value span, `#addToCartBtn`); add `<script src="js/product.js"></script>` as the fourth script
    - _Requirements: 5.1, 5.4, 5.5, 5.8, 5.10, 5.11, 5.12, 13.1, 13.7, 13.8_

  - [x] 9.2 Create `js/product.js` with URL param parsing (`?id=`), PRODUCTS lookup, redirect to `404.html` on missing/invalid id; render all product fields into the DOM; build swatch buttons (`aria-pressed`, gold ring + checkmark on active) and thumbnail strip; implement color swatch ↔ primary image sync and thumbnail click sync; implement size selector (`.selected` class + `aria-pressed`); implement quantity stepper (disable decrement at qty 1)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 13.2, 13.7, 13.8_

  - [x] 9.3 Implement "Add to Cart" flow in `js/product.js`: validate size selection when `product.sizes.length > 0` (show `#sizeError`, block add); call `CartManager.addItem()` with full `CartItem` object; call `updateCartBadge()`; set button text to "Added ✓" and `disabled=true` for 1500ms then revert
    - _Requirements: 5.13, 5.14, 5.15, 5.16_

  - [x] 9.4 Write unit tests for product page logic
    - Test redirect fires when `?id=nonexistent`
    - Test that clicking "Add to Cart" with no size selected shows `#sizeError` and does not call `CartManager.addItem`
    - Test confirmation state: after `addItem`, button text is "Added ✓"; after 1500ms it reverts
    - _Requirements: 5.3, 5.14, 5.16_

- [x] 10. Implement cart page (`cart.html` + `js/cart-page.js`)
  - [x] 10.1 Build `cart.html` static skeleton: `<section class="cart-section">` with `<div id="cartContent">`; add `<script src="js/cart-page.js"></script>` as the fourth script
    - _Requirements: 6.1_

  - [x] 10.2 Create `js/cart-page.js` with `renderCart()` that reads `CartManager.getCart()`, renders cart rows (variant thumbnail, name, colour, size, unit price, qty stepper, line total, remove button) or empty-cart message with link to `shop.html`, and renders subtotal + "Proceed to Checkout" link; implement `wireCartEvents()` to attach qty stepper and remove-button handlers (each mutation calls `CartManager` API then `renderCart()` and `updateCartBadge()`); call `renderCart()` on `DOMContentLoaded`
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 13.2_

  - [x] 10.3 Write unit tests for cart page
    - Test that decrement to 0 removes the row from DOM and from `CartManager.getCart()`
    - Test that remove button removes the corresponding row
    - Test that subtotal equals sum of all line totals
    - Test that empty cart state hides subtotal and checkout button
    - _Requirements: 6.5, 6.6, 6.7, 6.9_

- [x] 11. Implement checkout flow (`checkout.html` + `js/checkout.js` + `checkout-success.html`)
  - [x] 11.1 Build `checkout.html` static skeleton: two-column `.checkout-layout` containing `<form id="checkoutForm" novalidate>` with seven labelled `<input>` fields (full name, street address, city, province, postal code, email, phone), each paired with a `<span class="field-error" aria-live="polite">` error span, and a `#placeOrderBtn`; aside `<div class="order-summary" aria-label="Order summary">` with `#summaryItems` and `#summarySubtotal`; add `<script src="js/checkout.js"></script>` as the fourth script
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 13.5_

  - [x] 11.2 Create `js/checkout.js`: on `DOMContentLoaded`, redirect to `cart.html` if cart is empty; render order summary from `CartManager.getCart()` (product name, colour, size, qty, line total, subtotal); implement `generateOrderNumber()` (returns `'ORD-' + 8-char alphanumeric`); implement form validation on submit (trim checks for text fields, email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, phone regex `^[\d\s+]{7,}$` with ≥7 digit chars); on valid submit: generate order number, write to `sessionStorage.setItem('sg_order_number', ...)`, call `CartManager.clearCart()`, redirect to `checkout-success.html`
    - _Requirements: 8.2, 8.6, 8.7, 8.8, 8.9_

  - [x] 11.3 Build `checkout-success.html` with confirmation section (star-burst element, `<h1>` confirmation, `<strong id="orderNumber">`, thank-you copy, "Continue Shopping" link to `shop.html`); add inline `<script>` that reads `sessionStorage.getItem('sg_order_number')` (fallback `'ORD-XXXXXXXX'`), writes to `#orderNumber`, removes the sessionStorage key, calls `CartManager.clearCart()` as safety net, and calls `updateCartBadge()`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 11.4 Write property test for order number format (Property 6)
    - **Property 6: Order Number Format** — for any call to `generateOrderNumber()`, the result matches `/^ORD-[A-Z0-9]{8}$/`
    - **Validates: Requirement 8.7**
    - Generate N ≥ 100 order numbers and assert each matches the regex
    - Tag: `// Feature: stargazing-ecommerce, Property 6: Order Number Format`

  - [x] 11.5 Write property tests for email and phone validation (Properties 7 and 8)
    - **Property 7: Email Validation Coverage** — for any string with exactly one `@`, non-whitespace before it, and a `.` with TLD after `@`, `validateEmail` returns `true`; strings without `@` or without `.` after `@` return `false`
    - **Validates: Requirement 8.8**
    - **Property 8: Phone Validation Coverage** — for any string of digits/spaces/`+` with ≥7 digit chars, `validatePhone` returns `true`; strings containing a letter or with <7 digits return `false`
    - **Validates: Requirement 8.9**
    - Use `fc.emailAddress()` for valid emails; use filtered `fc.string()` for invalid patterns
    - Tag: `// Feature: stargazing-ecommerce, Property 7: Email Validation Coverage`
    - Tag: `// Feature: stargazing-ecommerce, Property 8: Phone Validation Coverage`

  - [x] 11.6 Write unit tests for checkout page
    - Test redirect to `cart.html` when cart is empty on load
    - Test that submitting with empty required field shows inline error on that field and does not navigate
    - Test that `sessionStorage` receives the order number after successful submit and matches `ORD-` pattern
    - _Requirements: 8.2, 8.6, 8.7_

- [x] 12. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement remaining static pages (`about.html`, `404.html`)
  - [x] 13.1 Build `about.html` with brand narrative section addressing both audiences (kids who wish on stars, astronomy enthusiasts), a founder note / mission statement section; apply full brand design system (palette, typography, shared nav, shared footer, no page-specific JS)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 13.2 Build `404.html` with "lost in space" themed content: large `404` display headline, on-brand error message, night-sky CSS background (using CSS gradient pattern — no JS star generator needed), link back to `index.html`; include shared nav and footer; no page-specific JS
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 14. Accessibility and responsive polish
  - [x] 14.1 Audit all eight pages and ensure: all `<img>` elements have meaningful `alt` text (product images use `"{name} in {color}"` pattern, thumbnails use `"{color} variant"`, decorative SVGs use `aria-hidden="true"`); all swatch buttons have `aria-label="{color}"` and `aria-pressed`; all quantity steppers have `role="group"`, `aria-label`, and `aria-live="polite"` on the value span; marquee has `aria-hidden="true"` on its track; checkout `<label>` elements are associated with all inputs
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

  - [x] 14.2 Verify touch target minimum size (44×44px) for all interactive elements: swatch buttons wrapped with `padding: 8px`, size buttons, quantity stepper buttons, hamburger button; verify `.grid` collapses to 2 columns at ≤900px and 1 column at ≤560px; verify nav collapses to hamburger at ≤900px; verify `<meta name="viewport">` is present on every page
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 15. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP development
- The design mandates `var` (not `const`/`let`) for global variables in `products.js` and `cart.js` so they attach to `window` without a module bundler
- All asset paths must be relative (no absolute `/` paths) so the site opens via `file://` or any static host
- fast-check property tests require a Node.js environment and test runner (Jest recommended); they are separate from the browser runtime
- Each property test tags its source as `// Feature: stargazing-ecommerce, Property N: description`
- The `checkout.html` validation functions (`validateEmail`, `validatePhone`) should be factored as named functions so they can be imported/tested in isolation by the test suite

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "2.2"] },
    { "id": 2, "tasks": ["3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "5.1", "5.2"] },
    { "id": 4, "tasks": ["5.3", "5.4", "7.1", "9.1", "10.1", "11.1"] },
    { "id": 5, "tasks": ["6.1", "7.2", "9.2", "10.2", "11.2"] },
    { "id": 6, "tasks": ["6.2", "7.3", "7.4", "9.3", "9.4", "10.3", "11.3", "13.1", "13.2"] },
    { "id": 7, "tasks": ["11.4", "11.5", "11.6", "14.1", "14.2"] }
  ]
}
```
