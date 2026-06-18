import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { isReady } from '../lib/firebase.js';
import { listReviews, approveReview, unapproveReview, deleteReview } from '../lib/business.js';
import { sendMail, emailShell, escapeHtml, mailReady } from '../lib/mail.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function baseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

const router = Router();

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const all = isReady() ? await listReviews() : [];
    res.render('admin/reviews/index', {
      pending: all.filter((r) => r.status === 'pending'),
      approved: all.filter((r) => r.status === 'approved'),
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
      flash: req.query.approved ? 'Review approved — now live on your website.'
        : req.query.unapproved ? 'Review hidden from the website.'
        : req.query.deleted ? 'Review deleted.'
        : req.query.sent ? `Review request sent to ${req.query.sent}.`
        : null,
      error: req.query.error === 'email' ? 'Please enter a valid email address.'
        : req.query.error === 'mail' ? 'Could not send the email — check your SMTP settings.'
        : null,
    });
  } catch (err) { next(err); }
});

router.post('/request', requireAdmin, async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim();
    if (!EMAIL_RE.test(email)) return res.redirect('/admin/reviews?error=email');
    if (!mailReady()) return res.redirect('/admin/reviews?error=mail');

    const brand = process.env.BUSINESS_NAME || 'Darsh';
    const link = `${baseUrl(req)}/review`;
    const bodyHtml = `
      <h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;margin:0 0 8px;color:#0a1f44;">How did we do?</h1>
      <p style="color:#374151;margin:0 0 16px;line-height:1.6;">Thanks for working with ${escapeHtml(brand)}. If you have a minute, we'd love to hear your honest feedback — it helps us a lot and lets others know what to expect.</p>
      <p style="margin:0 0 26px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#0a1f44;color:#f7e27e;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;">Leave a review</a></p>
      <p style="color:#6b7280;margin:0;font-size:13px;">It takes less than a minute. Thank you!</p>
    `;
    try {
      await sendMail({
        to: email,
        subject: `Mind leaving ${brand} a quick review?`,
        html: emailShell({ title: 'Leave a review', preheader: `We'd love your feedback on working with ${brand}.`, bodyHtml }),
      });
    } catch (e) {
      console.warn('[reviews] request email failed:', e.message);
      return res.redirect('/admin/reviews?error=mail');
    }
    res.redirect(`/admin/reviews?sent=${encodeURIComponent(email)}`);
  } catch (err) { next(err); }
});

router.post('/:id/approve', requireAdmin, async (req, res, next) => {
  try { await approveReview(req.params.id); res.redirect('/admin/reviews?approved=1'); }
  catch (err) { next(err); }
});

router.post('/:id/unapprove', requireAdmin, async (req, res, next) => {
  try { await unapproveReview(req.params.id); res.redirect('/admin/reviews?unapproved=1'); }
  catch (err) { next(err); }
});

router.post('/:id/delete', requireAdmin, async (req, res, next) => {
  try { await deleteReview(req.params.id); res.redirect('/admin/reviews?deleted=1'); }
  catch (err) { next(err); }
});

export default router;
