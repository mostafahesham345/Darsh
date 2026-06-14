import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { isReady } from '../lib/firebase.js';
import {
  listClients, getClient,
  listInvoices, getInvoice, createInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice,
  invoiceTotal, nextInvoiceNumber,
} from '../lib/business.js';
import { generateInvoicePdf } from '../lib/pdf.js';
import { sendMail, emailShell, escapeHtml, money, mailReady } from '../lib/mail.js';

const router = Router();

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const invoices = isReady() ? await listInvoices() : [];
    res.render('admin/invoices/index', {
      invoices,
      invoiceTotal,
      firebaseReady: isReady(),
      mailReady: mailReady(),
      adminEmail: req.session.admin.email,
      flash: req.query.created ? (req.query.mailfailed ? 'Invoice created, but the email could not be sent — check SMTP settings, then use “Resend”.' : 'Invoice created and sent.')
        : req.query.sent ? 'Invoice email sent.'
        : req.query.paid ? (req.query.mailfailed ? 'Invoice marked as paid, but the receipt email could not be sent.' : 'Invoice marked as paid — receipt sent.')
        : req.query.updated ? 'Invoice updated.'
        : req.query.deleted ? 'Invoice deleted.'
        : req.query.mailfailed ? 'The email could not be sent — check your SMTP settings.'
        : null,
      flashWarn: Boolean(req.query.mailfailed),
    });
  } catch (err) { next(err); }
});

