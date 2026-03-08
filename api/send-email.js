const { cors } = require('@vercel/functions');
const { Resend } = require('resend');

/**
 * Minimal Resend email endpoint.
 * - POST { to, subject, html?, text? } → send email
 * - POST { test: true } → send test email (verify RESEND_API_KEY / connection)
 * Env: RESEND_API_KEY (required), RESEND_FROM (optional, e.g. "Name <notifications@your-domain.com>")
 */
async function handler(req) {
  if (req.method === 'OPTIONS') {
    return cors()(new Response(null, { status: 204 }));
  }

  if (req.method !== 'POST') {
    return cors()(
      new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return cors()(
      new Response(
        JSON.stringify({ error: 'RESEND_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }

  const resend = new Resend(apiKey);
  const from =
    process.env.RESEND_FROM ||
    'AI Clearinghouse <onboarding@resend.dev>';

  try {
    const body = await req.json().catch(() => ({}));
    const isTest = body && body.test === true;

    if (isTest) {
      const { data, error } = await resend.emails.send({
        from,
        to: ['delivered@resend.dev'],
        subject: 'Resend connection test',
        html: '<p>This is a test email from the AI Clearinghouse send-email API.</p>',
        idempotencyKey: `test-connection/${Date.now()}`,
      });

      if (error) {
        return cors()(
          new Response(
            JSON.stringify({ ok: false, error: error.message || error }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      return cors()(
        new Response(
          JSON.stringify({ ok: true, message: 'Test email sent', id: data?.id }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    const { to, subject, html, text } = body;
    if (!to || !subject) {
      return cors()(
        new Response(
          JSON.stringify({ error: 'to and subject are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    const toList = Array.isArray(to) ? to : [to];
    const payload = {
      from,
      to: toList,
      subject,
      idempotencyKey: `send-email/${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    };
    if (html) payload.html = html;
    if (text) payload.text = text;
    if (!payload.html && !payload.text) payload.html = '<p>No content.</p>';

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      return cors()(
        new Response(
          JSON.stringify({ ok: false, error: error.message || error }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    return cors()(
      new Response(
        JSON.stringify({ ok: true, id: data?.id }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  } catch (err) {
    console.error('[api/send-email] error:', err);
    return cors()(
      new Response(
        JSON.stringify({ error: 'Failed to send email', details: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
}

module.exports = handler;
