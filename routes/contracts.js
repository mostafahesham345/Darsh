import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { isReady } from '../lib/firebase.js';
import {
  listClients,
  listContracts, getContract, createContract, updateContract, deleteContract,
} from '../lib/business.js';
import { generateContractPdf } from '../lib/pdf.js';
import { sendMail, emailShell, escapeHtml, mailReady } from '../lib/mail.js';

function baseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

async function sendContractInvite(req, contract) {
  if (!contract?.clientEmail || !mailReady()) return;
  const brand = process.env.BUSINESS_NAME || 'Darsh';
  const link = `${baseUrl(req)}/portal/login`;
  const bodyHtml = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;margin:0 0 8px;color:#0a1f44;">You have a contract to review &amp; sign</h1>
    <p style="color:#374151;margin:0 0 16px;line-height:1.6;">Hi ${escapeHtml(contract.clientName || 'there')}, ${escapeHtml(brand)} has prepared and signed a contract for you: <strong>${escapeHtml(contract.title || 'Service Agreement')}</strong> (#${escapeHtml(contract.contractNumber)}).</p>
    <p style="color:#374151;margin:0 0 24px;line-height:1.6;">Sign in to your client portal to read it and add your signature.</p>
    <p style="margin:0 0 26px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#0a1f44;color:#f7e27e;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;">Review &amp; sign your contract</a></p>
    <p style="color:#6b7280;margin:0;font-size:13px;">You'll sign in securely with your email — no password needed.</p>
  `;
  await sendMail({
    to: contract.clientEmail,
    subject: `Please review & sign: ${contract.title || 'your contract'} from ${brand}`,
    html: emailShell({ title: 'A contract is ready for your signature', preheader: 'Review and sign your contract in the client portal.', bodyHtml }),
  });
}

const router = Router();

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const contracts = isReady() ? await listContracts() : [];
    res.render('admin/contracts/index', {
      contracts,
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
      flash: req.query.created ? 'Contract saved and downloaded.'
        : req.query.updated ? 'Contract updated.'
        : req.query.deleted ? 'Contract deleted.'
        : null,
    });
  } catch (err) { next(err); }
});

router.get('/new', requireAdmin, async (req, res, next) => {
  try {
    const clients = isReady() ? await listClients() : [];
    res.render('admin/contracts/form', {
      clients,
      adminName: process.env.ADMIN_NAME || process.env.BUSINESS_NAME || '',
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.post('/generate', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const data = {
      title: body.title || 'Service Agreement',
      contractNumber: body.contractNumber || `DRSH-${Date.now().toString().slice(-6)}`,
      effectiveDate: body.effectiveDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      providerSignature: body.providerName || process.env.ADMIN_NAME || process.env.BUSINESS_NAME || 'Darsh',
      clientId: body.clientId || null,
      clientName: body.clientName,
      clientCompany: body.clientCompany,
      clientEmail: body.clientEmail,
      clientAddress: body.clientAddress,
      projectDescription: body.projectDescription,
      scope: body.scope,
      deliverables: body.deliverables,
      startDate: body.startDate,
      endDate: body.endDate,
      milestones: body.milestones,
      totalFee: body.totalFee,
      currency: body.currency || 'USD',
      paymentTerms: body.paymentTerms,
      paymentSchedule: body.paymentSchedule,
      ipClause: body.ipClause,
      confidentialityClause: body.confidentialityClause,
      terminationClause: body.terminationClause,
      additionalTerms: body.additionalTerms,
      engagement: body.engagement,
    };

    let saved = null;
    if (isReady()) {
      saved = await createContract(data);
      // Notify the client that a contract is waiting for their signature (best-effort).
      try { await sendContractInvite(req, saved); } catch (e) { console.warn('[contracts] invite email failed:', e.message); }
    }

    const pdf = await generateContractPdf(saved || { ...data, status: 'pending', providerSignedAt: new Date().toISOString() });
    const safeName = (data.clientName || 'contract').replace(/[^a-z0-9]+/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Contract_${safeName}_${data.contractNumber}.pdf"`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.get('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const contract = await getContract(req.params.id);
    if (!contract) return res.status(404).send('Contract not found');
    const clients = isReady() ? await listClients() : [];
    res.render('admin/contracts/form', {
      mode: 'edit',
      contract,
      clients,
      adminName: process.env.ADMIN_NAME || process.env.BUSINESS_NAME || '',
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.post('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    await updateContract(req.params.id, {
      title: body.title || 'Service Agreement',
      contractNumber: body.contractNumber,
      effectiveDate: body.effectiveDate,
      providerSignature: body.providerName,
      clientId: body.clientId || null,
      clientName: body.clientName,
      clientCompany: body.clientCompany,
      clientEmail: body.clientEmail,
      clientAddress: body.clientAddress,
      projectDescription: body.projectDescription,
      scope: body.scope,
      deliverables: body.deliverables,
      startDate: body.startDate,
      endDate: body.endDate,
      milestones: body.milestones,
      totalFee: body.totalFee,
      currency: body.currency || 'USD',
      paymentTerms: body.paymentTerms,
      paymentSchedule: body.paymentSchedule,
      ipClause: body.ipClause,
      confidentialityClause: body.confidentialityClause,
      terminationClause: body.terminationClause,
      additionalTerms: body.additionalTerms,
      engagement: body.engagement,
    });
    res.redirect('/admin/contracts?updated=1');
  } catch (err) { next(err); }
});

router.get('/:id/download', requireAdmin, async (req, res, next) => {
  try {
    const contract = await getContract(req.params.id);
    if (!contract) return res.status(404).send('Contract not found');
    const pdf = await generateContractPdf(contract);
    const safeName = (contract.clientName || 'contract').replace(/[^a-z0-9]+/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Contract_${safeName}_${contract.contractNumber}.pdf"`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.post('/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await deleteContract(req.params.id);
    res.redirect('/admin/contracts?deleted=1');
  } catch (err) { next(err); }
});

export default router;
