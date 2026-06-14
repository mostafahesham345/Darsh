import { doc, getDoc, setDoc } from 'firebase/firestore';
import { defaults } from '../lib/defaults.js';
import { db, isReady } from '../lib/firebase.js';

if (!isReady()) {
  console.error('[seed] Firebase not initialized. Check FIREBASE_* keys in .env.');
  process.exit(1);
}

const COLLECTION = 'websiteContent';
const force = process.argv.includes('--force');

for (const [key, value] of Object.entries(defaults)) {
  const ref = doc(db(), COLLECTION, key);
  const snap = await getDoc(ref);
  if (snap.exists() && !force) {
    console.log(`[seed] skip ${key} (exists). Pass --force to overwrite.`);
    continue;
  }
  await setDoc(ref, { ...value, updatedAt: new Date().toISOString() });
  console.log(`[seed] wrote ${key}`);
}

console.log('[seed] done.');
process.exit(0);