router.get('/new', requireAdmin, async (req, res, next) => {
  try {
    const clients = isReady() ? await listClients() : [];
    const nextNum = isReady() ? await nextInvoiceNumber() : `INV-${Date.now()}`;
    res.render('admin/invoices/form', {
      clients, nextNum,
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.post('/new', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    let client = null;
    if (body.clientId) client = await getClient(body.clientId);
    const items = [];
    const descs = Array.isArray(body.itemDesc) ? body.itemDesc : [body.itemDesc];
    const qtys = Array.isArray(body.itemQty) ? body.itemQty : [body.itemQty];
    const rates = Array.isArray(body.itemRate) ? body.itemRate : [body.itemRate];
    for (let i = 0; i < descs.length; i++) {
      const d = (descs[i] || '').trim();
      if (!d) continue;
      items.push({ description: d, qty: Number(qtys[i]) || 1, rate: Number(rates[i]) || 0 });
    }
    const invoice = await createInvoice({
      invoiceNumber: body.invoiceNumber,
      clientId: client?.id || null,
      clientName: client?.name || body.clientName || '',
      clientCompany: client?.company || body.clientCompany || '',
      clientEmail: client?.email || body.clientEmail || '',
      clientAddress: client?.address || body.clientAddress || '',
      issueDate: body.issueDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      dueDate: body.dueDate || '',
      currency: body.currency || 'USD',
      items,
      taxRate: body.taxRate,
      discount: body.discount,
      notes: body.notes || '',
    });

    // Send invoice email — but don't let a mail failure lose the invoice.
    let mailed = true;
    try {
      await sendInvoiceEmail(invoice);
      await updateInvoiceStatus(invoice.id, 'sent', { sentAt: new Date().toISOString() });
    } catch (mailErr) {
      mailed = false;
      console.warn('[invoices] email failed on create:', mailErr.message);
    }

    res.redirect(`/admin/invoices?created=1${mailed ? '' : '&mailfailed=1'}`);
  } catch (err) { next(err); }
});

router.get('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const invoice = await getInvoice(req.params.id);
    if (!invoice) return res.status(404).send('Invoice not found');
    const clients = isReady() ? await listClients() : [];
    res.render('admin/invoices/form', {
      mode: 'edit',
      invoice,
      clients,
      nextNum: invoice.invoiceNumber,
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.post('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    let client = null;
    if (body.clientId) client = await getClient(body.clientId);
    const items = [];
    const descs = Array.isArray(body.itemDesc) ? body.itemDesc : [body.itemDesc];
    const qtys = Array.isArray(body.itemQty) ? body.itemQty : [body.itemQty];
    const rates = Array.isArray(body.itemRate) ? body.itemRate : [body.itemRate];
    for (let i = 0; i < descs.length; i++) {
      const d = (descs[i] || '').trim();
      if (!d) continue;
      items.push({ description: d, qty: Number(qtys[i]) || 1, rate: Number(rates[i]) || 0 });
    }
    await updateInvoice(req.params.id, {
      invoiceNumber: body.invoiceNumber,
      clientId: client?.id || body.clientId || null,
      clientName: client?.name || body.clientName || '',
      clientCompany: client?.company || body.clientCompany || '',
      clientEmail: client?.email || body.clientEmail || '',
      clientAddress: client?.address || body.clientAddress || '',
      issueDate: body.issueDate || '',
      dueDate: body.dueDate || '',
      currency: body.currency || 'USD',
      items,
      taxRate: body.taxRate,
      discount: body.discount,
      notes: body.notes || '',
    });
    res.redirect('/admin/invoices?updated=1');
  } catch (err) { next(err); }
});

router.get('/:id/download', requireAdmin, async (req, res, next) => {
  try {
    const invoice = await getInvoice(req.params.id);
    if (!invoice) return res.status(404).send('Invoice not found');
    const isPaid = invoice.status === 'paid';
    const pdf = await generateInvoicePdf(invoice, { markPaid: isPaid });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${isPaid ? 'Receipt' : 'Invoice'}_${invoice.invoiceNumber}.pdf"`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.post('/:id/resend', requireAdmin, async (req, res, next) => {
  try {
    const invoice = await getInvoice(req.params.id);
    if (!invoice) return res.status(404).send('Invoice not found');
    try {
      await sendInvoiceEmail(invoice);
      res.redirect('/admin/invoices?sent=1');
    } catch (mailErr) {
      console.warn('[invoices] resend failed:', mailErr.message);
      res.redirect('/admin/invoices?mailfailed=1');
    }
  } catch (err) { next(err); }
});

router.post('/:id/paid', requireAdmin, async (req, res, next) => {
  try {
    const invoice = await getInvoice(req.params.id);
    if (!invoice) return res.status(404).send('Invoice not found');
    const paidDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    await updateInvoiceStatus(invoice.id, 'paid', { paidDate, paidAt: new Date().toISOString() });
    const updated = { ...invoice, status: 'paid', paidDate };
    let mailed = true;
    try {
      await sendReceiptEmail(updated);
    } catch (mailErr) {
      mailed = false;
      console.warn('[invoices] receipt email failed:', mailErr.message);
    }
    res.redirect(`/admin/invoices?paid=1${mailed ? '' : '&mailfailed=1'}`);
  } catch (err) { next(err); }
});

router.post('/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await deleteInvoice(req.params.id);
    res.redirect('/admin/invoices?deleted=1');
  } catch (err) { next(err); }
});

/* ----------------------------- Email helpers ----------------------------- */
async function sendInvoiceEmail(invoice) {
  if (!invoice.clientEmail) return;
  const total = invoiceTotal(invoice);
  const currency = invoice.currency || 'USD';
  const itemsRows = (invoice.items || []).map((it) => {
    const amt = (Number(it.qty) || 1) * (Number(it.rate) || 0);
    return `<tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(it.description)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${Number(it.qty) || 1}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(it.rate, currency)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${money(amt, currency)}</td>
    </tr>`;
  }).join('');

  const bodyHtml = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:24px;margin:0 0 8px;color:#0a1f44;">New invoice from ${escapeHtml(process.env.BUSINESS_NAME || 'Darsh')}</h1>
    <p style="color:#6b7280;margin:0 0 24px;">Hi ${escapeHtml(invoice.clientName || 'there')}, thank you for working with us. Please find your invoice details below — a PDF copy is attached.</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f7fb;border-radius:12px;padding:18px;margin-bottom:24px;">
      <tr>
        <td style="padding:4px 8px;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Invoice</div><div style="font-weight:600;font-size:16px;">${escapeHtml(invoice.invoiceNumber)}</div></td>
        <td style="padding:4px 8px;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Issued</div><div style="font-weight:600;font-size:14px;">${escapeHtml(invoice.issueDate)}</div></td>
        <td style="padding:4px 8px;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Due</div><div style="font-weight:600;font-size:14px;">${escapeHtml(invoice.dueDate || 'Upon receipt')}</div></td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
      <thead>
        <tr style="background:#0a1f44;color:#fff;">
          <th style="padding:10px 8px;text-align:left;font-size:12px;letter-spacing:0.6px;">DESCRIPTION</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;letter-spacing:0.6px;">QTY</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;letter-spacing:0.6px;">RATE</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;letter-spacing:0.6px;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr><td></td><td style="text-align:right;padding:6px 8px;color:#6b7280;">Subtotal</td><td style="text-align:right;padding:6px 8px;width:120px;">${money((invoice.items || []).reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.rate) || 0), 0), currency)}</td></tr>
      ${Number(invoice.discount) ? `<tr><td></td><td style="text-align:right;padding:6px 8px;color:#6b7280;">Discount</td><td style="text-align:right;padding:6px 8px;">-${money(invoice.discount, currency)}</td></tr>` : ''}
      ${Number(invoice.taxRate) ? `<tr><td></td><td style="text-align:right;padding:6px 8px;color:#6b7280;">Tax (${invoice.taxRate}%)</td><td style="text-align:right;padding:6px 8px;">${money(((invoice.items || []).reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.rate) || 0), 0)) * (Number(invoice.taxRate) / 100), currency)}</td></tr>` : ''}
      <tr><td></td><td style="text-align:right;padding:12px 8px;border-top:2px solid #0a1f44;font-weight:700;font-size:16px;">Total Due</td><td style="text-align:right;padding:12px 8px;border-top:2px solid #0a1f44;font-weight:700;font-size:16px;color:#0a1f44;">${money(total, currency)}</td></tr>
    </table>

    ${process.env.ZELLE_RECIPIENT ? `<div style="background:#fff7d6;border-left:4px solid #f7e27e;padding:14px 16px;border-radius:6px;margin-bottom:24px;"><strong>Payment:</strong> Zelle to <code>${escapeHtml(process.env.ZELLE_RECIPIENT)}</code>${process.env.ZELLE_DISPLAY_NAME ? ' (' + escapeHtml(process.env.ZELLE_DISPLAY_NAME) + ')' : ''}. Please include invoice number <strong>${escapeHtml(invoice.invoiceNumber)}</strong> in the memo.</div>` : ''}

    ${invoice.notes ? `<div style="background:#f6f7fb;padding:14px 16px;border-radius:8px;margin-bottom:24px;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px;">Notes</div>${escapeHtml(invoice.notes).replace(/\n/g, '<br/>')}</div>` : ''}

    <p style="color:#6b7280;margin:0;">Questions? Just reply to this email — we're happy to help.</p>
  `;

  const pdf = await generateInvoicePdf(invoice);
  await sendMail({
    to: invoice.clientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from ${process.env.BUSINESS_NAME || 'Darsh'}`,
    html: emailShell({ title: `Invoice ${invoice.invoiceNumber}`, preheader: `Invoice for ${money(total, currency)} from ${process.env.BUSINESS_NAME || 'Darsh'}`, bodyHtml }),
    attachments: [{ filename: `Invoice_${invoice.invoiceNumber}.pdf`, content: pdf }],
  });
}

