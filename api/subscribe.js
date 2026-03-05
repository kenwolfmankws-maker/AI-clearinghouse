// api/subscribe.js - Lead capture and transactional email endpoint (Vercel Serverless, ESM)
// Accepts name + email, stores the lead, and sends a confirmation email to the subscriber
// plus a notification email to the admin.

import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

// Allowed origins for CORS (tighten in production by setting ALLOWED_ORIGIN env var)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

// Simple email address validation (RFC-5321-ish)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateInput(body) {
  const name = (body?.name ?? "").trim().slice(0, 120);
  const email = (body?.email ?? "").trim().toLowerCase().slice(0, 254);

  if (!email) {
    return { valid: false, error: "Email address is required." };
  }
  if (!EMAIL_RE.test(email)) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  return { valid: true, name, email };
}

function buildTransport() {
  const host = process.env.EMAIL_SMTP_HOST;
  const port = parseInt(process.env.EMAIL_SMTP_PORT || "587", 10);
  const secure = process.env.EMAIL_SMTP_SECURE === "true";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

// Transactional confirmation email sent to the subscriber
function confirmationEmail(name, email, from) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return {
    from,
    to: email,
    subject: "You're on the list — AI Clearinghouse",
    text: [
      greeting,
      "",
      "Thanks for signing up! You're now on the AI Clearinghouse early-access list.",
      "",
      "We'll reach out when new resources, tools, and guides are ready.",
      "",
      "— The AI Clearinghouse Team",
    ].join("\n"),
    html: [
      `<p>${greeting}</p>`,
      "<p>Thanks for signing up! You're now on the <strong>AI Clearinghouse</strong> early-access list.</p>",
      "<p>We'll reach out when new resources, tools, and guides are ready.</p>",
      "<p>— The AI Clearinghouse Team</p>",
    ].join(""),
  };
}

// Admin notification email sent to the site owner
function adminNotificationEmail(name, email, from, adminTo) {
  return {
    from,
    to: adminTo,
    subject: `New lead: ${email}`,
    text: [
      "New signup on AI Clearinghouse:",
      "",
      `  Name:  ${name || "(not provided)"}`,
      `  Email: ${email}`,
      `  Time:  ${new Date().toISOString()}`,
    ].join("\n"),
  };
}

async function storeLead(name, email) {
  const leadsDir = path.join(process.cwd(), "workspace", "leads");
  try {
    await fs.mkdir(leadsDir, { recursive: true });
    const entry = JSON.stringify({ name, email, ts: new Date().toISOString() }) + "\n";
    await fs.appendFile(path.join(leadsDir, "leads.jsonl"), entry);
  } catch (err) {
    console.warn("/api/subscribe lead storage failed:", err);
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const validation = validateInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { name, email } = validation;

  // Persist the lead
  await storeLead(name, email);

  // Send emails if SMTP is configured
  const transport = buildTransport();
  if (transport) {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@aiclearinghouse.com";
    const adminTo = process.env.EMAIL_ADMIN || process.env.EMAIL_USER;

    try {
      const sends = [transport.sendMail(confirmationEmail(name, email, from))];
      if (adminTo) {
        sends.push(transport.sendMail(adminNotificationEmail(name, email, from, adminTo)));
      }
      await Promise.all(sends);
    } catch (err) {
      // Log but don't fail the request — the lead is already stored
      console.error("/api/subscribe email send failed:", err.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: "You're on the list! Check your inbox for a confirmation.",
  });
}
