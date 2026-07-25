// Resend infrastructure is intentionally dormant pending authentication, recipient restrictions, rate limiting, domain verification, and explicit approval.
async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { Allow: 'POST', 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Email service is not currently active.' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
}

module.exports = handler;
