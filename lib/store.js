// Storage abstraction: Vercel Blob in production, a local .data/ directory in dev.
// Selected automatically by the presence of BLOB_READ_WRITE_TOKEN — Vercel injects
// this once a Blob store is attached to the project; `vercel dev` has no such token
// unless you pull it with `vercel env pull`, so local runs fall through to disk.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const DATA_DIR = join(process.cwd(), '.data');
const PROFILE_PATH = join(DATA_DIR, 'profile.json');
const UPLOADS_DIR = join(DATA_DIR, 'uploads');
const SECRET_PATH = join(DATA_DIR, 'admin-secret.json');

function ensureDirs() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function isBlobMode() {
  return USE_BLOB;
}

export async function getProfile() {
  if (USE_BLOB) {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'profile.json', limit: 1 });
    const found = blobs.find((b) => b.pathname === 'profile.json');
    if (!found) return null;
    const res = await fetch(found.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  }
  ensureDirs();
  if (!existsSync(PROFILE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(PROFILE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

export async function setProfile(profile) {
  const json = JSON.stringify(profile, null, 2);
  if (USE_BLOB) {
    const { put } = await import('@vercel/blob');
    await put('profile.json', json, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return profile;
  }
  ensureDirs();
  writeFileSync(PROFILE_PATH, json, 'utf8');
  return profile;
}

// kind: 'resume' | 'photo'. Returns the public URL to store on the profile.
export async function saveUpload(kind, buffer, contentType, ext) {
  const key = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  if (USE_BLOB) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${key}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }
  ensureDirs();
  writeFileSync(join(UPLOADS_DIR, key), buffer);
  return `/api/uploads/${key}`;
}

// Dev-only: read back a locally-stored upload by key (see api/uploads/[key].js).
// Rejects anything that isn't a bare filename to stay inside UPLOADS_DIR.
export function readLocalUpload(key) {
  if (typeof key !== 'string' || !/^[a-z]+-[0-9]+-[a-z0-9]+\.[a-z0-9]+$/i.test(key)) return null;
  const path = join(UPLOADS_DIR, key);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

// The changed-in-admin passcode hash. Absent until "Change passcode" is used for the
// first time, at which point it takes over from ADMIN_PASSCODE entirely (see
// verifyEffectivePasscode in lib/auth.js).
//
// In Blob mode this deliberately does NOT use a stable, predictable pathname the way
// profile.json does — @vercel/blob's "public" access means anyone who has (or guesses)
// a blob's URL can fetch it directly, so a passcode hash needs an unguessable pathname
// rather than a public one. The random hex suffix here supplies that (128 bits, the same
// order of entropy as a real bearer secret); the file is located via list() with the
// BLOB_READ_WRITE_TOKEN, which only this server ever holds.
export async function getPasscodeHash() {
  if (USE_BLOB) {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'admin-secret-' });
    if (!blobs.length) return null;
    const latest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const res = await fetch(latest.url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data && typeof data.hash === 'string' ? data.hash : null;
  }
  ensureDirs();
  if (!existsSync(SECRET_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(SECRET_PATH, 'utf8'));
    return typeof data.hash === 'string' ? data.hash : null;
  } catch {
    return null;
  }
}

export async function setPasscodeHash(hash) {
  if (USE_BLOB) {
    const { put, list, del } = await import('@vercel/blob');
    // Clean up any previous admin-secret blob(s) so a leaked old URL stops working
    // once the passcode is changed, and so they don't quietly accumulate over time.
    const { blobs } = await list({ prefix: 'admin-secret-' });
    if (blobs.length) await del(blobs.map((b) => b.url));
    const suffix = randomBytes(16).toString('hex');
    await put(`admin-secret-${suffix}.json`, JSON.stringify({ hash }), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, // already unique and unguessable via the hex suffix above
    });
    return;
  }
  ensureDirs();
  writeFileSync(SECRET_PATH, JSON.stringify({ hash }), 'utf8');
}
