// Dev-only convenience: serves an uploaded résumé/photo from the local .data/uploads/
// directory used by lib/store.js when no Blob store is configured. In production
// (BLOB_READ_WRITE_TOKEN set) saveUpload() returns the Blob's own public CDN URL
// directly, so this route is never hit; Vercel Blob serves those files itself.
import { readLocalUpload } from '../../lib/store.js';

const EXT_TYPES = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export default function handler(req, res) {
  const key = req.query.key;
  const data = readLocalUpload(key);
  if (!data) {
    res.status(404).send('Not found');
    return;
  }
  const ext = String(key).split('.').pop().toLowerCase();
  res.setHeader('Content-Type', EXT_TYPES[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(data);
}
