import { tooManyAttempts, createSessionCookie, verifyEffectivePasscode } from '../lib/auth.js';
import { getPasscodeHash } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (tooManyAttempts(ip)) {
    res.status(429).json({ error: 'too many attempts, try again later' });
    return;
  }

  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) {
    res.status(500).json({ error: 'admin auth is not configured on the server' });
    return;
  }

  const storedHash = await getPasscodeHash();
  const envPasscode = process.env.ADMIN_PASSCODE;
  // ADMIN_PASSCODE is only required as the bootstrap credential before a passcode has
  // ever been set from the admin panel — once storedHash exists, it's not consulted.
  if (!storedHash && !envPasscode) {
    res.status(500).json({ error: 'admin auth is not configured on the server' });
    return;
  }

  const body = req.body || {};
  const pin = typeof body.pin === 'string' ? body.pin : '';

  // Flat delay slows brute force even right after a cold start, when the in-memory
  // attempt counter above has just reset.
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!verifyEffectivePasscode(pin, storedHash, envPasscode)) {
    res.status(401).json({ error: 'wrong passcode' });
    return;
  }

  res.setHeader('Set-Cookie', createSessionCookie(sessionSecret));
  res.status(200).json({ ok: true });
}
