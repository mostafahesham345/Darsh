import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { isReady } from '../lib/firebase.js';
import {
  listClients, getClient,
  listQuotes, getQuote, createQuote, updateQuote, updateQuoteStatus, deleteQuote,
  quoteTotal, nextQuoteNumber,
} from '../lib/business.js';
import { sendMail, emailShell, escapeHtml, money, mailReady } from '../lib/mail.js';

const router = Router();

/* The form posts section rows as parallel arrays; zip them into objects. */
function sectionsFromBody(body) {
  const titles = [].concat(body.sectionTitle || []);
  const descs = [].concat(body.sectionDesc || []);
  const prices = [].concat(body.sectionPrice || []);
  return titles.map((t, i) => ({ title: t, description: descs[i] || '', price: prices[i] || 0 }));
}

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const quotes = isReady() ? await listQuotes() : [];
    res.render('admin/quotes/index', {
      quotes,
      quoteTotal,
      firebaseReady: isReady(),
      mailReady: mailReady(),
      adminEmail: req.session.admin.email,
      flash: req.query.created ? (req.query.sent ? 'Quote saved and sent to the client.' : 'Quote saved.')
        : req.query.sent ? 'Quote sent to the client.'
        : req.query.updated ? 'Quote updated.'
        : req.query.deleted ? 'Quote deleted.'
        : null,
      flashWarn: Boolean(req.query.mailfailed),
      mailfailed: Boolean(req.query.mailfailed),
    });
  } catch (err) { next(err); }
});

