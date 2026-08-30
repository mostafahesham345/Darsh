import express from 'express';
import session from 'express-session';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import clientsRoutes from './routes/clients.js';
import contractsRoutes from './routes/contracts.js';
import invoicesRoutes from './routes/invoices.js';
import quotesRoutes from './routes/quotes.js';
import projectsRoutes from './routes/projects.js';
import leadsRoutes from './routes/leads.js';
import reviewsRoutes from './routes/reviews.js';
import portalRoutes from './routes/portal.js';
import showcaseRoutes from './routes/showcase.js';
import * as seo from './lib/seo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

// EJS templates can't `import`, so the structured-data builder is handed to
// every view as a local. Without this the views fall back to a createRequire()
// workaround, which trips Node's ExperimentalWarning on each render.
app.locals.seo = seo;

// Gzip/Brotli every text response (HTML, CSS, JS, JSON). Must sit ahead of the
// static and route handlers so it can wrap their writes.
app.use(compression());

app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

app.use(
  session({
    name: 'darsh.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

// Showcase design library — dynamic design renderer runs BEFORE static so it
// owns /showcase/designs/* (other /showcase/* paths fall through to static).
app.use('/showcase', showcaseRoutes);

// Static cache policy. Asset filenames are unhashed (/css/landing.css,
// /images/…), so a long `immutable` cache would strand visitors on stale CSS
// after a deploy. Instead: a short freshness window plus ETag/Last-Modified
// revalidation, so an unchanged file costs a 304 instead of a full download and
// a changed one is picked up on the next conditional request. Media rarely gets
// edited in place and is the bulk of the bytes, so it gets a longer window.
// If asset names ever gain a content hash, these can move to max-age=31536000,
// immutable.
const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * ONE_HOUR;
const MEDIA_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm',
]);

const staticOptions = {
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    const maxAge = MEDIA_EXTENSIONS.has(path.extname(filePath).toLowerCase()) ? ONE_DAY : ONE_HOUR;
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, must-revalidate`);
  },
};

// Shared CSS mounts for the rendered designs.
const SHOWCASE_THEME = path.join(__dirname, 'public', 'showcase', 'theme');
app.use('/__cat_common', express.static(path.join(SHOWCASE_THEME, '_common'), staticOptions));
for (const layout of ['editorial-magazine', 'brutalist-grid', 'sidebar-fixed', 'fullscreen-scroll']) {
  app.use(`/__layout_${layout}`, express.static(path.join(SHOWCASE_THEME, 'layouts', layout), staticOptions));
}

app.use(express.static(path.join(__dirname, 'public'), staticOptions));

app.use('/admin/clients', clientsRoutes);
app.use('/admin/contracts', contractsRoutes);
app.use('/admin/invoices', invoicesRoutes);
app.use('/admin/quotes', quotesRoutes);
app.use('/admin/projects', projectsRoutes);
app.use('/admin/leads', leadsRoutes);
app.use('/admin/reviews', reviewsRoutes);
app.use('/admin', adminRoutes);
app.use('/portal', portalRoutes);
app.use('/', publicRoutes);

app.use((req, res) => {
  if (req.get('accept')?.includes('application/json')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).send('<pre>404 — Not found</pre>');
});

app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/admin') && req.get('accept')?.includes('application/json')) {
    return res.status(500).json({ error: err.message });
  }
  res.status(500).send(`<pre>${err.stack || err.message}</pre>`);
});

app.listen(port, () => {
  console.log(`[server] http://localhost:${port}/`);
  console.log(`[server] admin: http://localhost:${port}/admin`);
});
