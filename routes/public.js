import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getAllSections } from '../lib/content.js';
import { isReady } from '../lib/firebase.js';
import { trackVisit } from '../lib/analytics.js';
import { createLead, createReview, listApprovedReviews } from '../lib/business.js';
import { sendMail, emailShell, escapeHtml, mailReady } from '../lib/mail.js';
import {
  services,
  servicesMeta,
  servicesIndexMeta,
  getService,
  getServiceDetail,
} from '../lib/services-data.js';
import {
  industries,
  industriesIndexMeta,
  upcomingIndustries,
  getIndustry,
  getIndustryDemos,
  getIndustryServices,
  resolveCaseStudy,
} from '../lib/industries-data.js';
import { buildBreadcrumbList, absoluteUrl } from '../lib/seo.js';

const router = Router();

/* Simple per-IP rate limit for the contact form (in-memory, best-effort). */
const contactHits = new Map();
const CONTACT_WINDOW_MS = 60 * 1000;
const CONTACT_MAX = 5;
function rateLimited(ip) {
  const now = Date.now();
  const entry = contactHits.get(ip) || { count: 0, start: now };
  if (now - entry.start > CONTACT_WINDOW_MS) {
    contactHits.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count += 1;
  contactHits.set(ip, entry);
  return entry.count > CONTACT_MAX;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function firebaseWebConfig() {
  if (!process.env.FIREBASE_API_KEY) return null;
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const content = await getAllSections();
    const reviews = await listApprovedReviews();

    // New-visitor detection: a long-lived cookie means refreshes (and return
    // visits) are NOT counted as new visitors.
    const cookieHeader = req.headers.cookie || '';
    const isNewVisitor = !/(?:^|;\s*)darsh_v=/.test(cookieHeader);
    if (isNewVisitor) {
      res.cookie('darsh_v', randomUUID(), {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    res.render('index', {
      content,
      services,
      servicesMeta,
      reviews,
      firebaseWebConfig: firebaseWebConfig(),
      firebaseReady: isReady(),
    });

    // Don't count local/dev hits — only real visitors on a live domain.
    const host = (req.get('host') || '').toLowerCase();
    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]') || host.startsWith('0.0.0.0');
    // Don't count bots, crawlers, link-preview fetchers, scanners, or uptime checks.
    const ua = (req.get('user-agent') || '').toLowerCase();
    const isBot = !ua || /bot|crawl|spider|slurp|facebookexternalhit|facebot|embedly|quora|pinterest|slackbot|whatsapp|telegram|discord|twitter|linkedin|preview|monitor|uptime|headless|lighthouse|pingdom|gtmetrix|ahrefs|semrush|dataprovider|curl|wget|python-requests|node-fetch|axios|go-http-client|render|scan|http-client|phantomjs|puppeteer/i.test(ua);
    // Real browsers send these; most bots/preview-fetchers don't.
    const looksHuman = (req.get('accept') || '').includes('text/html') && Boolean(req.get('accept-language'));
    if (!isLocal && !isBot && looksHuman) trackVisit(isNewVisitor).catch(() => {});
  } catch (err) {
    next(err);
  }
});

router.post('/contact', async (req, res) => {
  try {
    const body = req.body || {};

    // Honeypot — bots fill hidden fields. Pretend success, drop silently.
    if (body.website) return res.json({ ok: true });

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (rateLimited(ip)) {
      return res.status(429).json({ ok: false, error: 'Too many requests — please try again in a minute.' });
    }

    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const company = (body.company || '').trim();
    const message = (body.message || '').trim();

    const errors = {};
    if (!name) errors.name = 'Please enter your name.';
    if (!email) errors.email = 'Please enter your email.';
    else if (!EMAIL_RE.test(email)) errors.email = 'That email doesn’t look right.';
    if (!message) errors.message = 'Tell us a little about what you’re building.';
    if (Object.keys(errors).length) {
      return res.status(400).json({ ok: false, errors });
    }

    const lead = { name, email, company, message, source: 'website', userAgent: req.get('user-agent') || '' };

    // Persist first so a lead is never lost even if email fails.
    let saved = false;
    if (isReady()) {
      try { await createLead(lead); saved = true; }
      catch (err) { console.warn('[contact] could not save lead:', err.message); }
    }

    // Notify the studio + auto-reply the prospect (best-effort).
    let emailed = false;
    if (mailReady()) {
      try {
        await Promise.all([sendLeadNotification(lead), sendLeadAutoReply(lead)]);
        emailed = true;
      } catch (err) {
        console.warn('[contact] email failed:', err.message);
      }
    }

    if (!saved && !emailed) {
      console.error('[contact] lead NOT captured (no Firebase, no mail):', JSON.stringify(lead));
      return res.status(500).json({ ok: false, error: 'We couldn’t send your message right now. Please email us directly.' });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[contact] unexpected error:', err);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

function contactRecipient() {
  return process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || process.env.SMTP_USER;
}

async function sendLeadNotification(lead) {
  const to = contactRecipient();
  if (!to) return;
  const bodyHtml = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;margin:0 0 8px;color:#0a1f44;">New project enquiry</h1>
    <p style="color:#6b7280;margin:0 0 24px;">Someone reached out through the Darsh website.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f7fb;border-radius:12px;padding:18px;margin-bottom:20px;">
      <tr><td style="padding:6px 8px;width:110px;color:#6b7280;font-size:13px;">Name</td><td style="padding:6px 8px;font-weight:600;">${escapeHtml(lead.name)}</td></tr>
      <tr><td style="padding:6px 8px;color:#6b7280;font-size:13px;">Email</td><td style="padding:6px 8px;font-weight:600;"><a href="mailto:${escapeHtml(lead.email)}" style="color:#0a1f44;">${escapeHtml(lead.email)}</a></td></tr>
      ${lead.company ? `<tr><td style="padding:6px 8px;color:#6b7280;font-size:13px;">Company</td><td style="padding:6px 8px;font-weight:600;">${escapeHtml(lead.company)}</td></tr>` : ''}
    </table>
    <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Message</div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;line-height:1.6;">${escapeHtml(lead.message).replace(/\n/g, '<br/>')}</div>
    <p style="color:#6b7280;margin:20px 0 0;font-size:13px;">Reply directly to this email to respond to ${escapeHtml(lead.name)}.</p>
  `;
  await sendMail({
    to,
    replyTo: lead.email,
    subject: `New enquiry — ${lead.name}${lead.company ? ' (' + lead.company + ')' : ''}`,
    html: emailShell({ title: 'New project enquiry', preheader: `${lead.name} wants to start a project`, bodyHtml }),
  });
}

async function sendLeadAutoReply(lead) {
  const brand = process.env.BUSINESS_NAME || 'Darsh';
  const bodyHtml = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;margin:0 0 8px;color:#0a1f44;">Thanks for reaching out, ${escapeHtml(lead.name.split(' ')[0] || 'there')} 👋</h1>
    <p style="color:#374151;margin:0 0 16px;line-height:1.6;">We’ve got your message and a real person on the ${escapeHtml(brand)} team will get back to you within one business day — usually faster.</p>
    <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;">What you sent us</div>
    <div style="background:#f6f7fb;border-radius:10px;padding:16px;line-height:1.6;color:#374151;">${escapeHtml(lead.message).replace(/\n/g, '<br/>')}</div>
    <p style="color:#6b7280;margin:20px 0 0;line-height:1.6;">In the meantime, if anything else comes to mind just reply to this email — it goes straight to us.</p>
    <p style="color:#0a1f44;margin:16px 0 0;font-weight:600;">— The ${escapeHtml(brand)} team</p>
  `;
  await sendMail({
    to: lead.email,
    subject: `We got your message — ${brand}`,
    html: emailShell({ title: `Thanks for reaching out`, preheader: `We’ll reply within one business day.`, bodyHtml }),
  });
}

router.post('/reviews', async (req, res) => {
  try {
    const body = req.body || {};
    if (body.website) return res.json({ ok: true }); // honeypot

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (rateLimited(ip)) {
      return res.status(429).json({ ok: false, error: 'Too many submissions — please try again in a minute.' });
    }

    const name = (body.name || '').trim();
    const role = (body.role || '').trim();
    const text = (body.text || '').trim();
    const rating = Math.round(Number(body.rating) || 0);

    const errors = {};
    if (!name) errors.name = 'Please enter your name.';
    if (!rating || rating < 1 || rating > 5) errors.rating = 'Please pick a star rating.';
    if (!text) errors.text = 'Please write a short review.';
    if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });

    if (!isReady()) {
      return res.status(503).json({ ok: false, error: 'Reviews are temporarily unavailable.' });
    }
    await createReview({ name, role, text, rating });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[reviews] submit error:', err);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

/* ------------------------------------------------------------------------ *
 * Service pages — /services (index) and /services/<slug> (one per service)
 *
 * These exist so the site has more than one indexable page. The homepage cards
 * are a summary; each service now also has a page of its own with a unique
 * title, description, canonical URL and Service structured data, which is the
 * unit search engines actually rank.
 *
 * Both render views/service.ejs — see the comment at the top of that file for
 * why one template serves both the index and the detail pages.
 * ------------------------------------------------------------------------ */

/**
 * Other services to link to from a detail page. Starts at the entry *after*
 * the current one and wraps, so the internal links form a rotating ring rather
 * than every page pointing at the same first three.
 */
function relatedServices(slug, count = 3) {
  const idx = services.findIndex((s) => s.slug === slug);
  if (idx < 0) return services.slice(0, count);
  const out = [];
  for (let i = 1; i < services.length && out.length < count; i += 1) {
    out.push(services[(idx + i) % services.length]);
  }
  return out;
}

router.get('/services', async (req, res, next) => {
  try {
    const content = await getAllSections();
    res.render('service', {
      content,
      services,
      servicesMeta,
      indexMeta: servicesIndexMeta,
      service: null, // index mode
      detail: null,
      related: [],
    });
  } catch (err) {
    next(err);
  }
});

router.get('/services/:slug', async (req, res, next) => {
  try {
    const service = getService(req.params.slug);
    // Unknown slug → hand off to the app-wide 404 in server.js instead of
    // rendering an empty page. Same pattern routes/showcase.js uses for an
    // unknown design, so there is one 404 response for the whole site.
    if (!service) return next();

    const content = await getAllSections();
    res.render('service', {
      content,
      services,
      servicesMeta,
      indexMeta: servicesIndexMeta,
      service,
      detail: getServiceDetail(service.slug),
      related: relatedServices(service.slug),
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------------ *
 * Industry pages — /industries (hub) and /industries/<vertical>
 *
 * A second SEO layer, at a right angle to /services. /services answers "what do
 * you build"; these answer "do you understand my trade", which is a different
 * search made by a different buyer. An HVAC owner searching "HVAC website
 * design" will not click a page titled "Online Booking & Scheduling", however
 * relevant it is.
 *
 * WHY A HUB AND NOT A MATRIX: twelve services x twenty-three showcase verticals
 * is 276 pages of near-identical copy — a doorway network, and a site-wide
 * quality risk rather than a per-page one. One hub per vertical, linking out to
 * the real service pages, is the entire design. See the header comment in
 * lib/industries-data.js for the rest of the reasoning, including why exactly
 * one vertical is published today.
 *
 * Both routes render views/industry.ejs — one template, two modes, the same
 * arrangement views/service.ejs uses.
 * ------------------------------------------------------------------------ */

/**
 * Structured data for an industry page. `industry` is null for the hub index.
 *
 * Built here rather than in the template because lib/seo.js already exports
 * buildBreadcrumbList() and this file can `import` it, while an EJS view cannot
 * (server.js exposes the module as `app.locals.seo` to work around that, but
 * assembling the payload in one place keeps it reviewable and stops these pages
 * drifting from the homepage's structured data).
 *
 * Nothing here is invented — every URL resolves, every name comes from
 * lib/industries-data.js or lib/showcase/registry.js, and nodes with no real
 * data behind them are omitted rather than filled in. Notably absent:
 * `areaServed`, for the same reason lib/seo.js refuses to emit LocalBusiness —
 * there is no service area recorded anywhere in this codebase.
 */
function buildIndustryJsonLd({ req, industry, demos = [], linked = [] }) {
  const baseUrl = siteOrigin(req);
  const brandName = process.env.BUSINESS_NAME || 'Darsh';
  const isIndex = !industry;
  const pagePath = isIndex ? '/industries' : `/industries/${industry.slug}`;
  const pageUrl = absoluteUrl(baseUrl, pagePath);

  const nodes = [];

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Industries', path: '/industries' },
  ];
  if (!isIndex) trail.push({ name: industry.name, path: pagePath });
  const breadcrumb = buildBreadcrumbList({ baseUrl, trail });
  // buildBreadcrumbList() returns a bare node so it can be dropped into a
  // @graph; these pages emit one <script> per node, so each needs its own
  // @context.
  if (breadcrumb) nodes.push({ '@context': 'https://schema.org', ...breadcrumb });

  if (isIndex) {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Industries ${brandName} builds for`,
      itemListElement: industries.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: absoluteUrl(baseUrl, `/industries/${item.slug}`),
      })),
    });
    return nodes;
  }

  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${industry.name} website design and software`,
    // The phrase the page is actually written to win, verbatim.
    serviceType: industry.serviceType,
    url: pageUrl,
    description: industry.metaDescription,
    provider: { '@type': 'Organization', name: brandName, url: absoluteUrl(baseUrl, '/') },
  };
  if (linked.length) {
    service.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: `Software for ${industry.name} companies`,
      itemListElement: linked.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.title,
          description: s.note || s.tagline,
          url: absoluteUrl(baseUrl, s.path),
        },
      })),
    };
  }
  nodes.push(service);

  if (demos.length) {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${industry.name} website designs by ${brandName}`,
      // itemListOrder is unordered on purpose: these are five alternatives, not
      // a ranking, and the page does not present them as one.
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: demos.length,
      itemListElement: demos.map((demo, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: demo.name,
        description: demo.note || demo.blurb,
        url: absoluteUrl(baseUrl, demo.url),
      })),
    });
  }

  /*
   * FAQPage. Worth being clear about what this is and is not doing: since
   * Google's August 2023 change, FAQ rich results are shown only for
   * well-known government and health sites, so this will not produce an
   * expandable FAQ in the SERP for an agency site and should not be sold as
   * one. It is emitted because it is an accurate machine-readable description
   * of content the page genuinely renders, which is what the crawlers behind
   * AI answers and non-Google engines read. The markup matches the visible
   * <details> blocks question-for-question — no hidden extras, no invented
   * questions.
   */
  const faqs = industry.faqs || [];
  if (faqs.length) {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    });
  }

  return nodes;
}

router.get('/industries', async (req, res, next) => {
  try {
    const content = await getAllSections();
    res.render('industry', {
      content,
      indexMeta: industriesIndexMeta,
      industries,
      upcoming: upcomingIndustries,
      industry: null, // index mode
      demos: [],
      linked: [],
      caseStudy: null,
      jsonLd: buildIndustryJsonLd({ req, industry: null }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/industries/:slug', async (req, res, next) => {
  try {
    const industry = getIndustry(req.params.slug);
    // Unknown vertical → hand off to the app-wide 404 in server.js rather than
    // rendering an empty shell. Same pattern as /services/:slug above.
    if (!industry) return next();

    const content = await getAllSections();
    const demos = getIndustryDemos(industry);
    const linked = getIndustryServices(industry);

    res.render('industry', {
      content,
      indexMeta: industriesIndexMeta,
      industries,
      upcoming: upcomingIndustries,
      industry,
      demos,
      linked,
      // The client's one-line description is read back out of the CMS work
      // cards when one matches, so this page and the homepage cannot describe
      // the same client differently.
      caseStudy: resolveCaseStudy(industry, content.work && content.work.cards),
      jsonLd: buildIndustryJsonLd({ req, industry, demos, linked }),
    });
  } catch (err) {
    next(err);
  }
});

/* Standalone "leave a review" page — the link emailed to clients. */
router.get('/review', (req, res) => {
  res.render('review', {
    businessName: process.env.BUSINESS_NAME || 'Darsh',
    faviconUrl: '/images/Logo.png',
  });
});

router.get('/healthz', (req, res) => {
  res.json({ ok: true, firebaseReady: isReady() });
});

/* ------------------------------------------------------------------------ *
 * SEO — /robots.txt and /sitemap.xml
 *
 * Both are served as ROUTES rather than static files in public/ because the
 * production domain isn't fixed yet (BASE_URL is a LAN IP today). A route
 * builds every absolute URL from process.env.BASE_URL at request time, so
 * moving to the real domain needs an env change and nothing else — a static
 * file would need editing and redeploying, and would silently keep pointing
 * at the old host. A route also lets <lastmod> come from real CMS data.
 *
 * NOTE: express.static(public/) is mounted BEFORE these routes in server.js,
 * so do NOT add public/robots.txt or public/sitemap.xml — a static file would
 * shadow these handlers.
 * ------------------------------------------------------------------------ */

/**
 * Absolute site origin, no trailing slash. Falls back to the request's own
 * host so the files are never broken in dev/preview if BASE_URL is unset —
 * we never hardcode a domain. server.js sets 'trust proxy', so req.protocol
 * is correct behind a reverse proxy.
 */
function siteOrigin(req) {
  const raw = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return raw.trim().replace(/\/+$/, '');
}

/*
 * Pages we actually want indexed.
 *
 * Deliberately NOT here:
 *   /review   — views/review.ejs sets <meta name="robots" content="noindex">.
 *               It's a per-client link emailed after a project, not a landing
 *               page. It stays crawlable in robots.txt on purpose: blocking it
 *               there would stop crawlers from ever reading the noindex tag.
 *   /showcase/designs/* — the generated demos. Each one serves
 *               <meta name="robots" content="noindex, follow"> from
 *               routes/showcase.js, so they are crawlable but not indexable.
 *               A noindex URL does not belong in a sitemap: a sitemap is a
 *               request to index, and asking for the opposite of what the page
 *               says is a contradiction a crawler has to spend budget resolving.
 *   /contact, /reviews — POST-only handlers, no GET representation.
 *   /healthz  — machine endpoint.
 *   Verticals in `upcomingIndustries` — no page exists, so no URL.
 */
const SITEMAP_PAGES = [
  { path: '/', lastmod: contentLastModified },

  // The showcase landing gallery (public/showcase/index.html) — a real,
  // Darsh-branded marketing page with its own title/description, linked from
  // the homepage via views/partials/discover-designs.ejs. Distinct from the
  // generated demo sites under /showcase/designs/*, which carry a page-level
  // noindex instead (see the note above).
  // No <lastmod>: it's a checked-in static file, and its mtime is a deploy
  // artifact (it changes on every clone), not a real content-edit date.
  { path: '/showcase/' },

  // The services index, and one page per service.
  //
  // Generated from the same `services` array the pages themselves render from,
  // so adding a service to lib/services-data.js adds its page AND its sitemap
  // entry in one edit — the two can't drift apart.
  //
  // No <lastmod> on any of them, for the same reason as /showcase/ above: this
  // copy lives in a checked-in source file rather than the Firestore CMS, so
  // there is no genuine content-edit timestamp to report. An mtime here would
  // be a deploy artifact, and a wrong <lastmod> is worse than none.
  { path: '/services' },
  ...services.map((service) => ({ path: `/services/${service.slug}` })),

  // The industries hub, and one page per published vertical.
  //
  // Generated from the same `industries` array the pages render from, for the
  // same reason as the services block above: adding a vertical to
  // lib/industries-data.js adds its route AND its sitemap entry in one edit.
  // Verticals in `upcomingIndustries` are deliberately NOT here — they have no
  // page, and listing a URL that 404s is the fastest way to lose a crawler's
  // trust in the whole file.
  //
  // No <lastmod>, same reasoning as above: the copy lives in a checked-in
  // source file, not the Firestore CMS, so there is no genuine content-edit
  // timestamp and a file mtime would just be a deploy artifact.
  { path: '/industries' },
  ...industries.map((industry) => ({ path: `/industries/${industry.slug}` })),
];

/**
 * Newest updatedAt across the Firestore CMS sections that render the homepage.
 * lib/content.js stamps updatedAt on every saveSection(), so this is a genuine
 * "when did this page's content last change" signal. Returns null when Firebase
 * is unavailable (lib/defaults.js carries no timestamps) — in that case we omit
 * <lastmod> entirely rather than invent one.
 */
async function contentLastModified() {
  try {
    const content = await getAllSections();
    let newest = null;
    for (const section of Object.values(content || {})) {
      const stamp = section && section.updatedAt;
      if (!stamp) continue;
      const when = new Date(stamp);
      if (Number.isNaN(when.getTime())) continue;
      if (!newest || when > newest) newest = when;
    }
    return newest;
  } catch (err) {
    console.warn('[sitemap] could not derive lastmod:', err.message);
    return null;
  }
}

router.get('/robots.txt', (req, res) => {
  const origin = siteOrigin(req);

  const body = `# robots.txt — ${process.env.BUSINESS_NAME || 'Darsh'}
# Generated by routes/public.js so the Sitemap URL follows BASE_URL.

User-agent: *
Allow: /

# Admin dashboard and every sub-section (clients, contracts, invoices,
# quotes, projects, leads, reviews) — session-gated, never public.
Disallow: /admin

# Client portal — magic-link auth, private invoices and contracts.
Disallow: /portal

# Health check — JSON for uptime monitors, nothing to index.
Disallow: /healthz

# Form handlers. POST-only, so a crawler's GET just 404s.
# Note: this does NOT block /review (the public review page) — robots.txt
# matches by prefix, and "/reviews" is not a prefix of "/review".
Disallow: /contact
Disallow: /reviews

# --- Showcase demo sites: kept OUT of the index, but crawlable --------------
# The generated demos at /showcase/designs/<category>/<design> are thin,
# templated pages sharing near-identical markup across many variants, so they
# should not be indexed. That is now enforced where it actually works: each
# demo serves a page-level <meta name="robots" content="noindex, follow">
# (see seoHead() in routes/showcase.js).
#
# There is deliberately NO "Disallow: /showcase/designs/" here, and adding one
# back would break the noindex rather than reinforce it. Disallow blocks
# FETCHING, not INDEXING — a crawler that is not allowed to fetch the page can
# never read the noindex tag, and Google will happily index a blocked URL
# anchor-text-only (the classic "No information is available for this page"
# result). The two directives cancel each other out; the page-level one is the
# one that removes the URL.
#
# The Disallow also had a side effect nobody wanted: it matched by prefix, so
# it was blocking the per-design CSS and JS routes underneath it
# (/showcase/designs/<cat>/<id>/css/style.css and .../js/main.js) too, and
# "follow" is only useful if the crawler can render and walk the page.
#
# The /showcase/ landing gallery is a real Darsh-branded page, is indexable,
# and is in the sitemap.
# ---------------------------------------------------------------------------

# CSS and JS are left crawlable throughout (/css/, /js/, /showcase/assets/,
# /__cat_common/, /__layout_*/, and the per-design theme routes under
# /showcase/designs/) — blocking them stops search engines rendering the pages
# they are allowed to index, and stops them seeing that a demo is a genuine
# page rather than a shell.

Sitemap: ${origin}/sitemap.xml
`;

  res.type('text/plain');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(body);
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const origin = siteOrigin(req);

    const entries = await Promise.all(
      SITEMAP_PAGES.map(async (page) => {
        const lastmod = page.lastmod ? await page.lastmod() : null;
        return { loc: `${origin}${page.path}`, lastmod };
      })
    );

    /*
     * <changefreq> and <priority> are omitted on purpose: Google ignores both
     * outright, and with a handful of URLs a relative priority says nothing a
     * crawler can act on. Leaving them out keeps the file to claims we can
     * actually stand behind. <lastmod>, which Google does use, is emitted only
     * where a real timestamp exists.
     */
    const urls = entries
      .map(({ loc, lastmod }) => {
        const lastmodTag = lastmod
          ? `\n    <lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>`
          : '';
        return `  <url>\n    <loc>${escapeHtml(loc)}</loc>${lastmodTag}\n  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

    res.type('application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

export default router;
