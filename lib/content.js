import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db, isReady } from './firebase.js';
import { defaults } from './defaults.js';

const COLLECTION = 'websiteContent';

export async function getSection(key) {
  if (!isReady()) return defaults[key] ?? null;
  try {
    const snap = await getDoc(doc(db(), COLLECTION, key));
    if (!snap.exists()) return defaults[key] ?? null;
    return snap.data();
  } catch (err) {
    console.warn(`[content] read failed for ${key}: ${err.message}. Using default.`);
    return defaults[key] ?? null;
  }
}

export async function getAllSections() {
  const out = {};
  if (!isReady()) {
    return { ...defaults };
  }
  try {
    const snaps = await getDocs(collection(db(), COLLECTION));
    snaps.forEach((d) => {
      out[d.id] = d.data();
    });
  } catch (err) {
    console.warn(`[content] read failed: ${err.message}. Using defaults.`);
  }
  for (const key of Object.keys(defaults)) {
    if (!out[key]) out[key] = defaults[key];
  }
  return out;
}

export async function saveSection(key, data) {
  if (!isReady()) throw new Error('Firebase not initialized — cannot save.');
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db(), COLLECTION, key), payload);
  return payload;
}

export function sectionKeys() {
  return Object.keys(defaults);
}

export { defaults };
