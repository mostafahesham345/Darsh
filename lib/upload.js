import crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { ref, uploadBytes, getDownloadURL, deleteObject as deleteRef } from 'firebase/storage';
import { storage, isReady } from './firebase.js';

/* ---------------------------------------------------------------------------
   Cloudinary (preferred) — signed REST upload, no SDK dependency.
   Falls back to Firebase Storage if Cloudinary isn't configured.
   --------------------------------------------------------------------------- */
function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function uploadConfigured() {
  return cloudinaryConfigured() || isReady();
}

function sign(params, apiSecret) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

async function uploadToCloudinary(buffer, mimetype) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || 'darsh';
  const timestamp = Math.floor(Date.now() / 1000);

  // Only the params Cloudinary requires in the signature (alphabetical).
  const signature = sign({ folder, timestamp }, apiSecret);

  const dataUri = `data:${mimetype || 'image/png'};base64,${buffer.toString('base64')}`;
  const form = new FormData();
  form.append('file', dataUri);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Cloudinary upload failed (${res.status})`);
  }
  // `path` stores the public_id so we can delete later.
  return { url: json.secure_url, path: `cloudinary:${json.public_id}` };
}

async function destroyCloudinary(publicId) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp }, apiSecret);
  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: 'POST', body: form });
}

/* --------------------------------------------------------------------------- */
export async function uploadBuffer(buffer, originalName, mimetype) {
  if (cloudinaryConfigured()) {
    return uploadToCloudinary(buffer, mimetype);
  }
  // Fallback: Firebase Storage
  if (!isReady()) throw new Error('No image storage configured (set Cloudinary or Firebase).');
  const ext = path.extname(originalName || '').toLowerCase() || '';
  const key = `uploads/${Date.now()}-${randomUUID()}${ext}`;
  const fileRef = ref(storage(), key);
  await uploadBytes(fileRef, buffer, { contentType: mimetype });
  const url = await getDownloadURL(fileRef);
  return { url, path: key };
}

export async function deleteObject(storagePath) {
  if (!storagePath) return;
  try {
    if (storagePath.startsWith('cloudinary:')) {
      await destroyCloudinary(storagePath.slice('cloudinary:'.length));
      return;
    }
    if (isReady()) await deleteRef(ref(storage(), storagePath));
  } catch (err) {
    console.warn(`[storage] delete failed for ${storagePath}: ${err.message}`);
  }
}
