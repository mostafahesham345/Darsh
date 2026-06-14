import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { requireClient } from '../lib/auth.js';
import { isReady } from '../lib/firebase.js';
import {
  getClient, getClientByEmail, setClientPortalToken, getClientByPortalToken, clearClientPortalToken,
  listInvoicesByClient, listProjectsByClient, listContractsByClient,
  getInvoice, getContract, signContract, invoiceTotal, PROJECT_STAGES, stageMeta,
} from '../lib/business.js';
import { generateInvoicePdf, generateContractPdf } from '../lib/pdf.js';
import { sendMail, emailShell, escapeHtml, money, mailReady } from '../lib/mail.js';

const router = Router();
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function baseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

/* ---------- Login (request a magic link) ---------- */
router.get('/login', (req, res) => {
  if (req.session.client) return res.redirect('/portal');
  res.render('portal/login', { sent: false, error: null, firebaseReady: isReady() });
});

router.post('/login', async (req, res, next) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).render('portal/login', { sent: false, error: 'Please enter your email.', firebaseReady: isReady() });
    }
    if (!isReady() || !mailReady()) {
      return res.status(503).render('portal/login', { sent: false, error: 'The portal is temporarily unavailable. Please contact us directly.', firebaseReady: isReady() });
    }

    // Always show the same confirmation — never reveal whether an email exists.
    const client = await getClientByEmail(email);
    if (client) {
      const token = randomBytes(24).toString('hex');
      await setClientPortalToken(client.id, token, Date.now() + TOKEN_TTL_MS);
      const link = `${baseUrl(req)}/portal/verify?token=${token}`;
      try {
        await sendMagicLink(client, link);
      } catch (err) {
        console.warn('[portal] magic link email failed:', err.message);
      }
    }

    res.render('portal/login', { sent: true, error: null, firebaseReady: isReady() });
  } catch (err) { next(err); }
});

router.get('/verify', async (req, res, next) => {
  try {
    const token = req.query.token;
    const client = await getClientByPortalToken(token);
    if (!client) {
      return res.status(400).render('portal/login', { sent: false, error: 'That sign-in link is invalid or has expired. Please request a new one.', firebaseReady: isReady() });
    }
    await clearClientPortalToken(client.id);
    req.session.client = { id: client.id, email: client.email, name: client.name };
    res.redirect('/portal');
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  if (req.session) delete req.session.client;
  res.redirect('/portal/login');
});

/* ---------- Dashboard ---------- */
router.get('/', requireClient, async (req, res, next) => {
  try {
    const client = await getClient(req.session.client.id);
    if (!client) {
      delete req.session.client;
      return res.redirect('/portal/login');
    }
    const [projects, invoices, contracts] = await Promise.all([
      listProjectsByClient(client.id),
      listInvoicesByClient(client.id),
      listContractsByClient(client.id),
    ]);
    res.render('portal/dashboard', {
      client,
      projects,
      invoices,
      contracts,
      invoiceTotal,
      money,
      stages: PROJECT_STAGES,
      stageMeta,
      zelle: process.env.ZELLE_RECIPIENT
        ? { recipient: process.env.ZELLE_RECIPIENT, name: process.env.ZELLE_DISPLAY_NAME || '' }
        : null,
    });
  } catch (err) { next(err); }
});

/* ---------- Document downloads (ownership-checked) ---------- */
router.get('/invoices/:id/download', requireClient, async (req, res, next) => {
  try {
    const invoice = await getInvoice(req.params.id);
    if (!invoice || invoice.clientId !== req.session.client.id) return res.status(404).send('Not found');
    const isPaid = invoice.status === 'paid';
    const pdf = await generateInvoicePdf(invoice, { markPaid: isPaid });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${isPaid ? 'Receipt' : 'Invoice'}_${invoice.invoiceNumber}.pdf"`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.get('/contracts/:id', requireClient, async (req, res, next) => {
  try {
    const contract = await getContract(req.params.id);
    if (!contract || contract.clientId !== req.session.client.id) return res.status(404).send('Not found');
    res.render('portal/contract', {
      client: req.session.client,
      contract,
      signed: Boolean(req.query.signed),
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/contracts/:id/sign', requireClient, async (req, res, next) => {
  try {
    const contract = await getContract(req.params.id);
    if (!contract || contract.clientId !== req.session.client.id) return res.status(404).send('Not found');
    if (contract.status === 'signed') return res.redirect(`/portal/contracts/${contract.id}`);

    const first = (req.body?.firstName || '').trim();
    const last = (req.body?.lastName || '').trim();
    const agree = req.body?.agree;
    if (!first || !last || !agree) {
      return res.redirect(`/portal/contracts/${contract.id}?error=1`);
    }
    await signContract(contract.id, `${first} ${last}`);
    res.redirect(`/portal/contracts/${contract.id}?signed=1`);
  } catch (err) { next(err); }
});

router.get('/contracts/:id/download', requireClient, async (req, res, next) => {
  try {
    const contract = await getContract(req.params.id);
    if (!contract || contract.clientId !== req.session.client.id) return res.status(404).send('Not found');
    const pdf = await generateContractPdf(contract);
    const safeName = (contract.clientName || 'contract').replace(/[^a-z0-9]+/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Contract_${safeName}_${contract.contractNumber}.pdf"`);
    res.send(pdf);
  } catch (err) { next(err); }
});

async function sendMagicLink(client, link) {
  const brand = process.env.BUSINESS_NAME || 'Darsh';
  const bodyHtml = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;margin:0 0 8px;color:#0a1f44;">Your sign-in link</h1>
    <p style="color:#374151;margin:0 0 24px;line-height:1.6;">Hi ${escapeHtml(client.name || 'there')}, click the button below to securely sign in to your ${escapeHtml(brand)} client portal. This link expires in 30 minutes.</p>
    <p style="margin:0 0 28px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#0a1f44;color:#f7e27e;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;">Sign in to your portal</a></p>
    <p style="color:#6b7280;margin:0 0 6px;font-size:13px;">Or paste this link into your browser:</p>
    <p style="color:#6b7280;margin:0 0 24px;font-size:13px;word-break:break-all;">${escapeHtml(link)}</p>
    <p style="color:#6b7280;margin:0;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
  `;
  await sendMail({
    to: client.email,
    subject: `Your ${brand} portal sign-in link`,
    html: emailShell({ title: 'Sign in to your portal', preheader: 'Your secure sign-in link (expires in 30 minutes).', bodyHtml }),
  });
}

export default router;
