import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let app = null;
let firestoreDb = null;
let storageBucket = null;
let initError = null;

try {
  if (!process.env.FIREBASE_API_KEY) {
    throw new Error('FIREBASE_API_KEY missing from .env');
  }
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
  app = initializeApp(config);
  firestoreDb = getFirestore(app);
  storageBucket = getStorage(app);
  console.log(`[firebase] initialized for project "${config.projectId}"`);
} catch (err) {
  initError = err;
  console.warn(`[firebase] not initialized — ${err.message}. Running in fallback mode.`);
}

export function isReady() {
  return app !== null;
}

export function getInitError() {
  return initError;
}

export function db() {
  if (!firestoreDb) throw new Error('Firebase not initialized.');
  return firestoreDb;
}

export function storage() {
  if (!storageBucket) throw new Error('Firebase Storage not initialized.');
  return storageBucket;
}