async function sendReceiptEmail(invoice) {
  if (!invoice.clientEmail) return;
  const total = invoiceTotal(invoice);
  const currency = invoice.currency || 'USD';
  const bodyHtml = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:24px;margin:0 0 8px;color:#0a1f44;">Payment received — thank you!</h1>
    <p style="color:#6b7280;margin:0 0 24px;">Hi ${escapeHtml(invoice.clientName || 'there')}, we've received your payment. A receipt is attached to this email for your records.</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#ecfdf5 0%,#fff7d6 100%);border:1px solid #a7f3d0;border-radius:12px;padding:22px;margin-bottom:24px;">
      <tr>
        <td>
          <div style="font-size:11px;color:#065f46;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:6px;">PAID IN FULL</div>
          <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:28px;color:#0a1f44;">${money(total, currency)}</div>
          <div style="color:#065f46;font-size:13px;margin-top:4px;">Received on ${escapeHtml(invoice.paidDate)}</div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Invoice</div>
          <div style="font-weight:600;font-size:15px;">${escapeHtml(invoice.invoiceNumber)}</div>
        </td>
      </tr>
    </table>

    <p style="color:#6b7280;margin:0 0 8px;">It's a pleasure working with you. If you need anything else, just reply — we're here to help.</p>
  `;

  const pdf = await generateInvoicePdf(invoice, { markPaid: true });
  await sendMail({
    to: invoice.clientEmail,
    subject: `Receipt for invoice ${invoice.invoiceNumber} — paid in full`,
    html: emailShell({ title: `Receipt ${invoice.invoiceNumber}`, preheader: `Payment received — thank you.`, bodyHtml }),
    attachments: [{ filename: `Receipt_${invoice.invoiceNumber}.pdf`, content: pdf }],
  });
}

export default router;
