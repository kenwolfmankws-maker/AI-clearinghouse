// api/contact.js - Minimal contact-form email endpoint (Vercel Serverless, ESM)
// Email provider: Resend (https://resend.com)
// Required env vars:
//   RESEND_API_KEY   — API key from resend.com dashboard
//   CONTACT_TO_EMAIL — destination inbox (e.g. "you@example.com")

const RESEND_API_URL = "https://api.resend.com/emails";
const MAX_NAME_LEN = 100;
const MAX_EMAIL_LEN = 254;
const MAX_MESSAGE_LEN = 2000;

function isValidEmail(str) {
  return typeof str === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitize(str, maxLen) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!apiKey) {
    console.error("/api/contact: missing RESEND_API_KEY");
    return res.status(500).json({ error: "Email service not configured" });
  }
  if (!toEmail) {
    console.error("/api/contact: missing CONTACT_TO_EMAIL");
    return res.status(500).json({ error: "Email service not configured" });
  }

  const name = sanitize(req.body?.name, MAX_NAME_LEN);
  const email = sanitize(req.body?.email, MAX_EMAIL_LEN);
  const message = sanitize(req.body?.message, MAX_MESSAGE_LEN);

  if (!name) return res.status(400).json({ error: "Name is required" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Valid email is required" });
  if (!message) return res.status(400).json({ error: "Message is required" });

  const payload = {
    from: "AI Clearinghouse <onboarding@resend.dev>",
    to: [toEmail],
    reply_to: email,
    subject: `Contact form: ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
  };

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("/api/contact Resend error:", response.status, data);
      return res.status(502).json({ error: "Failed to send message" });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error("/api/contact fetch error:", err.message);
    return res.status(500).json({ error: "Failed to send message" });
  }
}
