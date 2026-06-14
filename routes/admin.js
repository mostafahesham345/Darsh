import { Router } from 'express';
import multer from 'multer';
import { requireAdmin, requireAdminJson, redirectIfAuthed } from '../lib/auth.js';
import {
  getSection,
  getAllSections,
  saveSection,
  sectionKeys,
  defaults,
} from '../lib/content.js';
import { uploadBuffer } from '../lib/upload.js';
import { isReady, getInitError } from '../lib/firebase.js';
import { getStats } from '../lib/analytics.js';
import {
  countNewLeads, countPendingReviews,
  listInvoices, listProjects, listClients, listContracts, listLeads, listReviews,
  invoiceTotal, PROJECT_STAGES,
} from '../lib/business.js';
import { money } from '../lib/mail.js';

const router = Router();
const ALLOWED_IMAGE_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon',
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files (PNG, JPEG, WebP, GIF, SVG, ICO) are allowed.'));
  },
});

const VALID_SECTIONS = new Set([
  'meta', 'nav', 'hero', 'ticker', 'services', 'process', 'why', 'work', 'contact', 'footer',
]);

/* ---------- Auth ---------- */
router.get('/login', redirectIfAuthed, (req, res) => {
  res.render('admin/login', { error: null });
});

router.post('/login', redirectIfAuthed, (req, res) => {
  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    return res.status(500).render('admin/login', {
      error: 'Admin credentials are not configured in .env (ADMIN_EMAIL / ADMIN_PASSWORD).',
    });
  }
  if ((email || '').trim().toLowerCase() === adminEmail.trim().toLowerCase() && password === adminPassword) {
    req.session.admin = { email: adminEmail, since: Date.now() };
    return res.redirect('/admin');
  }
  return res.status(401).render('admin/login', { error: 'Wrong email or password.' });
});

router.post('/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

/* ---------- Dashboard ---------- */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const stats = await getStats();
    const newLeads = await countNewLeads();
    const pendingReviews = await countPendingReviews();
    res.render('admin/dashboard', {
      stats,
      newLeads,
      pendingReviews,
      firebaseReady: isReady(),
      firebaseError: getInitError()?.message || null,
      adminEmail: req.session.admin.email,
    });
  } catch (err) {
    next(err);
  }
});

/* ---------- Business analytics ---------- */
router.get('/analytics', requireAdmin, async (req, res, next) => {
  try {
    const [invoices, projects, clients, contracts, leads, reviews] = await Promise.all([
      listInvoices(), listProjects(), listClients(), listContracts(), listLeads(), listReviews(),
    ]);

    // --- Revenue ---
    let collected = 0, outstanding = 0, paidCount = 0, unpaidCount = 0;
    invoices.forEach((inv) => {
      const t = invoiceTotal(inv);
      if (inv.status === 'paid') { collected += t; paidCount += 1; }
      else { outstanding += t; unpaidCount += 1; }
    });
    const totalInvoiced = collected + outstanding;
    const taxRate = Math.max(0, Math.min(60, Number(req.query.taxRate) || Number(process.env.TAX_RATE_ESTIMATE) || 25));
    const estTax = collected * (taxRate / 100);
    const afterTax = collected - estTax;

    // --- Projects ---
    const completedProjects = projects.filter((p) => p.stage === 'done').length;
    const pendingProjects = projects.filter((p) => p.stage === 'discovery').length;
    const activeProjects = projects.filter((p) => p.stage !== 'done' && p.stage !== 'discovery').length;
    const projectsByStage = PROJECT_STAGES.map((s) => ({
      label: s.label, key: s.key, count: projects.filter((p) => p.stage === s.key).length,
    }));

    // --- Pipeline ---
    const contractsSigned = contracts.filter((c) => c.status === 'signed').length;
    const contractsPending = contracts.length - contractsSigned;
    const newLeads = leads.filter((l) => l.status === 'new').length;
    const reviewsApproved = reviews.filter((r) => r.status === 'approved').length;
    const reviewsPending = reviews.filter((r) => r.status === 'pending').length;
    const avgRating = reviews.length
      ? (reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0) / reviews.length)
      : 0;

    res.render('admin/analytics', {
      adminEmail: req.session.admin.email,
      firebaseReady: isReady(),
      money,
      taxRate,
      revenue: { collected, outstanding, totalInvoiced, estTax, afterTax },
      invoices: { paidCount, unpaidCount, total: invoices.length },
      projects: { active: activeProjects, pending: pendingProjects, completed: completedProjects, total: projects.length, byStage: projectsByStage },
      counts: {
        clients: clients.length,
        contracts: contracts.length, contractsSigned, contractsPending,
        leads: leads.length, newLeads,
        reviews: reviews.length, reviewsApproved, reviewsPending, avgRating,
      },
    });
  } catch (err) { next(err); }
});

