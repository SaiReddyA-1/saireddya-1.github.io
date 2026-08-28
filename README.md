# SaiReddy Annamareddy — Portfolio

A single-page portfolio with a real admin backend: edit your contact details, résumé, and
profile photo from `/admin` on the live site, no code changes or redeploys needed.

## What this actually is

`index.html` is a static page (design, CSS, and the three.js hero are untouched from the
original design handoff) plus a small serverless API for the admin route:

```
index.html              the page — markup/CSS/animations are byte-identical to the
                         original design handoff, only the app logic was rewired
assets/
  dc-runtime.js          the page's template runtime (generated, do not edit)
  ds-bundle.js, image-slot.js   supporting runtime files (generated, do not edit)
  vendor/                React, ReactDOM, three.js — vendored locally, zero CDN
                         dependency at runtime
  fonts/                 Caprasimo, Figtree, JetBrains Mono (self-hosted .woff2)
  profile-default.svg    fallback hero photo, shown only before any photo is uploaded
  resume.pdf             fallback résumé, shown only before any résumé is uploaded
  og.png                 social preview image (1200×630)
api/
  profile.js             GET (public) / POST (admin-only) the profile JSON
  login.js, logout.js, session.js   admin auth (signed cookie, no client-side secret)
  upload.js               résumé/photo uploads (admin-only, validated server-side)
  uploads/[key].js         dev-only: serves local uploads (prod serves from Blob's own CDN)
lib/
  store.js                storage: Vercel Blob in prod, .data/ on disk in dev
  auth.js                 session cookie + passcode verification
```

## Local development

```bash
npm install
npx vercel dev
```

Opens at `http://localhost:3000`. First run: copy `.env.example` to `.env` and set your own
`ADMIN_PASSCODE` and `ADMIN_SESSION_SECRET` (generate one with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). With no
`BLOB_READ_WRITE_TOKEN` set, uploads and profile data are stored in a local `.data/`
directory (gitignored) instead of Vercel Blob — nothing needs a cloud account to test.

## Deploying

1. Push this repo to GitHub.
2. Import it on [vercel.com](https://vercel.com) (or `vercel link` + `vercel --prod`).
3. In the Vercel project's Settings → Environment Variables, set `ADMIN_PASSCODE` and
   `ADMIN_SESSION_SECRET`. Do **not** reuse any passcode that ever appeared in this
   project's source or git history.
4. Settings → Storage → add a Blob store and connect it to the project — this injects
   `BLOB_READ_WRITE_TOKEN` automatically, which is what switches `lib/store.js` from local
   disk to real cloud storage.
5. Deploy. Sign in at `/admin` with your passcode and re-upload the photo/résumé if this is
   a fresh Blob store (local `.data/` content doesn't travel with the deploy).

## How the admin works

- The passcode lives only in `ADMIN_PASSCODE` on the server. It is never sent to the
  browser, never appears in the JS bundle, and isn't stored anywhere client-side.
- Signing in sets an `HttpOnly`, `SameSite=Strict` cookie (12h) — not `localStorage` or
  `sessionStorage`, so it can't be read or forged by page JavaScript, and it works the same
  whether you're on the phone or laptop, as long as you sign in again on each.
- Saving a field, uploading a résumé/photo, or clicking "Reset to defaults" all write
  through `POST /api/profile`, which is live for every visitor immediately — not just your
  own browser (that was the old prototype's limitation; this version doesn't have it).
- "Reset to defaults" only resets the text fields (email, phone, links, location,
  availability). A résumé or photo you've uploaded is real content, not a placeholder —
  reset never touches or deletes it.
- Uploads are validated server-side by actual file bytes (not just the declared MIME
  type): PDFs must start with the PDF magic bytes, images must be real JPEG or PNG.
  Résumés cap at 4 MB, photos at 3 MB. The photo pipeline center-crops to a square,
  downsizes to 640px, and re-encodes as JPEG — same as before, just uploaded to storage
  instead of encoded as a `data:` URL in `localStorage`.

## Design fidelity note

The markup, CSS, and every animation/timing value are unmodified from the original
handoff — this was a deliberate constraint, not an oversight. Only the ~200-line app-logic
script was edited, and only to replace `localStorage`/`sessionStorage` calls with calls to
the API above. If you ever want to verify this, the pre-backend snapshot is preserved at
`.original/index.bundled.html` (gitignored, kept only for local reference).
