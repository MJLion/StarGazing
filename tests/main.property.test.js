// Feature: stargazing-ecommerce, Property 2: Night-Sky Star Count
// Validates: Requirements 3.2

'use strict';

const fc = require('fast-check');

// ── DOM stubs installed BEFORE requiring main.js ───────────────────────────
// main.js runs document.addEventListener('DOMContentLoaded', …) at the
// module top-level, so globals must exist before the first require().

/**
 * Creates a lightweight fake container that tracks appended children.
 */
function makeFakeContainer() {
  const children = [];
  return {
    appendChild(el) { children.push(el); },
    get appendedChildren() { return children; },
  };
}

/**
 * Creates a fake DOM element (enough for generateNightSky to manipulate).
 */
function makeFakeElement() {
  return {
    className: '',
    style: {},
  };
}

// Install minimal globals so main.js can be required without errors.
// We use a no-op getElementById here; tests override it per-run below.
global.document = {
  getElementById() { return null; },
  createElement()  { return makeFakeElement(); },
  addEventListener() {},        // silently absorb DOMContentLoaded registration
  querySelectorAll() { return []; },
};

global.window = {
  matchMedia() { return { matches: false }; },
};

// Now it is safe to load main.js.
const { generateNightSky } = require('../public/js/main.js');

// ── Per-run DOM helper ─────────────────────────────────────────────────────

/**
 * Installs a fresh fake container for the given containerId and returns it.
 * Also resets window.matchMedia to return matches:false (no reduced-motion).
 */
function freshContainer(containerId) {
  const container = makeFakeContainer();

  global.document.getElementById = function (id) {
    return id === containerId ? container : null;
  };
  global.document.createElement = function () {
    return makeFakeElement();
  };
  global.window.matchMedia = function () {
    return { matches: false };
  };

  return container;
}

// ── Property 2: Night-Sky Star Count ──────────────────────────────────────

describe('Property 2: Night-Sky Star Count', () => {

  test(
    'generateNightSky() appends between 60 and 70 .star elements (100 runs)',
    () => {
      fc.assert(
        // fc.integer() gives fast-check something to shrink/replay if needed;
        // the value itself is not passed to the function. Each run exercises
        // Math.random() independently, sampling the full 60-70 range.
        fc.property(fc.integer(), (_seed) => {
          const container = freshContainer('nightSky');

          generateNightSky('nightSky');

          const starCount = container.appendedChildren.filter(
            (el) => el.className === 'star'
          ).length;

          return starCount >= 60 && starCount <= 70;
        }),
        { numRuns: 100 }
      );
    }
  );

});
