import { verifySession, verifyEffectivePasscode, hashPasscode } from '../lib/auth.js';
import { getPasscodeHash, setPasscodeHash } from '../lib/store.js';

const MIN_LENGTH = 6;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const sessionSecret = process.env.ADMIN_SESSION_SECRET || '';
  if (!sessionSecret || !verifySession(req, sessionSecret)) {
    res.status(401).json({ error: 'not signed in' });
    return;
  }

  const body = req.body || {};
  const currentPin = typeof body.currentPin === 'string' ? body.currentPin : '';
  const newPin = typeof body.newPin === 'string' ? body.newPin : '';

  if (newPin.length < MIN_LENGTH) {
    res.status(400).json({ error: `new passcode must be at least ${MIN_LENGTH} characters` });
    return;
  }

  const storedHash = await getPasscodeHash();
  const envPasscode = process.env.ADMIN_PASSCODE;
  if (!verifyEffectivePasscode(currentPin, storedHash, envPasscode)) {
    res.status(401).json({ error: 'current passcode is incorrect' });
    return;
  }

  await setPasscodeHash(hashPasscode(newPin));
  res.status(200).json({ ok: true });
}
