import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getAllSections } from '../lib/content.js';
import { isReady } from '../lib/firebase.js';
import { trackVisit } from '../lib/analytics.js';
import { createLead, createReview, listApprovedReviews } from '../lib/business.js';
import { sendMail, emailShell, escapeHtml, mailReady } from '../lib/mail.js';
import { services, servicesMeta } from '../lib/services-data.js';

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
    if (!isLocal && !isBot) trackVisit(isNewVisitor).catch(() => {});
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

router.get('/healthz', (req, res) => {
  res.json({ ok: true, firebaseReady: isReady() });
});

export default router;
