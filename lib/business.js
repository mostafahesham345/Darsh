import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db, isReady } from './firebase.js';

const CLIENTS = 'clients';
const INVOICES = 'invoices';
const PROJECTS = 'projects';
const CONTRACTS = 'contracts';
const LEADS = 'leads';
const REVIEWS = 'reviews';

function nowIso() {
  return new Date().toISOString();
}

/* ------------------------------ CLIENTS ------------------------------ */
export async function listClients() {
  if (!isReady()) return [];
  const snaps = await getDocs(query(collection(db(), CLIENTS), orderBy('createdAt', 'desc')));
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getClient(id) {
  if (!isReady()) return null;
  const snap = await getDoc(doc(db(), CLIENTS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createClient(data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const payload = {
    name: (data.name || '').trim(),
    company: (data.company || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    phone: (data.phone || '').trim(),
    address: (data.address || '').trim(),
    notes: (data.notes || '').trim(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const ref = await addDoc(collection(db(), CLIENTS), payload);
  return { id: ref.id, ...payload };
}

export async function updateClient(id, data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const payload = {
    name: (data.name || '').trim(),
    company: (data.company || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    phone: (data.phone || '').trim(),
    address: (data.address || '').trim(),
    notes: (data.notes || '').trim(),
    updatedAt: nowIso(),
  };
  await updateDoc(doc(db(), CLIENTS, id), payload);
  return { id, ...payload };
}

export async function deleteClient(id) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await deleteDoc(doc(db(), CLIENTS, id));
}

/* ---- Client portal auth (passwordless magic link) ---- */
export async function getClientByEmail(email) {
  if (!isReady()) return null;
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return null;
  const snaps = await getDocs(query(collection(db(), CLIENTS), where('email', '==', clean)));
  if (snaps.empty) return null;
  const d = snaps.docs[0];
  return { id: d.id, ...d.data() };
}

export async function setClientPortalToken(id, token, expiresAt) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await updateDoc(doc(db(), CLIENTS, id), {
    portalToken: token,
    portalTokenExp: expiresAt,
    updatedAt: nowIso(),
  });
}

export async function getClientByPortalToken(token) {
  if (!isReady() || !token) return null;
  const snaps = await getDocs(query(collection(db(), CLIENTS), where('portalToken', '==', token)));
  if (snaps.empty) return null;
  const d = snaps.docs[0];
  const data = { id: d.id, ...d.data() };
  if (!data.portalTokenExp || Date.now() > data.portalTokenExp) return null;
  return data;
}

export async function clearClientPortalToken(id) {
  if (!isReady()) return;
  try {
    await updateDoc(doc(db(), CLIENTS, id), { portalToken: null, portalTokenExp: null });
  } catch (err) {
    console.warn('[portal] could not clear token:', err.message);
  }
}

export async function listInvoicesByClient(clientId) {
  if (!isReady() || !clientId) return [];
  const all = await listInvoices();
  return all.filter((i) => i.clientId === clientId);
}

export async function listProjectsByClient(clientId) {
  if (!isReady() || !clientId) return [];
  const all = await listProjects();
  return all.filter((p) => p.clientId === clientId);
}

export async function listContractsByClient(clientId) {
  if (!isReady() || !clientId) return [];
  const all = await listContracts();
  return all.filter((c) => c.clientId === clientId);
}

/* ------------------------------ INVOICES ------------------------------ */
export async function listInvoices() {
  if (!isReady()) return [];
  const snaps = await getDocs(query(collection(db(), INVOICES), orderBy('createdAt', 'desc')));
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getInvoice(id) {
  if (!isReady()) return null;
  const snap = await getDoc(doc(db(), INVOICES, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function nextInvoiceNumber() {
  if (!isReady()) return `INV-${Date.now()}`;
  const snaps = await getDocs(collection(db(), INVOICES));
  const year = new Date().getFullYear();
  let max = 0;
  snaps.forEach((d) => {
    const n = d.data().invoiceNumber || '';
    const m = /^INV-(\d+)-(\d+)$/.exec(n);
    if (m && Number(m[1]) === year) {
      const v = Number(m[2]);
      if (v > max) max = v;
    }
  });
  return `INV-${year}-${String(max + 1).padStart(4, '0')}`;
}

export async function createInvoice(data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const payload = {
    invoiceNumber: data.invoiceNumber || (await nextInvoiceNumber()),
    clientId: data.clientId || null,
    clientName: data.clientName || '',
    clientCompany: data.clientCompany || '',
    clientEmail: data.clientEmail || '',
    clientAddress: data.clientAddress || '',
    issueDate: data.issueDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    dueDate: data.dueDate || '',
    currency: data.currency || 'USD',
    items: Array.isArray(data.items) ? data.items : [],
    taxRate: Number(data.taxRate) || 0,
    discount: Number(data.discount) || 0,
    notes: data.notes || '',
    status: 'draft',
    paidDate: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const ref = await addDoc(collection(db(), INVOICES), payload);
  return { id: ref.id, ...payload };
}

export async function updateInvoice(id, data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const payload = {
    invoiceNumber: data.invoiceNumber,
    clientId: data.clientId || null,
    clientName: data.clientName || '',
    clientCompany: data.clientCompany || '',
    clientEmail: data.clientEmail || '',
    clientAddress: data.clientAddress || '',
    issueDate: data.issueDate || '',
    dueDate: data.dueDate || '',
    currency: data.currency || 'USD',
    items: Array.isArray(data.items) ? data.items : [],
    taxRate: Number(data.taxRate) || 0,
    discount: Number(data.discount) || 0,
    notes: data.notes || '',
    updatedAt: nowIso(),
  };
  await updateDoc(doc(db(), INVOICES, id), payload);
  return { id, ...payload };
}

export async function updateInvoiceStatus(id, status, extras = {}) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const payload = { status, updatedAt: nowIso(), ...extras };
  await updateDoc(doc(db(), INVOICES, id), payload);
}

export async function deleteInvoice(id) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await deleteDoc(doc(db(), INVOICES, id));
}

export function invoiceTotal(invoice) {
  const subtotal = (invoice.items || []).reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.rate) || 0), 0);
  const tax = subtotal * ((Number(invoice.taxRate) || 0) / 100);
  const discount = Number(invoice.discount) || 0;
  return Math.max(0, subtotal + tax - discount);
}

/* ------------------------------ PROJECTS ------------------------------ */
export const PROJECT_STAGES = [
  { key: 'discovery', label: 'Discovery & Planning', description: 'Requirements gathering, kickoff meeting, and scope definition.' },
  { key: 'design', label: 'Design & Prototyping', description: 'UI/UX design, wireframes, mockups, and stakeholder review.' },
  { key: 'development', label: 'Development', description: 'Engineering work — frontend, backend, integrations.' },
  { key: 'draft', label: 'Draft Review', description: 'First complete build ready for client review and feedback.' },
  { key: 'revisions', label: 'Revisions & QA', description: 'Incorporating feedback, testing, bug fixes, and quality assurance.' },
  { key: 'delivery', label: 'Delivery & Handoff', description: 'Deployment, documentation, and project handoff.' },
  { key: 'done', label: 'Completed', description: 'Project delivered and closed out.' },
];

export async function listProjects() {
  if (!isReady()) return [];
  const snaps = await getDocs(query(collection(db(), PROJECTS), orderBy('createdAt', 'desc')));
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProject(id) {
  if (!isReady()) return null;
  const snap = await getDoc(doc(db(), PROJECTS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createProject(data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const stage = data.stage || 'discovery';
  const payload = {
    name: (data.name || '').trim(),
    description: (data.description || '').trim(),
    clientId: data.clientId || null,
    clientName: data.clientName || '',
    clientEmail: data.clientEmail || '',
    stage,
    stageHistory: [{ stage, at: nowIso(), note: 'Project initialized.' }],
    startDate: data.startDate || new Date().toISOString().slice(0, 10),
    targetDate: data.targetDate || '',
    budget: data.budget || '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const ref = await addDoc(collection(db(), PROJECTS), payload);
  return { id: ref.id, ...payload };
}

export async function updateProject(id, data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const payload = {
    name: (data.name || '').trim(),
    description: (data.description || '').trim(),
    clientId: data.clientId || null,
    clientName: data.clientName || '',
    clientEmail: data.clientEmail || '',
    startDate: data.startDate || '',
    targetDate: data.targetDate || '',
    budget: data.budget || '',
    updatedAt: nowIso(),
  };
  await updateDoc(doc(db(), PROJECTS, id), payload);
  return { id, ...payload };
}

export async function updateProjectStage(id, stage, note = '') {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const existing = await getProject(id);
  if (!existing) throw new Error('Project not found.');
  const history = Array.isArray(existing.stageHistory) ? existing.stageHistory : [];
  history.push({ stage, at: nowIso(), note: note || `Advanced to ${stage}.` });
  await updateDoc(doc(db(), PROJECTS, id), {
    stage,
    stageHistory: history,
    updatedAt: nowIso(),
  });
  return { ...existing, stage, stageHistory: history };
}

export async function deleteProject(id) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await deleteDoc(doc(db(), PROJECTS, id));
}

export function stageMeta(key) {
  return PROJECT_STAGES.find((s) => s.key === key) || { key, label: key, description: '' };
}

/* ------------------------------ CONTRACTS ------------------------------ */
export async function listContracts() {
  if (!isReady()) return [];
  const snaps = await getDocs(query(collection(db(), CONTRACTS), orderBy('createdAt', 'desc')));
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getContract(id) {
  if (!isReady()) return null;
  const snap = await getDoc(doc(db(), CONTRACTS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createContract(data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const payload = {
    title: data.title || 'Service Agreement',
    contractNumber: data.contractNumber || `DRSH-${Date.now().toString().slice(-6)}`,
    effectiveDate: data.effectiveDate || '',
    clientId: data.clientId || null,
    clientName: data.clientName || '',
    clientCompany: data.clientCompany || '',
    clientEmail: data.clientEmail || '',
    clientAddress: data.clientAddress || '',
    projectDescription: data.projectDescription || '',
    scope: data.scope || '',
    deliverables: data.deliverables || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    milestones: data.milestones || '',
    totalFee: data.totalFee || '',
    currency: data.currency || 'USD',
    paymentTerms: data.paymentTerms || '',
    paymentSchedule: data.paymentSchedule || '',
    ipClause: data.ipClause || '',
    confidentialityClause: data.confidentialityClause || '',
    terminationClause: data.terminationClause || '',
    additionalTerms: data.additionalTerms || '',
    // Provider signs on creation; client signature is pending until they sign in the portal.
    status: 'pending',
    providerSignature: (data.providerSignature || '').trim() || 'Darsh',
    providerSignedAt: nowIso(),
    clientSignature: null,
    clientSignedAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const ref = await addDoc(collection(db(), CONTRACTS), payload);
  return { id: ref.id, ...payload };
}

export async function updateContract(id, data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const existing = await getContract(id);
  const payload = {
    title: data.title || 'Service Agreement',
    contractNumber: data.contractNumber || existing?.contractNumber || `DRSH-${Date.now().toString().slice(-6)}`,
    effectiveDate: data.effectiveDate || '',
    clientId: data.clientId || null,
    clientName: data.clientName || '',
    clientCompany: data.clientCompany || '',
    clientEmail: data.clientEmail || '',
    clientAddress: data.clientAddress || '',
    projectDescription: data.projectDescription || '',
    scope: data.scope || '',
    deliverables: data.deliverables || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    milestones: data.milestones || '',
    totalFee: data.totalFee || '',
    currency: data.currency || 'USD',
    paymentTerms: data.paymentTerms || '',
    paymentSchedule: data.paymentSchedule || '',
    ipClause: data.ipClause || '',
    confidentialityClause: data.confidentialityClause || '',
    terminationClause: data.terminationClause || '',
    additionalTerms: data.additionalTerms || '',
    // Preserve signature state across edits.
    status: existing?.status || 'pending',
    providerSignature: (data.providerSignature || '').trim() || existing?.providerSignature || 'Darsh',
    providerSignedAt: existing?.providerSignedAt || nowIso(),
    clientSignature: existing?.clientSignature || null,
    clientSignedAt: existing?.clientSignedAt || null,
    updatedAt: nowIso(),
  };
  await updateDoc(doc(db(), CONTRACTS, id), payload);
  return { id, ...payload };
}

export async function signContract(id, signature) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const sig = (signature || '').trim();
  if (!sig) throw new Error('Signature required.');
  const payload = {
    clientSignature: sig,
    clientSignedAt: nowIso(),
    status: 'signed',
    updatedAt: nowIso(),
  };
  await updateDoc(doc(db(), CONTRACTS, id), payload);
  return payload;
}

export async function deleteContract(id) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await deleteDoc(doc(db(), CONTRACTS, id));
}

/* ------------------------------ LEADS (contact form) ------------------------------ */
export async function createLead(data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  const payload = {
    name: (data.name || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    company: (data.company || '').trim(),
    message: (data.message || '').trim(),
    source: (data.source || 'website').trim(),
    userAgent: (data.userAgent || '').slice(0, 300),
    status: 'new',
    createdAt: nowIso(),
  };
  const ref = await addDoc(collection(db(), LEADS), payload);
  return { id: ref.id, ...payload };
}

export async function listLeads() {
  if (!isReady()) return [];
  const snaps = await getDocs(query(collection(db(), LEADS), orderBy('createdAt', 'desc')));
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function countNewLeads() {
  if (!isReady()) return 0;
  try {
    const snaps = await getDocs(query(collection(db(), LEADS), where('status', '==', 'new')));
    return snaps.size;
  } catch {
    return 0;
  }
}

export async function markLeadRead(id) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await updateDoc(doc(db(), LEADS, id), { status: 'read', updatedAt: nowIso() });
}

export async function deleteLead(id) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await deleteDoc(doc(db(), LEADS, id));
}

/* ------------------------------ REVIEWS ------------------------------ */
export async function createReview(data) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  let rating = Math.round(Number(data.rating) || 0);
  rating = Math.max(1, Math.min(5, rating));
  const payload = {
    name: (data.name || '').trim(),
    role: (data.role || '').trim(),     // optional company / role
    rating,
    text: (data.text || '').trim(),
    status: 'pending',
    createdAt: nowIso(),
    approvedAt: null,
  };
  const ref = await addDoc(collection(db(), REVIEWS), payload);
  return { id: ref.id, ...payload };
}

export async function listReviews() {
  if (!isReady()) return [];
  const snaps = await getDocs(query(collection(db(), REVIEWS), orderBy('createdAt', 'desc')));
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listApprovedReviews() {
  if (!isReady()) return [];
  try {
    const all = await listReviews();
    return all.filter((r) => r.status === 'approved');
  } catch {
    return [];
  }
}

export async function countPendingReviews() {
  if (!isReady()) return 0;
  try {
    const snaps = await getDocs(query(collection(db(), REVIEWS), where('status', '==', 'pending')));
    return snaps.size;
  } catch {
    return 0;
  }
}

export async function approveReview(id) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await updateDoc(doc(db(), REVIEWS, id), { status: 'approved', approvedAt: nowIso() });
}

export async function unapproveReview(id) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await updateDoc(doc(db(), REVIEWS, id), { status: 'pending', approvedAt: null });
}

export async function deleteReview(id) {
  if (!isReady()) throw new Error('Firebase not initialized.');
  await deleteDoc(doc(db(), REVIEWS, id));
}
