import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { isReady } from '../lib/firebase.js';
import { listReviews, approveReview, unapproveReview, deleteReview } from '../lib/business.js';

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
        : null,
    });
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
