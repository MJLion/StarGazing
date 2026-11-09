/**
 * products.js — StarGazing Product Catalog
 *
 * Global PRODUCTS array. Loaded via <script src="js/products.js"> before
 * cart.js and main.js so window.PRODUCTS is available to all subsequent scripts.
 *
 * Image paths include their file extension, so the browser loads each image
 * with a single request. resolveImagePath() returns such paths unchanged and
 * only falls back to probing .png/.jpg/.jpeg for a path without an extension.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

/**
 * resolveImagePath — returns a promise that resolves with a usable image URL.
 *
 * If the path already ends in an image extension it is returned as-is, with
 * no network requests. Otherwise (legacy extensionless paths, e.g. from a
 * cart saved before this change) it tries .png, .jpg and .jpeg and uses the
 * first that loads, falling back to the path + '.jpg'.
 *
 * @param {string} basePath — e.g. "images/products/saturn-wish-tee-black.png"
 * @returns {Promise<string>} resolved image URL
 */
function resolveImagePath(basePath) {
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(basePath)) {
    return Promise.resolve(basePath);
  }

  var extensions = ['png', 'jpg', 'jpeg'];
  var promises = extensions.map(function(ext) {
    return new Promise(function(resolve) {
      var img = new Image();
      var url = basePath + '.' + ext;
      img.onload = function() { resolve(url); };
      img.onerror = function() { resolve(null); };
      img.src = url;
    });
  });

  return Promise.all(promises).then(function(results) {
    for (var i = 0; i < results.length; i++) {
      if (results[i]) return results[i];
    }
    // Fallback if none found (prevents broken images)
    return basePath + '.jpg';
  });
}

