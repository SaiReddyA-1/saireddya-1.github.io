// Serves index.html at "/" with the current profile injected as window.__INITIAL_PROFILE__
// before dc-runtime.js loads, so the first paint already has the real photo/résumé/contact
// info; no flash from the placeholder default to the real content while the client fetches
// GET /api/profile. That fetch still happens on mount as a silent revalidation (in case the
// profile changed in the moment between this response and hydration); with the initial
// state already correct, it's a no-op in the common case.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getProfile } from '../lib/store.js';

// Mirrors Component.DEFAULTS in the client script; see assets note in api/profile.js.
const DEFAULTS = {
  email: 'saireddy.annamareddy@gmail.com',
  phone: '919281184144',
  github: 'https://github.com/SaiReddyA-1',
  linkedin: 'https://linkedin.com/in/saireddy0annamareddy',
  resume: 'assets/resume.pdf',
  location: '+91 92811 84144 · Hyderabad, Telangana',
};

const SCRIPT_MARKER = '<script src="assets/dc-runtime.js">';

let templateCache = null;
function loadTemplate() {
  // Cached per warm lambda instance; a redeploy always starts a fresh instance, so this
  // never serves a stale build.
  if (templateCache) return templateCache;
  templateCache = readFileSync(join(process.cwd(), 'index.template.html'), 'utf8');
  return templateCache;
}

export default async function handler(req, res) {
  let profile = DEFAULTS;
  try {
    const stored = await getProfile();
    profile = { ...DEFAULTS, ...(stored || {}) };
  } catch {
    // Storage hiccup: fall back to defaults rather than failing the whole page.
  }

  const template = loadTemplate();
  const json = JSON.stringify(profile).replace(/</g, '\\u003c');
  const injected = `<script>window.__INITIAL_PROFILE__ = ${json};</script>\n`;
  const idx = template.indexOf(SCRIPT_MARKER);
  const html = idx === -1 ? template : template.slice(0, idx) + injected + template.slice(idx);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
}
