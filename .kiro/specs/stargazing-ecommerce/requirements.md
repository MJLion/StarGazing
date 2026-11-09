# Requirements Document

## Introduction

StarGazing is a South African clothing brand selling mixed apparel (tees, hoodies, caps, kidswear) with a cosmic/astronomy theme and the tagline "Make a Wish." The brand targets two primary audiences: kids and astronomy enthusiasts. The e-commerce site must be a fully static, multi-page website (no backend, no build tools) built with HTML5, CSS3, and vanilla JavaScript. Product data is stored in a plain JavaScript file. Cart state persists via localStorage. Checkout is a mock flow ending in an order confirmation page. The visual identity draws from the existing mockup: a void navy-black cosmic palette, Bungee/Nunito/Space Mono typography, a Saturn badge emblem, and an animated night-sky hero. Three product collections are sold: Astronomy Edition (vintage badge style), Little Explorers (kids/cartoon), and Wish Edition (bold statement art).

---

## Glossary

- **Site**: The full multi-page StarGazing e-commerce website.
- **Product_Catalog**: The `products.js` file — a plain JavaScript array containing all product objects.
- **Cart**: The localStorage-backed cart object that persists across pages.
- **Cart_Manager**: The `cart.js` module responsible for all cart read/write operations against localStorage.
- **Nav**: The shared site navigation bar rendered on every page.
- **Night_Sky**: The animated hero background featuring twinkling stars and shooting stars.
- **Star_Fact_Widget**: The interactive "tap a star, get a fact" element.
- **Marquee**: The horizontally scrolling astronomy-fact ticker strip.
- **Badge_SVG**: The circular Saturn badge emblem used as the wordmark logo.
- **Color_Swatch**: A clickable UI control representing a product color variant.
- **Variant**: A specific combination of product color and associated product image path.
- **Size_Selector**: The size-picker UI control shown on product detail and added to cart line items.
- **Cart_Item**: A single line in the cart, identified by product ID + color + size combination.
- **Order_Summary**: The read-only recap of cart contents shown during checkout.
- **Mock_Order**: A simulated order with a generated order number — no real payment processing occurs.
- **Confirmation_Page**: The `checkout-success.html` page shown after a mock order is placed.
- **Collection**: One of three product groupings — Astronomy Edition, Little Explorers, Wish Edition.
- **ZAR**: South African Rand, the currency used for all prices (prefix: R).
- **Reduced_Motion**: The `prefers-reduced-motion: reduce` CSS media query for accessibility.

---

## Requirements

### Requirement 1: Product Catalog Data

**User Story:** As a developer, I want all product data to live in a single JavaScript file, so that the site works without a server, build tool, or network request.

#### Acceptance Criteria

1. THE Product_Catalog SHALL define a global JavaScript array named `PRODUCTS` containing one object per product.
2. WHEN a product object is read, THE Product_Catalog SHALL expose at minimum: `id`, `name`, `collection`, `price`, `description`, `material`, `sizes`, and `variants` fields.
3. THE Product_Catalog SHALL define a `variants` field as an array of objects, each containing a `color` label and an `image` path.
4. THE Product_Catalog SHALL include all nine products: Saturn Wish Tee (R450), Orbit Line Tee (R450), Telescope Patch Cap (R320), Space Buddies Tee (R280), Cool Planet Hoodie (R520), Moonwalker Onesie (R310), Make A Wish Tee (R495), Eye of Saturn Tee (R495), and Drip Orbit Crew (R650).
5. THE Product_Catalog SHALL assign each product to exactly one of three collections: `astronomy`, `kids`, or `wish`.
6. WHEN the `sizes` field is present and non-empty, THE Product_Catalog SHALL list valid size options as an array of strings (e.g., `["XS","S","M","L","XL"]`).
7. WHEN a product has no applicable size (e.g., a one-size cap), THE Product_Catalog SHALL set the `sizes` field to an empty array.

---

### Requirement 2: Shared Navigation

**User Story:** As a shopper, I want a consistent navigation bar on every page, so that I can move between sections and check my cart without losing my place.

#### Acceptance Criteria

