import { verifySession } from '../lib/auth.js';
import { saveUpload } from '../lib/store.js';

// Vercel's Node runtime auto-parses a request body into req.body only for a few known
// content types — application/octet-stream is one of them (a plain Buffer), and it's
// the one we rely on. multipart/form-data is NOT auto-parsed, and empirically (tested
// against `vercel dev`) the raw stream is already drained by the time the handler runs,
// so it can't be re-read manually either. The client therefore sends the raw file bytes
// with Content-Type: application/octet-stream, and passes kind/filename as query params
// (always available via req.query regardless of body parsing).

const LIMITS = { resume: 4 * 1024 * 1024, photo: 3 * 1024 * 1024 };

// Never trust the declared kind/filename alone — sniff the actual bytes.
const MAGIC = {
  pdf: (buf) => buf.length >= 5 && buf.toString('latin1', 0, 5) === '%PDF-',
  jpeg: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  png: (buf) =>
    buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const secret = process.env.ADMIN_SESSION_SECRET || '';
  if (!secret || !verifySession(req, secret)) {
    res.status(401).json({ error: 'not signed in' });
    return;
  }

  const kind = req.query.kind;
  if (kind !== 'resume' && kind !== 'photo') {
    res.status(400).json({ error: 'invalid kind' });
    return;
  }

  const buffer = req.body;
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    res.status(400).json({ error: 'missing or unreadable file body (expected application/octet-stream)' });
    return;
  }
  if (buffer.length > LIMITS[kind]) {
    res.status(413).json({ error: 'file too large' });
    return;
  }

  let outContentType, ext;
  if (kind === 'resume') {
    if (!MAGIC.pdf(buffer)) {
      res.status(400).json({ error: 'not a valid PDF' });
      return;
    }
    outContentType = 'application/pdf';
    ext = 'pdf';
  } else {
    if (MAGIC.jpeg(buffer)) {
      outContentType = 'image/jpeg';
      ext = 'jpg';
    } else if (MAGIC.png(buffer)) {
      outContentType = 'image/png';
      ext = 'png';
    } else {
      res.status(400).json({ error: 'not a valid JPEG or PNG' });
      return;
    }
  }

  try {
    const url = await saveUpload(kind, buffer, outContentType, ext);
    res.status(200).json({ url });
  } catch {
    res.status(500).json({ error: 'upload failed' });
  }
}