var PRODUCTS = [

  /* 1 — Astronomy Edition */
  {
    id: "saturn-wish-tee",
    name: "Saturn Wish Tee",
    collection: "astronomy",
    price: 450,
    description: "Close your eyes and make a wish — Saturn is listening. This heavyweight tee puts the ringed giant front and centre in a vintage badge graphic, screen-printed in gold and teal on ultra-soft 100% cotton. Whether you're watching a meteor shower or just dreaming of deep space, the Saturn Wish Tee is the one you'll reach for first.",
    material: "100% cotton, 220 gsm, pre-shrunk",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { color: "Black", image: "images/products/saturn-wish-tee-black.png" },
      { color: "White", image: "images/products/saturn-wish-tee-white.png" }
    ]
  },

  /* 2 — Astronomy Edition */
  {
    id: "orbit-line-tee",
    name: "Orbit Line Tee",
    collection: "astronomy",
    price: 450,
    description: "Inspired by the clean geometry of planetary orbits, the Orbit Line Tee strips the solar system down to its purest form — concentric arcs in muted gold on a void-dark base. A quiet statement piece for the astronomer who doesn't need to shout. Wear it to a lecture, a late-night rooftop session, or absolutely nowhere in particular.",
    material: "100% cotton, 220 gsm, pre-shrunk",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { color: "Black", image: "images/products/orbit-line-tee-black.png" },
      { color: "White", image: "images/products/orbit-line-tee-white.jpg" }
    ]
  },

  /* 3 — Astronomy Edition (one-size cap, sizes: []) */
  {
    id: "telescope-patch-cap",
    name: "Telescope Patch Cap",
    collection: "astronomy",
    price: 320,
    description: "A five-panel cap for every stargazer who has ever stayed out past midnight chasing a clear sky. The embroidered telescope patch sits low on the front panel in gold thread, with a teal undervisor that casts a subtle cosmic tint on the world below. One size fits all — adjustable strap at the back.",
    material: "100% brushed cotton twill, embroidered patch, adjustable brass buckle strap",
    sizes: [],
    variants: [
      { color: "Black", image: "images/products/telescope-patch-cap-black.jpg" },
      { color: "Cream", image: "images/products/telescope-patch-cap-cream.jpg" }
    ]
  },

  /* 4 — Little Explorers */
  {
    id: "space-buddies-tee",
    name: "Space Buddies Tee",
    collection: "kids",
    price: 280,
    description: "Blast off with the whole crew! The Space Buddies Tee features a cast of cartoon astronauts, planets, and rocket ships in bright, playful colours that kids absolutely love. Printed on the softest ringspun cotton we could find, it survives every adventure — from the sandpit to the sofa and back again. A great gift for any little explorer with their head in the stars.",
    material: "100% ringspun cotton, 180 gsm, extra-soft finish",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { color: "Black", image: "images/products/space-buddies-tee-black.png" },
      { color: "Brown", image: "images/products/space-buddies-tee-brown.jpeg" }
    ]
  },

  /* 5 — Little Explorers */
  {
    id: "cool-planet-hoodie",
    name: "Cool Planet Hoodie",
    collection: "kids",
    price: 520,
    description: "Part cosy, part cosmic. The Cool Planet Hoodie wraps little adventurers in a mid-weight fleece with a big bold planet print across the chest — rings, moons, and all. The kangaroo pocket is deep enough for a small telescope (or a snack). Double-stitched cuffs and hem mean it holds up no matter how many galaxy-class missions are on the schedule.",
    material: "80% cotton, 20% polyester fleece, 300 gsm, double-stitched seams",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { color: "Rusty Grey",       image: "images/products/cool-planet-hoodie-rusty-grey.png" },
      { color: "Rusty Light Grey", image: "images/products/cool-planet-hoodie-rusty-light-grey.jpg" }
    ]
  },

  /* 6 — Little Explorers */
  {
    id: "moonwalker-onesie",
    name: "Moonwalker Onesie",
    collection: "kids",
    price: 310,
    description: "One small step for your little one, one giant leap in comfort. The Moonwalker Onesie is cut from buttery-soft organic cotton with a glow-in-the-dark moon and footprint print on the chest. Snap fastenings at the bottom make nappy changes painless, and the fold-over cuffs protect tiny hands during those first lunar expeditions. Perfect for bedtime, playtime, and everything in between.",
    material: "100% GOTS-certified organic cotton, 160 gsm, glow-in-the-dark print",
    sizes: ["S", "M", "L"],
    variants: [
      { color: "Pink", image: "images/products/moonwalker-onesie-pink.png" },
      { color: "Blue", image: "images/products/moonwalker-onesie-blue.png" }
    ]
  },

  /* 7 — Wish Edition */
  {
    id: "make-a-wish-tee",
    name: "Make A Wish Tee",
    collection: "wish",
    price: 495,
    description: "Every falling star is an invitation. The Make A Wish Tee pairs bold oversized lettering with a streak of rust-orange light cutting across the chest — a shooting star caught mid-flight. It's the signature piece of the Wish Edition: loud enough to start a conversation, meaningful enough to keep it going. Make your wish. Then wear it.",
    material: "100% heavyweight cotton, 240 gsm, water-based screen print",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { color: "Black", image: "images/products/make-a-wish-tee-black.png" },
      { color: "Rust",  image: "images/products/make-a-wish-tee-rust.jpeg"  }
    ]
  },

  /* 8 — Wish Edition */
  {
    id: "eye-of-saturn-tee",
    name: "Eye of Saturn Tee",
    collection: "wish",
    price: 495,
    description: "Look close enough at Saturn and it looks right back. The Eye of Saturn Tee reimagines the ringed planet as a single unblinking eye, rendered in dense, expressive line work that fills the entire front panel. Printed in off-white and rust on a void-black base, this is the most striking piece in the Wish Edition — a wearable cosmic gaze for those who aren't afraid to stand out.",
    material: "100% heavyweight cotton, 240 gsm, water-based screen print",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { color: "Black", image: "images/products/eye-of-saturn-tee-black.png" },
      { color: "White", image: "images/products/eye-of-saturn-tee-white.png" }
    ]
  },

  /* 9 — Wish Edition */
  {
    id: "drip-orbit-crew",
    name: "Drip Orbit Crew",
    collection: "wish",
    price: 650,
    description: "The Drip Orbit Crew is the heavyweight of the Wish Edition — a premium fleece crewneck with an all-over orbit graphic that wraps around the body in flowing rust and cream arcs. Midweight fleece keeps things comfortable across seasons, while the ribbed collar and cuffs add structure. This is the piece you wear when you want people to know exactly where your head is at: somewhere between Jupiter and a good playlist.",
    material: "60% cotton, 40% polyester fleece, 350 gsm, ribbed collar and cuffs",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { color: "Black", image: "images/products/drip-orbit-crew-black.jpg" }
    ]
  }

];

// CommonJS export guard — allows require() in Node.js/Jest while keeping
// var PRODUCTS and resolveImagePath on window in the browser
if (typeof module !== 'undefined') module.exports = { PRODUCTS: PRODUCTS, resolveImagePath: resolveImagePath };
