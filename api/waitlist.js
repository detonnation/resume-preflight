import { put, head, BlobNotFoundError } from '@vercel/blob';
import { createHash } from 'node:crypto';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  // Honeypot: bots fill the hidden "company" field. Pretend it worked.
  if (body.company) return res.status(200).json({ ok: true });

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const source = ['hero', 'footer'].includes(body.source) ? body.source : 'unknown';

  // One private file per email (hashed name), so duplicates don't stack up.
  const id = createHash('sha256').update(email).digest('hex').slice(0, 32);
  const pathname = `waitlist/${id}.json`;

  try {
    await head(pathname);
    return res.status(200).json({ ok: true, already: true });
  } catch (err) {
    if (!(err instanceof BlobNotFoundError)) {
      console.error('head failed', err);
      return res.status(500).json({ error: 'Storage error' });
    }
  }

  try {
    await put(pathname, JSON.stringify({
      email, source, joinedAt: new Date().toISOString(),
      referrer: req.headers.referer || null,
    }), { access: 'private', addRandomSuffix: false, contentType: 'application/json' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('put failed', err);
    return res.status(500).json({ error: 'Storage error' });
  }
}
