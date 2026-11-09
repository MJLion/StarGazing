/**
 * main.js — StarGazing Shared UI Utilities
 *
 * Responsibilities:
 *  1. updateCartBadge()  — reads CartManager.getTotalItems(), shows/hides #cartBadge
 *  2. Hamburger toggle   — wires #hamburger click to toggle .nav-open on #navLinks
 *  3. Star-fact widget   — .wish-star click → update #wishFact with reflow trick
 *  4. generateNightSky() — creates twinkling .star and .shooting-star elements
 *
 * Runs in browser context. CartManager is already on window via cart.js.
 * Uses var throughout (no modules, no const/let).
 *
 * Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 3.2, 3.3, 3.4, 3.13, 3.14
 */

// ─── Cart Badge ───────────────────────────────────────────────────────────────

/**
 * updateCartBadge — reads the total item count from CartManager and
 * updates the #cartBadge element visibility and text accordingly.
 * Safe to call when #cartBadge is absent (returns early).
 */
function updateCartBadge() {
  var badge = document.getElementById('cartBadge');
  if (!badge) return;
  var count = CartManager.getTotalItems();
  var prevCount = parseInt(badge.textContent, 10) || 0;
  badge.textContent = count > 0 ? count : '';
  badge.style.display = count > 0 ? 'inline-flex' : 'none';

  // Bump animation when the count increases
  if (count > prevCount) {
    badge.classList.remove('bump');
    void badge.offsetWidth; // force reflow to restart animation
    badge.classList.add('bump');
  }
}

// ─── DOMContentLoaded Bootstrap ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {

  // ── 1. Cart badge (initial state) ──────────────────────────────────────────
  updateCartBadge();

  // ── 2. Hamburger toggle ────────────────────────────────────────────────────
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // ── 3. Star-fact widget ────────────────────────────────────────────────────
  var wishStars = document.querySelectorAll('.wish-star');
  wishStars.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById('wishFact');
      if (!el) return;
      el.textContent = btn.dataset.fact;
      el.classList.remove('show');
      void el.offsetWidth; // force reflow to restart CSS transition
      el.classList.add('show');
    });
  });

  // ── 4. Night-sky generator ─────────────────────────────────────────────────
  generateNightSky('nightSky');

  // ── 5. Scroll-reveal animations ────────────────────────────────────────────
  initScrollReveal();

  // ── 6. Nav scroll state (adds shadow/solid bg once page scrolls) ──────────
  initNavScrollState();

  // ── 7. Button ripple / magnetic press feedback ─────────────────────────────
  initButtonFeedback();

  // ── 8. Page load fade-in ───────────────────────────────────────────────────
  document.body.classList.add('page-loaded');

  // ── 8b. Cosmic loader (asteroid fly-by, hidden once assets finish loading) ─
  initCosmicLoader();

  // ── 9. Footer copyright year (keeps the © year current) ────────────────────
  var yearEls = document.querySelectorAll('.footer-year');
  var thisYear = String(new Date().getFullYear());
  yearEls.forEach(function (el) { el.textContent = thisYear; });

});

// ─── Cosmic Loader ────────────────────────────────────────────────────────────

/**
 * initCosmicLoader — shows the #cosmicLoader asteroid overlay only while
 * page assets are still loading. The overlay is hidden by default (CSS);
 * it is revealed only if window "load" hasn't fired SHOW_DELAY_MS after
 * navigation started, so fast/cached loads never flash it. As soon as
 * "load" fires the overlay fades out. A safety timeout hides it anyway
 * if a hung request keeps "load" from firing.
 * Safe to call when #cosmicLoader is absent (returns early).
 */
function initCosmicLoader() {
  var loader = document.getElementById('cosmicLoader');
  if (!loader) return;

  var SHOW_DELAY_MS = 300;  // don't show for loads faster than this
  var MAX_WAIT_MS = 8000;   // safety net for hung/blocked assets
  var FADE_MS = 400;        // matches .cosmic-loader opacity transition

  var loaded = false;
  var showTimer = null;

  // Already loaded (e.g. restored from cache) — nothing to show
  if (document.readyState === 'complete') return;

  var hideLoader = function () {
    if (loaded) return;
    loaded = true;
    clearTimeout(showTimer);
    if (!loader.classList.contains('loader-active')) return; // never shown

    loader.classList.add('loader-hidden'); // also pauses all loader animations
    setTimeout(function () {
      loader.classList.remove('loader-active');
    }, FADE_MS);
  };

  // Measure from navigation start, not from when this script ran
  var sinceNav = (window.performance && performance.now) ? performance.now() : 0;
  showTimer = setTimeout(function () {
    if (!loaded) loader.classList.add('loader-active');
  }, Math.max(0, SHOW_DELAY_MS - sinceNav));

  window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, MAX_WAIT_MS);
}

// ─── Night-Sky Generator ──────────────────────────────────────────────────────