1. THE Nav SHALL appear on every page of the Site.
2. THE Nav SHALL display the Badge_SVG logo, the brand name "STARGAZING", links to Shop, About, and Cart pages, and a live cart item-count badge.
3. WHEN the cart contains one or more items, THE Nav SHALL display the total item count in a visible badge adjacent to the Cart link.
4. WHEN the cart is empty, THE Nav SHALL hide the item-count badge.
5. WHEN a shopper resizes the viewport below 900px, THE Nav SHALL collapse the page links into a hamburger menu toggle button.
6. WHEN the hamburger toggle is activated, THE Nav SHALL expand a mobile menu showing all page links.
7. WHEN the hamburger toggle is activated again while the mobile menu is open, THE Nav SHALL close the mobile menu.
8. THE Nav SHALL position itself fixed at the top of the viewport on all pages.
9. THE Nav SHALL apply `aria-label="Main navigation"` to the `<nav>` element.
10. WHEN keyboard focus reaches the hamburger toggle, THE Nav SHALL display a visible focus outline.

---

### Requirement 3: Home Page

**User Story:** As a first-time visitor, I want an engaging landing page that communicates the brand identity and directs me to the right collection, so that I can quickly find products for my interests.

#### Acceptance Criteria

1. THE Site SHALL serve a home page at `index.html`.
2. WHEN `index.html` loads, THE Night_Sky SHALL render 60–70 twinkling stars at randomised positions within the hero section, each with a randomised animation delay.
3. WHEN `index.html` loads, THE Night_Sky SHALL render 6 shooting stars with randomised position, width, delay, and duration, each animating in a south-west direction (down-left diagonal).
4. WHEN `prefers-reduced-motion` is `reduce`, THE Night_Sky SHALL display stars at a fixed low opacity without animation, and SHALL hide all shooting stars.
5. THE Site SHALL render the Badge_SVG prominently in the hero section above the headline.
6. THE Site SHALL display the headline "Apparel for anyone who's ever looked up" with the phrase "looked up" in gold accent colour `#f2b632`.
7. THE Site SHALL display two CTA buttons in the hero: "Shop Little Explorers" linking to `shop.html?collection=kids` and "Shop Astronomy Edition" linking to `shop.html?collection=astronomy`.
8. WHEN the hero CTA buttons receive keyboard focus, THE Site SHALL display a visible focus outline.
9. THE Marquee SHALL scroll a repeating strip of astronomy facts horizontally across the full viewport width below the hero.
10. WHEN `prefers-reduced-motion` is `reduce`, THE Marquee SHALL stop scrolling and display its content statically.
11. THE Site SHALL display a preview grid of three Collection cards — one per collection — each linking to the shop page filtered to that collection.
12. THE Site SHALL render the Star_Fact_Widget with at least 6 tappable star buttons, each carrying a unique astronomy fact in a `data-fact` attribute.
13. WHEN a shopper clicks a star button in the Star_Fact_Widget, THE Site SHALL reveal the fact text in an `aria-live="polite"` region below the starfield.
14. WHEN a shopper clicks a different star button, THE Site SHALL replace the previously shown fact with the new fact.
15. THE Site SHALL display a brand story teaser section with a headline and two paragraphs of copy.
16. THE Site SHALL display a footer containing the Badge_SVG, three navigation columns (Shop / Brand / Follow), and a copyright line.

---

### Requirement 4: Shop Page

**User Story:** As a shopper, I want to browse all products in one place and filter by collection or sort by price, so that I can find what I'm looking for quickly.

#### Acceptance Criteria

1. THE Site SHALL serve the shop page at `shop.html`.
2. WHEN `shop.html` loads, THE Site SHALL display all products in a responsive grid with collection-themed card styling matching the brand identity.
3. WHEN the URL contains a `collection` query parameter, THE Site SHALL pre-filter the displayed products to that collection on load.
4. THE Site SHALL provide filter controls allowing shoppers to select one collection (`astronomy`, `kids`, `wish`) or view all products.
5. WHEN a shopper selects a filter, THE Site SHALL update the product grid immediately to show only matching products without a full page reload.
6. THE Site SHALL provide a sort control with options: default order, price ascending, and price descending.
7. WHEN a shopper selects a sort option, THE Site SHALL re-render the product grid in the selected order without a full page reload.
8. EACH product card in the grid SHALL display: the primary variant image (or a placeholder SVG), the product name, the price in ZAR, and a row of Color_Swatches.
9. WHEN a shopper hovers or clicks a Color_Swatch on a product card, THE Site SHALL swap the card's displayed thumbnail image to the image path defined for that variant.
10. WHEN a shopper clicks anywhere on a product card (excluding swatch clicks), THE Site SHALL navigate to `product.html?id={product-id}`.
11. THE Site SHALL apply visually distinct card styling per collection: gold/teal accents for Astronomy Edition, neon pink accents for Little Explorers, and rust-orange accents for Wish Edition.

