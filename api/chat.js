// api/chat.js - Clean Vercel Serverless Function (ESM)
// DOMAIN: Shared Infrastructure (Clearinghouse-aligned)
// NOTE: This is a NEUTRAL chat endpoint. Do NOT use Eldon persona here.
//       Eldon is SANCTUARY-ONLY and belongs in /porch/ context.

import OpenAI from "openai";
import { createRequire } from "module";
import fs from "fs/promises";
import path from "path";

const require = createRequire(import.meta.url);
const { verifyOidcFromRequest } = require("../lib/oidc.js");

// NEUTRAL system prompt - NOT Eldon, NOT mythic
const SYSTEM_PROMPT = `
You are a guide at the AI Clearinghouse entry portal.

Your role is to:
- Welcome visitors
- Explain the purpose of the AI Clearinghouse
- Describe available portals and experiences
- Provide clear, helpful information
- Direct visitors to appropriate next steps

Available portals:
- The Porch: An immersive cosmic cowboy experience
- Signal Hub (planned): Real-time AI coordination
- Lab Station (planned): Model experimentation

Tone: Professional, helpful, calm, honest

You are NOT:
- Technical support
- A troubleshooter
- Eldon (the gatekeeper - that's a different persona in the Porch)

Keep responses concise and actionable.
`;

function formatUtcTimestamp(date) {
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function clampText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }
  return value.length > maxLength ? value.slice(0, maxLength - 3) + "..." : value;
}

async function appendWorkspaceLog(entry, author = "api/chat") {
  const timestamp = new Date();
  const iso = timestamp.toISOString();
  const day = iso.slice(0, 10);
  const textEntry = `${formatUtcTimestamp(timestamp)} — ${entry}\n`;
  const jsonlEntry = JSON.stringify({ timestamp: iso, author, entry }) + "\n";
  const workspaceDir = path.join(process.cwd(), "workspace");
  const logsDir = path.join(workspaceDir, "logs");

  try {
    await fs.mkdir(logsDir, { recursive: true });
    await Promise.all([
      fs.appendFile(path.join(workspaceDir, "log.txt"), textEntry),
      fs.appendFile(path.join(logsDir, `${day}.log`), textEntry),
      fs.appendFile(path.join(workspaceDir, "log.jsonl"), jsonlEntry),
    ]);
  } catch (err) {
    console.warn("/api/chat log append failed:", err);
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    let userLabel = "anonymous";
    if (req.headers.authorization) {
      try {
        const { claims } = await verifyOidcFromRequest(req);
        userLabel = claims?.sub || "authenticated";
      } catch (err) {
        return res.status(err.statusCode || 401).json({
          error: "Unauthorized",
          details: err.message,
        });
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const client = new OpenAI({ apiKey });

    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'message' field in request body" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
    });
    const reply = completion.choices?.[0]?.message?.content ?? "";

    await appendWorkspaceLog(
      `Chat request from ${userLabel}: "${clampText(message, 500)}" | reply: "${clampText(reply, 500)}"`
    );


    return res.status(200).json({ reply });
  } catch (err) {
    console.error("/api/chat error:", err);
    return res.status(500).json({ error: err.message });
  }
}