/* ---------- Website Content index ---------- */
router.get('/content', requireAdmin, (req, res) => {
  res.render('admin/content_index', {
    firebaseReady: isReady(),
    adminEmail: req.session.admin.email,
  });
});

/* ---------- Section edit ---------- */
router.get('/content/:key', requireAdmin, async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!VALID_SECTIONS.has(key)) return res.status(404).send('Unknown section');
    const section = mergeWithDefaults(key, await getSection(key));
    res.render(`admin/sections/${key}`, {
      section,
      saved: Boolean(req.query.saved),
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/content/:key', requireAdmin, async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!VALID_SECTIONS.has(key)) return res.status(404).send('Unknown section');
    const payload = normalizeSubmission(key, req.body || {});
    await saveSection(key, payload);
    res.redirect(`/admin/content/${key}?saved=1`);
  } catch (err) {
    next(err);
  }
});

/* ---------- Image upload (shared) ---------- */
router.post('/upload', requireAdminJson, upload.single('file'), async (req, res, next) => {
  try {
    if (!isReady()) return res.status(503).json({ error: 'Firebase not initialized' });
    if (!req.file) return res.status(400).json({ error: 'no file' });
    const { url, path } = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ ok: true, url, path });
  } catch (err) {
    next(err);
  }
});

/* =============================================================================
   Form data normalization — turn Express body (with array-bracket syntax)
   into the shape stored in Firestore.
   ============================================================================= */

function mergeWithDefaults(key, stored) {
  const base = JSON.parse(JSON.stringify(defaults[key] || {}));
  if (!stored) return base;
  return deepMerge(base, stored);
}

function deepMerge(base, over) {
  if (Array.isArray(over)) return over;
  if (over && typeof over === 'object') {
    const out = Array.isArray(base) ? [...base] : { ...(base || {}) };
    for (const k of Object.keys(over)) {
      out[k] = deepMerge(base?.[k], over[k]);
    }
    return out;
  }
  return over !== undefined ? over : base;
}

function toArray(maybeSparse) {
  if (!maybeSparse) return [];
  if (Array.isArray(maybeSparse)) return maybeSparse.filter(Boolean);
  if (typeof maybeSparse === 'object') {
    return Object.keys(maybeSparse)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => maybeSparse[k])
      .filter(Boolean);
  }
  return [];
}

function asBool(v) {
  return v === true || v === 'true' || v === '1' || v === 'on';
}