---

### Requirement 5: Product Detail Page

**User Story:** As a shopper, I want to see full product details and choose my preferred options before adding to my cart, so that I can make a confident purchase.

#### Acceptance Criteria

1. THE Site SHALL serve the product detail page at `product.html`.
2. WHEN `product.html` loads with a valid `id` query parameter, THE Site SHALL read the matching product from the Product_Catalog and render its details.
3. IF the `id` query parameter is missing or matches no product, THEN THE Site SHALL redirect to `404.html`.
4. THE Site SHALL display a large primary product image, a row of thumbnail images (one per variant), product name, price in ZAR, a description paragraph, and a material/fabric info line.
5. THE Site SHALL display a row of Color_Swatches — one per variant — with the active swatch visually distinguished.
6. WHEN a shopper clicks a Color_Swatch, THE Site SHALL update the primary image to that variant's image path and update a visible "selected colour" label, without resetting the size or quantity selection.
7. WHEN a shopper clicks a thumbnail, THE Site SHALL update the primary image to the corresponding variant image.
8. WHEN the product has a non-empty `sizes` array, THE Site SHALL display a Size_Selector showing all available sizes.
9. WHEN a shopper selects a size, THE Site SHALL visually mark the selected size and update the internal selection state.
10. THE Site SHALL display a quantity stepper with decrement (−) and increment (+) controls, defaulting to 1.
11. WHEN the quantity is 1, THE Site SHALL disable the decrement control.
12. THE Site SHALL display an "Add to Cart" button.
13. WHEN a shopper clicks "Add to Cart", THE Site SHALL add a Cart_Item to the Cart with the selected product ID, color variant, size (if applicable), quantity, and price.
14. WHEN a shopper clicks "Add to Cart", THE Site SHALL display a brief confirmation state on the button (e.g., changing label to "Added ✓") for 1500ms before reverting to its original label.
15. WHEN the "Add to Cart" button is in confirmation state, THE Site SHALL update the nav cart badge count immediately.
16. WHEN a shopper clicks "Add to Cart" without selecting a required size, THE Site SHALL display an inline error message prompting size selection, and SHALL NOT add the item to the Cart.

---

### Requirement 6: Cart Page

**User Story:** As a shopper, I want to review everything in my cart and adjust quantities before checking out, so that I can make sure my order is correct.

#### Acceptance Criteria

1. THE Site SHALL serve the cart page at `cart.html`.
2. WHEN `cart.html` loads, THE Site SHALL read Cart_Items from localStorage and render each as a row.
3. EACH Cart_Item row SHALL display: the variant thumbnail image matching the chosen colour, product name, selected colour label, selected size (if applicable), unit price in ZAR, a quantity stepper, a line total in ZAR, and a remove button.
4. WHEN a shopper increments or decrements quantity in the cart, THE Cart_Manager SHALL update localStorage and THE Site SHALL re-render the affected row's quantity and line total, and update the cart subtotal.
5. WHEN a shopper sets a quantity to 0 via the decrement control, THE Cart_Manager SHALL remove the Cart_Item from the Cart and THE Site SHALL remove the row from the display.
6. WHEN a shopper clicks the remove button on a row, THE Cart_Manager SHALL remove that Cart_Item and THE Site SHALL remove the row from the display.
7. THE Site SHALL display a cart subtotal that equals the sum of all line totals, updated whenever the cart changes.
8. THE Site SHALL display a "Proceed to Checkout" button that links to `checkout.html`.
9. WHEN the cart is empty, THE Site SHALL hide the subtotal and "Proceed to Checkout" button, and SHALL display an empty-cart message with a link back to `shop.html`.

---

### Requirement 7: Cart Persistence

**User Story:** As a shopper, I want my cart to survive page navigation and browser refresh, so that I don't lose items I've chosen.

#### Acceptance Criteria

