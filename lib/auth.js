// Session + passcode helpers for the admin route. No auth dependency; HMAC-signed
// cookie and scrypt password hashing, both via Node's built-in crypto module.
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'sa_admin';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadB64, secret) {
  return createHmac('sha256', secret).update(payloadB64).digest();
}

export function createSessionCookie(secret) {
  const exp = Date.now() + SESSION_TTL_MS;
  const payloadB64 = b64url(JSON.stringify({ exp }));
  const sigB64 = b64url(sign(payloadB64, secret));
  const token = `${payloadB64}.${sigB64}`;
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  const secureFlag = isProd ? ' Secure;' : ''; // allow http:// during local `vercel dev`
  return `${COOKIE_NAME}=${token}; HttpOnly;${secureFlag} SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

export function verifySession(req, secret) {
  const cookieHeader = req.headers.cookie || '';
  const found = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE_NAME}=`));
  if (!found) return false;
  const token = found.slice(COOKIE_NAME.length + 1);
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  let expectedSig, providedSig;
  try {
    expectedSig = sign(payloadB64, secret);
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return false;
  }
  if (providedSig.length !== expectedSig.length) return false;
  if (!timingSafeEqual(providedSig, expectedSig)) return false;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return false;
  }
  return typeof payload.exp === 'number' && payload.exp > Date.now();
}

// Constant-time compare via digest (sidesteps length-based short-circuiting entirely).
// Used only for the bootstrap ADMIN_PASSCODE env var; see verifyEffectivePasscode.
export function checkPasscode(candidate, expected) {
  if (typeof candidate !== 'string' || typeof expected !== 'string' || !expected) return false;
  const a = createHash('sha256').update(candidate).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

// Passcode hashing for the in-admin "change passcode" feature. Stored as "saltHex:hashHex"
// via lib/store.js (setPasscodeHash / getPasscodeHash); never as plaintext.
export function hashPasscode(plain) {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPasscodeHash(candidate, stored) {
  if (typeof candidate !== 'string' || typeof stored !== 'string') return false;
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(candidate, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Once a passcode has been changed from the admin panel, the stored hash is the source
// of truth and takes over from ADMIN_PASSCODE entirely; the env var only bootstraps the
// very first login. storedHash is passed in (from lib/store.js) rather than fetched here
// to keep this module free of any storage dependency.
export function verifyEffectivePasscode(candidate, storedHash, envPasscode) {
  if (storedHash) return verifyPasscodeHash(candidate, storedHash);
  return checkPasscode(candidate, envPasscode);
}

// Best-effort in-memory attempt counter (per warm lambda instance; resets on cold
// start). Combined with the flat delay in api/login.js this meaningfully slows brute
// force for a single-owner site without needing extra infrastructure.
const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function tooManyAttempts(key) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}
