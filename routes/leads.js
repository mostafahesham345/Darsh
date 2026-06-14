import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { isReady } from '../lib/firebase.js';
import { listLeads, markLeadRead, deleteLead } from '../lib/business.js';

const router = Router();

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const leads = isReady() ? await listLeads() : [];
    res.render('admin/leads/index', {
      leads,
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
      flash: req.query.read ? 'Lead marked as read.'
        : req.query.deleted ? 'Lead deleted.'
        : null,
    });
  } catch (err) { next(err); }
});

router.post('/:id/read', requireAdmin, async (req, res, next) => {
  try {
    await markLeadRead(req.params.id);
    res.redirect('/admin/leads?read=1');
  } catch (err) { next(err); }
});

router.post('/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await deleteLead(req.params.id);
    res.redirect('/admin/leads?deleted=1');
  } catch (err) { next(err); }
});

export default router;
