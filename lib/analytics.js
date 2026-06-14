import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, isReady } from './firebase.js';

const COLLECTION = 'analytics';
const TOTAL_DOC = 'totals';
const DAILY_COLL = 'daily';

function today() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function trackVisit(isNew = false) {
  if (!isReady()) return;
  try {
    const now = new Date().toISOString();
    const totalsRef = doc(db(), COLLECTION, TOTAL_DOC);
    const snap = await getDoc(totalsRef);
    const prev = snap.exists() ? snap.data() : {};
    await setDoc(totalsRef, {
      total: (prev.total || 0) + 1,                         // every page view
      uniqueTotal: (prev.uniqueTotal || 0) + (isNew ? 1 : 0), // distinct visitors
      firstSeen: prev.firstSeen || now,
      lastSeen: now,
    }, { merge: true });

    const dayKey = today();
    const dayRef = doc(db(), COLLECTION, TOTAL_DOC, DAILY_COLL, dayKey);
    const daySnap = await getDoc(dayRef);
    const prevDay = daySnap.exists() ? daySnap.data() : {};
    await setDoc(dayRef, {
      date: dayKey,
      count: (prevDay.count || 0) + 1,                      // page views that day
      unique: (prevDay.unique || 0) + (isNew ? 1 : 0),      // new visitors that day
    }, { merge: true });
  } catch (err) {
    console.warn('[analytics] track failed:', err.message);
  }
}

export async function getStats() {
  if (!isReady()) {
    return { total: 0, uniqueTotal: 0, todayUnique: 0, last7: [], last30Total: 0, firstSeen: null, lastSeen: null, firebaseReady: false };
  }
  try {
    const totalsSnap = await getDoc(doc(db(), COLLECTION, TOTAL_DOC));
    const totals = totalsSnap.exists() ? totalsSnap.data() : {};

    const dailySnaps = await getDocs(
      query(collection(db(), COLLECTION, TOTAL_DOC, DAILY_COLL), orderBy('date', 'desc'), limit(30))
    );
    const byDateUnique = {};
    dailySnaps.forEach((d) => { byDateUnique[d.id] = d.data().unique || 0; });

    const last7 = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
      last7.push({ date: key, count: byDateUnique[key] || 0, label: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }) });
    }

    // New visitors over the last 30 days (distinct, not recurring).
    const last30Total = Object.values(byDateUnique).reduce((a, b) => a + b, 0);

    return {
      total: totals.total || 0,             // all page views
      uniqueTotal: totals.uniqueTotal || 0, // distinct new visitors (all time)
      todayUnique: byDateUnique[today()] || 0,
      last7,                                 // new visitors per day
      last30Total,                           // new visitors, last 30 days
      firstSeen: totals.firstSeen || null,
      lastSeen: totals.lastSeen || null,
      firebaseReady: true,
    };
  } catch (err) {
    console.warn('[analytics] stats failed:', err.message);
    return { total: 0, uniqueTotal: 0, todayUnique: 0, last7: [], last30Total: 0, firstSeen: null, lastSeen: null, firebaseReady: true, error: err.message };
  }
}
