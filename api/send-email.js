// Resend infrastructure is intentionally dormant pending authentication, recipient restrictions, rate limiting, domain verification, and explicit approval.
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(410).json({ error: 'Email service is not currently active.' });
}
