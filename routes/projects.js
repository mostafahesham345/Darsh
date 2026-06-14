import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { isReady } from '../lib/firebase.js';
import {
  listClients, getClient,
  listProjects, getProject, createProject, updateProject, updateProjectStage, deleteProject,
  PROJECT_STAGES, stageMeta,
} from '../lib/business.js';
import { sendMail, emailShell, escapeHtml, mailReady } from '../lib/mail.js';

const router = Router();

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const projects = isReady() ? await listProjects() : [];
    res.render('admin/projects/index', {
      projects,
      stages: PROJECT_STAGES,
      stageMeta,
      firebaseReady: isReady(),
      mailReady: mailReady(),
      adminEmail: req.session.admin.email,
      flash: req.query.created ? (req.query.mailfailed ? 'Project created, but the client email could not be sent.' : 'Project created — client notified.')
        : req.query.updated ? (req.query.mailfailed ? 'Stage updated, but the client email could not be sent.' : 'Stage updated — client notified.')
        : req.query.edited ? 'Project details saved.'
        : req.query.deleted ? 'Project deleted.'
        : null,
      flashWarn: Boolean(req.query.mailfailed),
    });
  } catch (err) { next(err); }
});

router.get('/new', requireAdmin, async (req, res, next) => {
  try {
    const clients = isReady() ? await listClients() : [];
    res.render('admin/projects/form', {
      clients,
      stages: PROJECT_STAGES,
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.post('/new', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const client = body.clientId ? await getClient(body.clientId) : null;
    const project = await createProject({
      name: body.name,
      description: body.description,
      clientId: client?.id || null,
      clientName: client?.name || body.clientName || '',
      clientEmail: client?.email || body.clientEmail || '',
      stage: body.stage || 'discovery',
      startDate: body.startDate,
      targetDate: body.targetDate,
      budget: body.budget,
    });
    const mailed = await safeSend(() => sendStageEmail(project, body.stage || 'discovery', 'Project initialized.'));
    res.redirect(`/admin/projects?created=1${mailed ? '' : '&mailfailed=1'}`);
  } catch (err) { next(err); }
});

router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) return res.status(404).send('Project not found');
    res.render('admin/projects/view', {
      project,
      stages: PROJECT_STAGES,
      stageMeta,
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.get('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) return res.status(404).send('Project not found');
    const clients = isReady() ? await listClients() : [];
    res.render('admin/projects/form', {
      mode: 'edit',
      project,
      clients,
      stages: PROJECT_STAGES,
      firebaseReady: isReady(),
      adminEmail: req.session.admin.email,
    });
  } catch (err) { next(err); }
});

router.post('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const client = body.clientId ? await getClient(body.clientId) : null;
    await updateProject(req.params.id, {
      name: body.name,
      description: body.description,
      clientId: client?.id || body.clientId || null,
      clientName: client?.name || body.clientName || '',
      clientEmail: client?.email || body.clientEmail || '',
      startDate: body.startDate,
      targetDate: body.targetDate,
      budget: body.budget,
    });
    res.redirect('/admin/projects?edited=1');
  } catch (err) { next(err); }
});

router.post('/:id/stage', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const stage = body.stage;
    const note = body.note || '';
    const project = await updateProjectStage(req.params.id, stage, note);
    const mailed = await safeSend(() => sendStageEmail(project, stage, note));
    res.redirect(`/admin/projects?updated=1${mailed ? '' : '&mailfailed=1'}`);
  } catch (err) { next(err); }
});

router.post('/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await deleteProject(req.params.id);
    res.redirect('/admin/projects?deleted=1');
  } catch (err) { next(err); }
});

async function safeSend(fn) {
  try {
    await fn();
    return true;
  } catch (err) {
    console.warn('[projects] stage email failed:', err.message);
    return false;
  }
}

async function sendStageEmail(project, stageKey, note) {
  if (!project.clientEmail) return;
  const meta = stageMeta(stageKey);
  const stepIndex = PROJECT_STAGES.findIndex((s) => s.key === stageKey);
  const total = PROJECT_STAGES.length;
  const pct = Math.round(((stepIndex + 1) / total) * 100);

  const subjectMap = {
    discovery: 'kicked off',
    design: 'entering design',
    development: 'in development',
    draft: 'draft ready for review',
    revisions: 'in revisions',
    delivery: 'ready for delivery',
    done: 'completed',
  };
  const subjectTag = subjectMap[stageKey] || `updated to ${meta.label}`;

  const progressBar = PROJECT_STAGES.map((s, i) => {
    const active = i <= stepIndex;
    return `<td style="padding:0 3px;"><div style="height:6px;border-radius:3px;background:${active ? '#f7e27e' : '#e5e7eb'};"></div></td>`;
  }).join('');

  const timeline = (project.stageHistory || []).slice().reverse().slice(0, 5).map((h) => {
    const m = stageMeta(h.stage);
    const when = new Date(h.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `<tr>
      <td style="padding:8px 10px;border-left:3px solid #f7e27e;background:#fafbff;border-radius:6px;">
        <div style="font-weight:600;color:#0a1f44;font-size:13px;">${escapeHtml(m.label)}</div>
        <div style="color:#6b7280;font-size:12px;">${when}${h.note ? ' — ' + escapeHtml(h.note) : ''}</div>
      </td>
    </tr><tr><td style="height:6px;"></td></tr>`;
  }).join('');

  const bodyHtml = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:24px;margin:0 0 8px;color:#0a1f44;">${escapeHtml(project.name)} — ${escapeHtml(meta.label)}</h1>
    <p style="color:#6b7280;margin:0 0 24px;">Hi ${escapeHtml(project.clientName || 'there')}, here's a quick update on your project.</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f7fb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:6px;">Current stage</div>
          <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:22px;color:#0a1f44;margin-bottom:6px;">${escapeHtml(meta.label)}</div>
          <div style="color:#6b7280;font-size:13px;">${escapeHtml(meta.description)}</div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Progress</div>
          <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:22px;color:#0a1f44;">${pct}%</div>
        </td>
      </tr>
      <tr><td colspan="2" style="padding-top:16px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>${progressBar}</tr></table></td></tr>
    </table>

    ${note ? `<div style="background:#fff7d6;border-left:4px solid #f7e27e;padding:14px 16px;border-radius:6px;margin-bottom:24px;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px;">Note from the team</div>${escapeHtml(note).replace(/\n/g, '<br/>')}</div>` : ''}

    ${timeline ? `<div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:10px;">Recent activity</div><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">${timeline}</table>` : ''}

    <p style="color:#6b7280;margin:24px 0 0;">Questions or feedback? Just reply — we're listening.</p>
  `;

  await sendMail({
    to: project.clientEmail,
    subject: `${project.name} — ${subjectTag}`,
    html: emailShell({ title: `${project.name} update`, preheader: `${project.name} is now ${meta.label.toLowerCase()} (${pct}% complete)`, bodyHtml }),
  });
}

export default router;
