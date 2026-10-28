# Resume Preflight: waitlist site

Static landing page plus one serverless function (`api/waitlist.js`) that stores signups as private files in Vercel Blob (`waitlist/<hash>.json`).

- Deploys automatically to Vercel on every push to `main`.
- Needs the `BLOB_READ_WRITE_TOKEN` env var, which Vercel adds when a Blob store is connected to the project.
- View signups: Vercel dashboard → Storage → the Blob store → `waitlist/` folder.