/**
 * generateNightSky — creates twinkling star and shooting-star elements
 * inside the container element identified by containerId.
 *
 * Stars:          60–70 elements (class "star"), skipped animation if
 *                 prefers-reduced-motion is active (static low opacity instead).
 * Shooting stars: exactly 6 elements (class "shooting-star"), skipped
 *                 entirely if prefers-reduced-motion is active.
 *
 * @param {string} containerId — id of the container element
 */
function generateNightSky(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Stars ──────────────────────────────────────────────────────────────────
  var starCount = reducedMotion ? 65 : Math.floor(Math.random() * 11) + 60; // 60–70 inclusive

  for (var i = 0; i < starCount; i++) {
    var star = document.createElement('div');
    star.className = 'star';

    var size = Math.random() * 2 + 1; // 1–3 px
    star.style.position        = 'absolute';
    star.style.width           = size + 'px';
    star.style.height          = size + 'px';
    star.style.top             = Math.random() * 100 + '%';
    star.style.left            = Math.random() * 100 + '%';
    star.style.borderRadius    = '50%';
    star.style.backgroundColor = '#f5efe0';

    if (reducedMotion) {
      star.style.opacity = '0.3';
    } else {
      star.style.animationName            = 'twinkle';
      star.style.animationDelay          = (Math.random() * 3.6).toFixed(3) + 's';
      star.style.animationDuration       = (Math.random() * 2.5 + 2.5).toFixed(3) + 's'; // 2.5–5s
      star.style.animationIterationCount = 'infinite';
    }

    container.appendChild(star);
  }

  // ── Shooting Stars (skipped entirely if reduced-motion) ───────────────────
  if (reducedMotion) return;

  for (var j = 0; j < 6; j++) {
    var shoot = document.createElement('div');
    shoot.className = 'shooting-star';

    shoot.style.position              = 'absolute';
    shoot.style.width                 = (Math.floor(Math.random() * 61) + 60) + 'px'; // 60–120 px
    shoot.style.height                = '2px';
    shoot.style.top                   = (Math.random() * 55).toFixed(2) + '%';        // 0–55%
    shoot.style.left                  = (Math.random() * 40 + 55).toFixed(2) + '%';   // 55–95%
    shoot.style.animationName         = 'shoot';
    shoot.style.animationDelay        = (Math.random() * 8).toFixed(3) + 's';         // 0–8s
    shoot.style.animationDuration     = (Math.random() * 3 + 4).toFixed(3) + 's';    // 4–7s
    shoot.style.animationIterationCount = 'infinite';
    shoot.style.transform             = 'rotate(135deg)';

    container.appendChild(shoot);
  }
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────

/**
 * initScrollReveal — observes elements marked with [data-reveal] and adds
 * the "revealed" class when they enter the viewport, triggering a CSS
 * fade+rise transition. Falls back to revealing everything immediately
 * when IntersectionObserver is unavailable or prefers-reduced-motion is set.
 *
 * Also auto-tags common content blocks (cards, section heads, etc.) that
 * don't already carry a data-reveal attribute, so existing markup benefits
 * without needing HTML changes on every page.
 */
function initScrollReveal() {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-tag elements that should reveal on scroll
  var autoSelectors = [
    '.section-head', '.collection-card', '.card', '.split-text', '.split-visual',
    '.audience-card', '.value-item', '.founder-inner', '.starfield',
    '.wish-fact', '.story-badge', '.mission-card'
  ];
  var candidates = document.querySelectorAll(autoSelectors.join(','));
  candidates.forEach(function (el, i) {
    if (!el.hasAttribute('data-reveal')) {
      el.setAttribute('data-reveal', '');
      // Stagger children within the same grid-ish group using nth-of-type order
      el.style.setProperty('--reveal-delay', Math.min((i % 6) * 70, 350) + 'ms');
    }
  });

  var items = document.querySelectorAll('[data-reveal]');

  if (reducedMotion || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('revealed'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach(function (el) { observer.observe(el); });
}

// ─── Nav Scroll State ─────────────────────────────────────────────────────────

/**
 * initNavScrollState — toggles a "scrolled" class on <nav> once the page
 * has scrolled past a small threshold, letting CSS swap the nav from a
 * transparent gradient to a solid, elevated glass bar.
 */
function initNavScrollState() {
  var nav = document.querySelector('nav');
  if (!nav) return;

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ─── Button Feedback (ripple) ─────────────────────────────────────────────────

/**
 * initButtonFeedback — adds a lightweight pointer-position ripple effect
 * to .btn, .filter-btn, and .collection-card elements via CSS variables,
 * so hover glow follows the cursor. Skipped under prefers-reduced-motion.
 */
function initButtonFeedback() {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  var targets = document.querySelectorAll('.btn, .collection-card, .card, .audience-card');
  targets.forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var rect = el.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    });
  });
}

// Node.js / CommonJS export for testing (no-op in browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateCartBadge: updateCartBadge,
    generateNightSky: generateNightSky,
    initScrollReveal: initScrollReveal,
    initNavScrollState: initNavScrollState,
    initButtonFeedback: initButtonFeedback
  };
}