1. THE Cart_Manager SHALL store the cart as a JSON-serialised array in localStorage under the key `"stargazing_cart"`.
2. WHEN a Cart_Item is added, updated, or removed, THE Cart_Manager SHALL immediately write the updated cart array to localStorage.
3. WHEN any page of the Site loads, THE Cart_Manager SHALL read the cart array from localStorage and initialise the in-memory cart state.
4. WHEN localStorage is unavailable (e.g., private browsing with storage blocked), THE Cart_Manager SHALL fall back to an in-memory cart for the session without throwing an unhandled error.
5. THE Cart_Manager SHALL expose functions: `getCart()`, `addItem(item)`, `updateQuantity(id, color, size, qty)`, and `removeItem(id, color, size)`.

---

### Requirement 8: Checkout Page

**User Story:** As a shopper, I want to enter my shipping details and review my order before placing it, so that I feel confident the right items will be sent to the right place.

#### Acceptance Criteria

1. THE Site SHALL serve the checkout page at `checkout.html`.
2. WHEN `checkout.html` loads with an empty cart, THE Site SHALL redirect to `cart.html`.
3. THE Site SHALL display a shipping details form with fields: full name, street address, city, province/state, postal code, email address, and phone number.
4. THE Site SHALL display an Order_Summary as a read-only recap of all Cart_Items, showing product name, chosen colour, size, quantity, and line total for each item, plus the overall subtotal.
5. THE Site SHALL display a "Place Order" button.
6. WHEN a shopper clicks "Place Order" with one or more required form fields empty or invalid, THE Site SHALL display inline validation error messages on the failing fields and SHALL NOT proceed.
7. WHEN a shopper clicks "Place Order" with all required fields valid, THE Site SHALL generate a Mock_Order with a randomised order number and navigate to `checkout-success.html`, passing the order number via sessionStorage or URL parameter.
8. THE Site SHALL validate the email field against a standard email pattern.
9. THE Site SHALL validate the phone field to contain only digits, spaces, and the `+` character, with a minimum of 7 digits.

---

### Requirement 9: Checkout Confirmation Page

**User Story:** As a shopper, I want to see a clear confirmation after placing my order, so that I know everything went through and feel good about my purchase.

#### Acceptance Criteria

1. THE Site SHALL serve the checkout confirmation page at `checkout-success.html`.
2. WHEN `checkout-success.html` loads, THE Site SHALL display a confirmation message, the Mock_Order number, and a "Make a Wish" themed thank-you note.
3. WHEN `checkout-success.html` loads, THE Cart_Manager SHALL clear all Cart_Items from the Cart and update localStorage.
4. WHEN `checkout-success.html` loads, THE Nav cart badge SHALL reflect the now-empty cart (hidden or zero).
5. THE Site SHALL display a link inviting the shopper to continue shopping, linking back to `shop.html`.

---

### Requirement 10: About Page

**User Story:** As a curious visitor, I want to read the brand story, so that I understand who StarGazing is for and why it exists.

#### Acceptance Criteria

1. THE Site SHALL serve the about page at `about.html`.
2. THE Site SHALL display a brand narrative that addresses both target audiences: children who wish on stars, and astronomy enthusiasts who study them.
3. THE Site SHALL include a founder note or mission statement section.
4. THE Site SHALL apply the full brand design system (colour palette, typography, nav, footer) consistent with all other pages.

---

### Requirement 11: 404 Page

**User Story:** As a visitor who reaches a broken or mistyped URL, I want an on-brand "lost in space" error page, so that I know I've gone off course and can find my way back.

#### Acceptance Criteria

1. THE Site SHALL provide a custom error page at `404.html`.
2. THE `404.html` page SHALL display a "lost in space" themed message with the Site's brand identity (palette, typography, Night_Sky or similar cosmic background).
3. THE `404.html` page SHALL provide a link back to `index.html`.
4. THE `404.html` page SHALL include the shared Nav and footer.

---

### Requirement 12: Responsive Layout

**User Story:** As a shopper on any device, I want the site to work well on my screen size, so that I can browse and purchase comfortably whether I'm on a phone, tablet, or desktop.

#### Acceptance Criteria

