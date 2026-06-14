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

export async function trackVisit() {
  if (!isReady()) return;
  try {
    const totalsRef = doc(db(), COLLECTION, TOTAL_DOC);
    const snap = await getDoc(totalsRef);
    const prev = snap.exists() ? snap.data() : { total: 0, firstSeen: new Date().toISOString() };
    await setDoc(totalsRef, {
      total: (prev.total || 0) + 1,
      firstSeen: prev.firstSeen || new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });

    const dayKey = today();
    const dayRef = doc(db(), COLLECTION, TOTAL_DOC, DAILY_COLL, dayKey);
    const daySnap = await getDoc(dayRef);
    const prevDay = daySnap.exists() ? daySnap.data() : { count: 0 };
    await setDoc(dayRef, { count: (prevDay.count || 0) + 1, date: dayKey });
  } catch (err) {
    console.warn('[analytics] track failed:', err.message);
  }
}

export async function getStats() {
  if (!isReady()) {
    return { total: 0, today: 0, last7: [], last30Total: 0, firstSeen: null, lastSeen: null, firebaseReady: false };
  }
  try {
    const totalsSnap = await getDoc(doc(db(), COLLECTION, TOTAL_DOC));
    const totals = totalsSnap.exists() ? totalsSnap.data() : { total: 0 };

    const dailySnaps = await getDocs(
      query(collection(db(), COLLECTION, TOTAL_DOC, DAILY_COLL), orderBy('date', 'desc'), limit(30))
    );
    const byDate = {};
    dailySnaps.forEach((d) => { byDate[d.id] = d.data().count || 0; });

    const last7 = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
      last7.push({ date: key, count: byDate[key] || 0, label: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }) });
    }

    const last30Total = Object.values(byDate).reduce((a, b) => a + b, 0);

    return {
      total: totals.total || 0,
      today: byDate[today()] || 0,
      last7,
      last30Total,
      firstSeen: totals.firstSeen || null,
      lastSeen: totals.lastSeen || null,
      firebaseReady: true,
    };
  } catch (err) {
    console.warn('[analytics] stats failed:', err.message);
    return { total: 0, today: 0, last7: [], last30Total: 0, firstSeen: null, lastSeen: null, firebaseReady: true, error: err.message };
  }
}
