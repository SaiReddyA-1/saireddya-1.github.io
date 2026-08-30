import { verifySession } from '../lib/auth.js';
import { getProfile, setProfile } from '../lib/store.js';

// Public defaults. Kept in sync with assets committed to the repo (assets/resume.pdf,
// assets/profile-default.svg is applied client side as the photo fallback). The admin
// passcode used to live here; it never does now; it's ADMIN_PASSCODE on the server only.
const DEFAULTS = {
  email: 'saireddy.annamareddy@gmail.com',
  phone: '919281184144',
  github: 'https://github.com/SaiReddyA-1',
  linkedin: 'https://linkedin.com/in/saireddy0annamareddy',
  resume: 'assets/resume.pdf',
  location: '+91 92811 84144 · Hyderabad, Telangana',
  availability: 'Open to India, US and EU startups · remote or Hyderabad',
};

// Fields the client may ever write. Anything else in the POST body is dropped.
const WRITABLE_FIELDS = [
  'email', 'phone', 'github', 'linkedin', 'resume', 'location', 'availability',
  'resumeUrl', 'resumeName', 'resumeSize', 'photoUrl', 'photoName',
];

const MAX_FIELD_LEN = 4000;

// The client always sends its complete desired profile (never a partial patch), so this
// is a pure replace, not a merge with whatever was previously stored; that also means
// "Reset to defaults" and "Remove photo/résumé" work by simply omitting/nulling a field,
// with no separate delete path needed.
function sanitize(input) {
  const out = {};
  for (const key of WRITABLE_FIELDS) {
    if (!(key in input)) continue;
    const v = input[key];
    if (typeof v !== 'string') continue; // also drops explicit `null` clears
    out[key] = v.slice(0, MAX_FIELD_LEN);
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    const stored = await getProfile();
    res.status(200).json({ ...DEFAULTS, ...(stored || {}) });
    return;
  }

  if (req.method === 'POST') {
    const secret = process.env.ADMIN_SESSION_SECRET || '';
    if (!secret || !verifySession(req, secret)) {
      res.status(401).json({ error: 'not signed in' });
      return;
    }
    const body = req.body || {};
    if (typeof body !== 'object' || body === null) {
      res.status(400).json({ error: 'invalid body' });
      return;
    }
    const clean = sanitize(body);
    const merged = { ...DEFAULTS, ...clean };
    await setProfile(merged);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(merged);
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
