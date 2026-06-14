import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { ref, uploadBytes, getDownloadURL, deleteObject as deleteRef } from 'firebase/storage';
import { storage, isReady } from './firebase.js';

export async function uploadBuffer(buffer, originalName, mimetype) {
  if (!isReady()) throw new Error('Firebase Storage not initialized.');
  const ext = path.extname(originalName || '').toLowerCase() || '';
  const key = `uploads/${Date.now()}-${randomUUID()}${ext}`;
  const fileRef = ref(storage(), key);
  await uploadBytes(fileRef, buffer, { contentType: mimetype });
  const url = await getDownloadURL(fileRef);
  return { url, path: key };
}

export async function deleteObject(storagePath) {
  if (!isReady() || !storagePath) return;
  try {
    await deleteRef(ref(storage(), storagePath));
  } catch (err) {
    console.warn(`[storage] delete failed for ${storagePath}: ${err.message}`);
  }
}
