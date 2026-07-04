/**
 * Showcase design renderer — serves the 100 demo designs dynamically from
 * consolidated data + shared EJS templates (ported from the coffee-draft
 * engine). Replaces ~305 static files with a handful of modules.
 *
 * Routes (mounted at /showcase):
 *   GET /designs/:cat/:id            → design home page
 *   GET /designs/:cat/:id/menu       → design menu / services page
 *   GET /designs/:cat/:id/css/style.css → that design's theme CSS
 *   GET /designs/:cat/:id/js/main.js    → (coffee only) micro-interactions
 */
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import categories from '../lib/showcase/registry.js';
import { designs } from '../lib/showcase/data.js';
import { themes, scripts } from '../lib/showcase/assets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIEWS = path.join(__dirname, '..', 'views', 'showcase');

const router = express.Router();

// Flatten the registry into a fast lookup of design metadata.
const meta = {};
for (const cat of categories) {
  for (const d of cat.designs) {
    meta[`${cat.id}/${d.id}`] = {
      cat: cat.id,
      id: d.id,
      layout: d.layout || 'classic-hero',
      theme: d.theme,
      name: d.name,
      bespoke: !!cat.perDesignViews,
    };
  }
}

function viewPath(m, page) {
  if (m.bespoke) return path.join(VIEWS, 'coffee', m.id, page === 'menu' ? 'menu.ejs' : 'index.ejs');
  if (page === 'menu') return path.join(VIEWS, '_common', 'menu.ejs');
  return path.join(VIEWS, 'layouts', m.layout, 'index.ejs');
}

// Per-brand SVG favicon as a data URI (mirrors build-static.js).
function faviconLink(brand = {}) {
  const ch = (brand.logoText || '•').slice(0, 1);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${brand.bg || '#111'}"/>` +
    `<text x="32" y="44" font-size="38" font-family="Georgia,serif" font-weight="700" text-anchor="middle" fill="${brand.accent || '#fff'}">${ch}</text>` +
    `</svg>`;
  return `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(svg)}" />`;
}

function rewrite(html, prefix, page) {
  // remove any admin / staff-login links (public showcase only)
  html = html.replace(/\s*<a[^>]*href="[^"]*\/admin[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
  // "← all drafts" / brand root link → the showcase landing
  html = html.split('href="/"').join('href="/showcase/"');
  // on the home page, same-page anchors should stay in-page
  if (page === 'index') html = html.split(`${prefix}/#`).join('#');
  return html;
}

async function renderDesign(req, res, next, page) {
  const key = `${req.params.cat}/${req.params.id}`;
  const m = meta[key];
  const d = designs[key];
  if (!m || !d) return next();
  const prefix = `/showcase/designs/${m.cat}/${m.id}`;
  const locals = {
    content: d.content,
    menu: d.menu,
    prefix,
    draftId: `${m.cat}_${m.id}`,
    theme: m.theme,
    category: m.cat,
    designName: m.name,
  };
  try {
    let html = await ejs.renderFile(viewPath(m, page), locals);
    html = html.replace('</head>', `  ${faviconLink(d.content.brand)}\n</head>`);
    html = rewrite(html, prefix, page);
    res.type('html').send(html);
  } catch (err) {
    next(err);
  }
}

router.get('/designs/:cat/:id', (req, res, next) => renderDesign(req, res, next, 'index'));
router.get('/designs/:cat/:id/menu', (req, res, next) => renderDesign(req, res, next, 'menu'));

router.get('/designs/:cat/:id/css/style.css', (req, res, next) => {
  const css = themes[`${req.params.cat}/${req.params.id}`];
  if (css == null) return next();
  res.type('css').send(css);
});

router.get('/designs/:cat/:id/js/main.js', (req, res, next) => {
  const js = scripts[`${req.params.cat}/${req.params.id}`];
  if (js == null) return next();
  res.type('js').send(js);
});

export default router;