function splitLines(s) {
  return (s || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function splitCommas(s) {
  return (s || '').split(',').map((l) => l.trim()).filter(Boolean);
}

function normalizeUrl(u) {
  const s = (u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return 'https://' + s.replace(/^\/+/, '');
}

function normalizeSubmission(key, body) {
  switch (key) {
    case 'meta': {
      return {
        fields: {
          title: body.fields?.title || '',
          description: body.fields?.description || '',
          year: body.fields?.year || String(new Date().getFullYear()),
        },
        images: {
          favicon: {
            url: body.images?.favicon?.url || '',
            path: body.images?.favicon?.path || null,
          },
        },
      };
    }

    case 'nav': {
      return {
        fields: {
          portalLabel: body.fields?.portalLabel || '',
        },
        images: {
          logo: {
            url: body.images?.logo?.url || '',
            path: body.images?.logo?.path || null,
          },
        },
        links: toArray(body.links).map((l) => ({
          label: l?.label || '',
          href: l?.href || '#',
        })),
      };
    }

    case 'hero': {
      return {
        fields: {
          badge: body.fields?.badge || '',
          titleLine1: body.fields?.titleLine1 || '',
          titleLine2: body.fields?.titleLine2 || '',
          titleAccent: body.fields?.titleAccent || '',
          titleSuffix: body.fields?.titleSuffix || '',
          sub: body.fields?.sub || '',
        },
        links: {
          primaryCta: {
            label: body.links?.primaryCta?.label || '',
            href: body.links?.primaryCta?.href || '#',
          },
          secondaryCta: {
            label: body.links?.secondaryCta?.label || '',
            href: body.links?.secondaryCta?.href || '#',
          },
        },
        kpis: toArray(body.kpis).map((k) => ({
          value: Number(k?.value) || 0,
          label: k?.label || '',
          suffix: k?.suffix || '',
        })),
      };
    }

    case 'ticker': {
      return { items: toArray(body.items) };
    }

    case 'services': {
      return {
        fields: {
          eyebrow: body.fields?.eyebrow || '',
          title: body.fields?.title || '',
          lede: body.fields?.lede || '',
        },
        cards: toArray(body.cards).map((c) => ({
          title: c?.title || '',
          description: c?.description || '',
          bullets: splitLines(c?.bulletsText || ''),
          featured: asBool(c?.featured),
          tag: c?.tag || null,
        })),
      };
    }

    case 'process': {
      return {
        fields: {
          eyebrow: body.fields?.eyebrow || '',
          title: body.fields?.title || '',
          lede: body.fields?.lede || '',
          ctaLabel: body.fields?.ctaLabel || '',
          ctaHref: body.fields?.ctaHref || '#',
        },
        steps: toArray(body.steps).map((s) => ({
          num: s?.num || '',
          title: s?.title || '',
          description: s?.description || '',
        })),
      };
    }

    case 'why': {
      return {
        fields: {
          eyebrow: body.fields?.eyebrow || '',
          title: body.fields?.title || '',
          lede: body.fields?.lede || '',
        },
        points: toArray(body.points).map((p) => ({
          title: p?.title || '',
          description: p?.description || '',
        })),
      };
    }

    case 'work': {
      return {
        fields: {
          eyebrow: body.fields?.eyebrow || '',
          title: body.fields?.title || '',
          lede: body.fields?.lede || '',
        },
        cards: toArray(body.cards).map((c) => ({
          url: normalizeUrl(c?.url || ''),
          title: c?.title || '',
          description: c?.description || '',
          tags: splitCommas(c?.tagsText || ''),
          image: {
            url: c?.image?.url || '',
            path: c?.image?.path || null,
          },
        })),
      };
    }

    case 'contact': {
      return {
        fields: {
          eyebrow: body.fields?.eyebrow || '',
          title: body.fields?.title || '',
          lede: body.fields?.lede || '',
          submitLabel: body.fields?.submitLabel || '',
        },
      };
    }

    case 'footer': {
      return {
        fields: {
          brandName: body.fields?.brandName || '',
          brandTagline: body.fields?.brandTagline || '',
          copyright: body.fields?.copyright || '',
        },
        images: {
          logo: {
            url: body.images?.logo?.url || '',
            path: body.images?.logo?.path || null,
          },
        },
        links: toArray(body.links).map((l) => ({
          label: l?.label || '',
          href: l?.href || '#',
        })),
      };
    }

    default:
      throw new Error('Unknown section');
  }
}

export default router;