1. THE Site SHALL use a fluid layout with CSS Grid and/or Flexbox that reflows for screen widths from 320px to 2560px.
2. WHEN the viewport width is 900px or below, THE Site SHALL collapse the product grid to two columns.
3. WHEN the viewport width is 560px or below, THE Site SHALL collapse the product grid to one column.
4. WHEN the viewport width is 900px or below, THE Nav SHALL hide the desktop link list and show the hamburger toggle.
5. THE Site SHALL set `<meta name="viewport" content="width=device-width, initial-scale=1.0">` on every page.
6. THE Site SHALL ensure all touch targets (buttons, swatches, links) have a minimum tap size of 44×44px on mobile.

---

### Requirement 13: Accessibility

**User Story:** As a shopper who uses a keyboard or assistive technology, I want the site to be navigable without a mouse, so that I can browse and buy without barriers.

#### Acceptance Criteria

1. THE Site SHALL provide a visible `:focus-visible` outline on all interactive elements (links, buttons, inputs, swatches, quantity steppers).
2. THE Site SHALL include meaningful `alt` text on all `<img>` elements; decorative images SHALL use `alt=""`.
3. THE Nav cart badge SHALL be wrapped in an `aria-live="polite"` region so screen readers announce count changes.
4. THE Star_Fact_Widget fact output element SHALL carry `aria-live="polite"` so screen readers announce revealed facts.
5. THE Site SHALL associate all form inputs on the checkout page with visible `<label>` elements.
6. THE Marquee SHALL include `aria-hidden="true"` on its animated track element and provide equivalent content in a visually hidden manner, OR the marquee content shall be purely supplementary and not contain information required for purchasing.
7. THE Site SHALL not rely on colour alone to convey information (e.g., active swatches and selected sizes SHALL also use shape, border, or icon differentiation).
8. THE Site SHALL apply appropriate `role` and `aria-label` attributes to custom UI components (e.g., swatch groups, quantity steppers, mobile nav toggle).

---

### Requirement 14: Visual Design System

**User Story:** As a brand owner, I want every page to consistently express the StarGazing brand identity, so that the site feels cohesive and professional.

#### Acceptance Criteria

1. THE Site SHALL define CSS custom properties for the full colour palette: `--void: #0d0e1a`, `--void-deep: #07070f`, `--gold: #f2b632`, `--teal: #1f7a72`, `--rust: #e0502a`, `--cream: #f5efe0`, and `--dim: #9a97b0`.
2. THE Site SHALL load Bungee (display/headlines), Nunito (body copy), and Space Mono (labels, prices, utility text) from Google Fonts on every page.
3. THE Site SHALL apply the three kids-section accent colours (`#ff3ea5` pink, `#00c2ff` blue, `#8b5cf6` purple) exclusively within the Little Explorers collection scope and SHALL NOT apply them to Nav or footer elements.
4. THE Badge_SVG SHALL feature: an outer circle border in gold, an arched "STARGAZING" textPath along the top in Bungee, a stipple-textured Saturn planet at centre, a "MAKE A WISH" tagline in Space Mono below the planet, and at least 4 sparkle/starburst accents.
5. THE Night_Sky hero animation SHALL include stars with a pulsing opacity `twinkle` keyframe and shooting stars using a `translate` + `rotate(135deg)` transform animating in a south-west direction.
6. THE Site SHALL define a single shared `css/style.css` file imported by all pages.
7. WHERE a section hosts Little Explorers products, THE Site SHALL apply a neon-accent visual treatment (pink border glow, pink price colour) locally without leaking into global chrome.

---

### Requirement 15: File Structure and Static Hosting Compatibility

**User Story:** As a developer, I want the site to run by simply opening `index.html` or serving the folder statically, so that there is zero setup friction.

#### Acceptance Criteria

1. THE Site SHALL consist solely of `.html`, `.css`, `.js`, image, and font files — no build tool output, no server-side code.
2. THE Product_Catalog SHALL be loaded via a `<script src="js/products.js">` tag before any script that references `PRODUCTS`, making the array available as a global variable without `fetch`.
3. THE Site SHALL share one `css/style.css` and split JavaScript into at minimum: `js/products.js` (data), `js/cart.js` (cart logic), and `js/main.js` (nav, night sky, marquee, star-fact widget).
4. THE Site SHALL reference all assets (CSS, JS, images) using relative paths so the site works from any directory or static host.
5. IF a page requires product data, THEN THE Site SHALL load `js/products.js` before `js/cart.js` and `js/main.js` in the `<script>` tag order.
