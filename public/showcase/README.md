# Design Library — static site

A fully static showcase of **100 demo website designs** across 20
business categories. No server, no build step, no backend — just HTML, CSS, and
JavaScript. Every page's content is baked directly into its HTML.

## Run it

Any static file server works. For example:

```bash
cd site
python3 -m http.server 4000
# open http://localhost:4000
```

## Structure

```
site/
├── index.html                     ← landing gallery (links to every design)
├── assets/css/                    ← landing.css, common.css, layouts/*.css (shared)
└── designs/<category>/<design>/
    ├── index.html                 ← home page (content inlined)
    ├── menu.html                  ← menu / services / listings page
    ├── css/theme.css              ← this design's colors + theme
    └── js/main.js                 ← (coffee designs only) micro-interactions
```

Coffee designs are fully bespoke; every other category's 5 designs each use one
of 5 shared layout engines (classic-hero, editorial-magazine, brutalist-grid,
sidebar-fixed, fullscreen-scroll) with their own brand, palette, copy, images.

## Categories

- `coffee` — ☕ Coffee shops (5)
- `fastfood` — 🍔 Fast food (5)
- `bakery` — 🥐 Bakeries (5)
- `cardealership` — 🚗 Car dealerships (5)
- `barbershop` — ✂️ Barbers & salons (5)
- `icecream` — 🍦 Ice cream parlors (5)
- `bookstore` — 📚 Bookstores (5)
- `restaurant` — 🍽️ Restaurants (5)
- `pizzeria` — 🍕 Pizzerias (5)
- `sushi` — 🍣 Sushi & Japanese (5)
- `winery` — 🍷 Wineries & wine bars (5)
- `brewery` — 🍺 Breweries & taprooms (5)
- `juicebar` — 🥤 Juice & smoothie bars (5)
- `florist` — 🌸 Florists (5)
- `gym` — 🏋️ Gyms & fitness (5)
- `spa` — 🧖 Spas & wellness (5)
- `dental` — 🦷 Dental clinics (5)
- `lawfirm` — ⚖️ Law firms (5)
- `realestate` — 🏡 Real estate (5)
- `photography` — 📷 Photography studios (5)

## Notes

- Photos load from the Unsplash CDN; contact maps are live OpenStreetMap embeds.
  Both need an internet connection.
- Each design has its own favicon generated from the brand color.
- To regenerate after editing source data in `../drafts`: `node ../build/build-static.js`.
