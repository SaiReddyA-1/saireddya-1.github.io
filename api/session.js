import { verifySession } from '../lib/auth.js';

export default function handler(req, res) {
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  const authed = !!secret && verifySession(req, secret);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ authed });
}
