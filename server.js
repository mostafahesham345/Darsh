import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import clientsRoutes from './routes/clients.js';
import contractsRoutes from './routes/contracts.js';
import invoicesRoutes from './routes/invoices.js';
import projectsRoutes from './routes/projects.js';
import leadsRoutes from './routes/leads.js';
import reviewsRoutes from './routes/reviews.js';
import portalRoutes from './routes/portal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

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

app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin/clients', clientsRoutes);
app.use('/admin/contracts', contractsRoutes);
app.use('/admin/invoices', invoicesRoutes);
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
