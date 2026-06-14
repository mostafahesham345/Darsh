import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { isReady } from '../lib/firebase.js';
import {
  listClients, getClient, createClient, updateClient, deleteClient,
} from '../lib/business.js';

const router = Router();

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const clients = isReady() ? await listClients() : [];
    res.render('admin/clients/index', {
      clients,
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
      flash: req.query.saved ? 'Client saved.' : req.query.deleted ? 'Client deleted.' : null,
    });
  } catch (err) { next(err); }
});

router.get('/new', requireAdmin, (req, res) => {
  res.render('admin/clients/form', {
    client: { name: '', company: '', email: '', phone: '', address: '', notes: '' },
    mode: 'new',
    firebaseReady: isReady(),
    adminEmail: req.session.admin.email,
  });
});

router.post('/new', requireAdmin, async (req, res, next) => {
  try {
    await createClient(req.body || {});
    res.redirect('/admin/clients?saved=1');
  } catch (err) { next(err); }
});

router.get('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const client = await getClient(req.params.id);
    if (!client) return res.status(404).send('Client not found');
    res.render('admin/clients/form', {
      client, mode: 'edit',
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.post('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    await updateClient(req.params.id, req.body || {});
    res.redirect('/admin/clients?saved=1');
  } catch (err) { next(err); }
});

router.post('/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await deleteClient(req.params.id);
    res.redirect('/admin/clients?deleted=1');
  } catch (err) { next(err); }
});

export default router;
