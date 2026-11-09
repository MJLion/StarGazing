# StarGazing Product Images Guide

## Image Folder Location
Place all product images in: `images/products/`

## Supported Formats
The app now automatically detects and supports:
- `.png`
- `.jpg`
- `.jpeg`

The system tries these extensions in order and uses the first one it finds.

## Astronomy Collection - Required Images

### Saturn Wish Tee
- `saturn-wish-tee-black.[png/jpg/jpeg]` ✅ (exists as .png)
- `saturn-wish-tee-white.[png/jpg/jpeg]` ✅ (exists as .png)

### Orbit Line Tee
- `orbit-line-tee-black.[png/jpg/jpeg]` ✅ (exists as .png)
- `orbit-line-tee-white.[png/jpg/jpeg]` ✅ (exists as .jpg)

### Telescope Patch Cap
- `telescope-patch-cap-black.[png/jpg/jpeg]`
- `telescope-patch-cap-cream.[png/jpg/jpeg]`

## Kids Collection - Required Images

### Space Buddies Tee
- `space-buddies-tee-black.[png/jpg/jpeg]` ✅ (exists as .png)
- `space-buddies-tee-brown.[png/jpg/jpeg]` ✅ (exists as .jpeg)

### Cool Planet Hoodie
- `cool-planet-hoodie-rusty-grey.[png/jpg/jpeg]` ✅ (exists as .png)
- `cool-planet-hoodie-rusty-light-grey.[png/jpg/jpeg]` ✅ (exists as .jpg)

### Moonwalker Onesie
- `moonwalker-onesie-pink.[png/jpg/jpeg]` ✅ (exists as .png)
- `moonwalker-onesie-blue.[png/jpg/jpeg]` ✅ (exists as .png)

## Wish Collection - Required Images

### Make A Wish Tee
- `make-a-wish-tee-black.[png/jpg/jpeg]`
- `make-a-wish-tee-rust.[png/jpg/jpeg]`

### Eye of Saturn Tee
- `eye-of-saturn-tee-black.[png/jpg/jpeg]`
- `eye-of-saturn-tee-white.[png/jpg/jpeg]`

### Drip Orbit Crew
- `drip-orbit-crew-black.[png/jpg/jpeg]` ✅ (exists as .jpg)
- (`drip-orbit-crew-rust.jpg` is still on disk but unused — the Rust colourway
  was removed because both of this product's photos are black.)

## Naming Convention
Format: `{product-id}-{color}.[png/jpg/jpeg]`

Multi-word colours are lower-cased and hyphenated.

Examples:
- `saturn-wish-tee-black.png`
- `orbit-line-tee-white.jpg`
- `cool-planet-hoodie-rusty-light-grey.jpg`
- `telescope-patch-cap-cream.jpeg`

## How It Works
The code automatically:
1. Tries to load the image with `.png` extension
2. If not found, tries `.jpg`
3. If not found, tries `.jpeg`
4. Uses whichever format exists

You can mix formats! Use `.png` for some products and `.jpg` for others.