router.get('/new', requireAdmin, async (req, res, next) => {
  try {
    const clients = isReady() ? await listClients() : [];
    const nextNum = isReady() ? await nextQuoteNumber() : `QT-${Date.now()}`;
    res.render('admin/quotes/form', {
      clients, nextNum,
      firebaseReady: isReady(),
      mailReady: mailReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.post('/new', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const client = body.clientId ? await getClient(body.clientId) : null;
    const quote = await createQuote({
      quoteNumber: body.quoteNumber,
      clientId: client?.id || null,
      clientName: client?.name || body.clientName || '',
      clientCompany: client?.company || body.clientCompany || '',
      clientEmail: client?.email || body.clientEmail || '',
      title: body.title,
      issueDate: body.issueDate,
      validUntil: body.validUntil,
      currency: body.currency || 'USD',
      sections: sectionsFromBody(body),
      notes: body.notes || '',
    });

    // Only email the client when the "Save & send" button was used.
    if (body.sendNow === '1') {
      try {
        await sendQuoteEmail(quote);
        await updateQuoteStatus(quote.id, 'sent', { sentAt: new Date().toISOString() });
        return res.redirect('/admin/quotes?created=1&sent=1');
      } catch (mailErr) {
        console.warn('[quotes] email failed on create:', mailErr.message);
        return res.redirect('/admin/quotes?created=1&mailfailed=1');
      }
    }
    res.redirect('/admin/quotes?created=1');
  } catch (err) { next(err); }
});

router.get('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const quote = await getQuote(req.params.id);
    if (!quote) return res.status(404).send('Quote not found');
    const clients = isReady() ? await listClients() : [];
    res.render('admin/quotes/form', {
      mode: 'edit',
      quote,
      clients,
      nextNum: quote.quoteNumber,
      firebaseReady: isReady(),
      mailReady: mailReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.post('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const client = body.clientId ? await getClient(body.clientId) : null;
    await updateQuote(req.params.id, {
      quoteNumber: body.quoteNumber,
      clientId: client?.id || body.clientId || null,
      clientName: client?.name || body.clientName || '',
      clientCompany: client?.company || body.clientCompany || '',
      clientEmail: client?.email || body.clientEmail || '',
      title: body.title,
      issueDate: body.issueDate,
      validUntil: body.validUntil,
      currency: body.currency || 'USD',
      sections: sectionsFromBody(body),
      notes: body.notes || '',
    });

    if (body.sendNow === '1') {
      const quote = await getQuote(req.params.id);
      try {
        await sendQuoteEmail(quote);
        await updateQuoteStatus(quote.id, 'sent', { sentAt: new Date().toISOString() });
        return res.redirect('/admin/quotes?updated=1&sent=1');
      } catch (mailErr) {
        console.warn('[quotes] email failed on edit:', mailErr.message);
        return res.redirect('/admin/quotes?updated=1&mailfailed=1');
      }
    }
    res.redirect('/admin/quotes?updated=1');
  } catch (err) { next(err); }
});

router.post('/:id/send', requireAdmin, async (req, res, next) => {
  try {
    const quote = await getQuote(req.params.id);
    if (!quote) return res.status(404).send('Quote not found');
    try {
      await sendQuoteEmail(quote);
      await updateQuoteStatus(quote.id, 'sent', { sentAt: new Date().toISOString() });
      res.redirect('/admin/quotes?sent=1');
    } catch (mailErr) {
      console.warn('[quotes] send failed:', mailErr.message);
      res.redirect('/admin/quotes?mailfailed=1');
    }
  } catch (err) { next(err); }
});

router.post('/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await deleteQuote(req.params.id);
    res.redirect('/admin/quotes?deleted=1');
  } catch (err) { next(err); }
});

/* ----------------------------- Email ----------------------------- */
async function sendQuoteEmail(quote) {
  if (!quote.clientEmail) throw new Error('This quote has no client email.');
  const currency = quote.currency || 'USD';
  const total = quoteTotal(quote);
  const brand = process.env.BUSINESS_NAME || 'Darsh';

  const rows = (quote.sections || []).map((s) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;">
        <div style="font-weight:600;color:#0a1f44;">${escapeHtml(s.title || '—')}</div>
        ${s.description ? `<div style="color:#6b7280;font-size:13px;margin-top:2px;">${escapeHtml(s.description).replace(/\n/g, '<br/>')}</div>` : ''}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;white-space:nowrap;">${money(s.price, currency)}</td>
    </tr>`).join('');

  const bodyHtml = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:24px;margin:0 0 8px;color:#0a1f44;">${escapeHtml(quote.title || 'Project Quote')}</h1>
    <p style="color:#6b7280;margin:0 0 24px;">Hi ${escapeHtml(quote.clientName || 'there')}, thanks for considering ${escapeHtml(brand)}. Here's a breakdown of what we'd build and the pricing.</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f7fb;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
      <tr>
        <td style="padding:4px 8px;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Quote</div><div style="font-weight:600;">${escapeHtml(quote.quoteNumber)}</div></td>
        <td style="padding:4px 8px;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Issued</div><div style="font-weight:600;">${escapeHtml(quote.issueDate || '—')}</div></td>
        ${quote.validUntil ? `<td style="padding:4px 8px;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Valid until</div><div style="font-weight:600;">${escapeHtml(quote.validUntil)}</div></td>` : ''}
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:8px;">
      <thead>
        <tr style="background:#0a1f44;color:#fff;">
          <th style="padding:10px 8px;text-align:left;font-size:12px;letter-spacing:0.6px;">SECTION</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;letter-spacing:0.6px;">PRICE</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="text-align:right;padding:14px 8px;font-weight:700;font-size:18px;border-top:2px solid #0a1f44;">Total</td>
        <td style="text-align:right;padding:14px 8px;font-weight:700;font-size:18px;border-top:2px solid #0a1f44;color:#0a1f44;width:140px;white-space:nowrap;">${money(total, currency)}</td>
      </tr>
    </table>

    ${quote.notes ? `<div style="background:#f6f7fb;padding:14px 16px;border-radius:8px;margin-bottom:24px;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px;">Notes</div>${escapeHtml(quote.notes).replace(/\n/g, '<br/>')}</div>` : ''}

    <p style="color:#6b7280;margin:0;">Happy with this? Just reply to this email and we'll get started. Questions or tweaks welcome too.</p>
  `;

  await sendMail({
    to: quote.clientEmail,
    subject: `${quote.title || 'Quote'} ${quote.quoteNumber} from ${brand}`,
    html: emailShell({ title: `Quote ${quote.quoteNumber}`, preheader: `Your quote from ${brand} — ${money(total, currency)}`, bodyHtml }),
  });
}

export default router;
