# SaiReddy Annamareddy Portfolio

A single page portfolio with a real admin backend: edit your contact details, résumé, and
profile photo from `/admin` on the live site, no code changes or redeploys needed.

Live at: https://saireddy-portfolio.vercel.app

## What this actually is

`index.template.html` holds the page (design, CSS, and the three.js hero are byte-identical
to the original design handoff) plus a small serverless API for the admin route. A request
to `/` is routed to `api/render.js`, which reads the current profile and injects it into the
page before sending it, so the real photo and résumé show up on the very first paint instead
of flashing in after a client-side fetch.

```
index.template.html     the page. markup/CSS/animations are byte-identical to the
                         original design handoff, only the app logic was rewired
assets/
  dc-runtime.js          the page's template runtime (generated, do not edit)
  ds-bundle.js, image-slot.js   supporting runtime files (generated, do not edit)
  vendor/                React, ReactDOM, three.js. vendored locally, zero CDN
                         dependency at runtime
  fonts/                 Caprasimo, Figtree, JetBrains Mono (self-hosted .woff2)
  profile-default.svg    fallback hero photo, shown only before any photo is uploaded
  resume.pdf             fallback résumé, shown only before any résumé is uploaded
  og.png                 social preview image (1200x630)
api/
  render.js               serves index.template.html at "/" with the current profile
                         injected, so there's no placeholder-to-real content flash
  profile.js             GET (public) / POST (admin only) the profile JSON
  login.js, logout.js, session.js   admin auth (signed cookie, no client-side secret)
  change-passcode.js     rotate the admin passcode from the admin page itself
  upload.js               résumé/photo uploads (admin only, validated server side)
  uploads/[key].js         dev only: serves local uploads (prod serves from Blob's own CDN)
lib/
  store.js                storage: Vercel Blob in prod, .data/ on disk in dev
  auth.js                 session cookie, passcode hashing and verification
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
directory (gitignored) instead of Vercel Blob, so nothing needs a cloud account to test.

## Deploying

This repo is connected to Vercel (`vercel git connect`), so a push to `main` deploys to
production automatically. To set it up from scratch elsewhere:

1. Push the repo to GitHub.
2. Import it on [vercel.com](https://vercel.com) (or `vercel link`).
3. In the Vercel project's Settings, Environment Variables, set `ADMIN_PASSCODE` and
   `ADMIN_SESSION_SECRET`. Do not reuse any passcode that ever appeared in this project's
   source or git history.
4. Settings, Storage, add a Blob store with **public** access and connect it to the
   project. This injects `BLOB_READ_WRITE_TOKEN` automatically, which is what switches
   `lib/store.js` from local disk to real cloud storage. The store must be public: the
   `@vercel/blob` SDK's `put()` call only supports `access: 'public'`, and a private store
   will reject every upload.
5. `vercel.json` uses the legacy `routes` config (not `rewrites`) to send `/` to
   `api/render.js` ahead of static file serving. This matters: Vercel's modern `rewrites`
   only apply when no static file matches the path, so a plain rewrite here gets silently
   skipped in favor of serving `index.template.html` directly, undoing the SSR injection.
   This only showed up in production, not in `vercel dev`, so if you change this routing,
   verify against the actual deployment, not just the local dev server.
6. Deploy, sign in at `/admin` with your passcode, and re-upload the photo and résumé if
   this is a fresh Blob store (local `.data/` content doesn't travel with the deploy).

## How the admin works

- The passcode is checked server side and never sent to the browser, never appears in the
  JS bundle, and isn't stored anywhere client side. You can change it any time from the
  admin page itself (current passcode plus a new one), which stores a salted hash via
  `lib/store.js`, not the environment variable, from then on. `ADMIN_PASSCODE` only serves
  as the bootstrap credential before the passcode has ever been changed in the admin panel.
- Signing in sets an `HttpOnly`, `SameSite=Strict` cookie (12h), not `localStorage` or
  `sessionStorage`, so it can't be read or forged by page JavaScript, and it works the same
  whether you're on the phone or laptop, as long as you sign in again on each.
- Saving a field, uploading a résumé or photo, or clicking "Reset to defaults" all write
  through `POST /api/profile`, live for every visitor immediately, not just your own
  browser.
- "Reset to defaults" only resets the text fields (email, phone, links, location,
  availability). A résumé or photo you've uploaded is real content, not a placeholder, so
  reset never touches or deletes it.
- Uploads are validated server side by actual file bytes, not just the declared MIME type:
  PDFs must start with the PDF magic bytes, images must be real JPEG or PNG. Résumés cap at
  4 MB, photos at 3 MB. The photo pipeline center-crops to a square, downsizes to 640px, and
  re-encodes as JPEG before it ever reaches the server.

## Design fidelity note

The markup, CSS, and every animation and timing value are unmodified from the original
handoff. That was a deliberate constraint, not an oversight. Only the app-logic script was
edited, to replace `localStorage`/`sessionStorage` calls with calls to the API above, plus a
small laptop-width display scale and a cursor-position fix to match it. If you ever want to
verify the design is untouched, the pre-backend snapshot is preserved at
`.original/index.bundled.html` (gitignored, kept only for local reference).
