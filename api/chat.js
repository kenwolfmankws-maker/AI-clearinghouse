// api/chat.js - Production-Ready Vercel Serverless Function (ESM)
// DOMAIN: Shared Infrastructure (Clearinghouse-aligned)
// NOTE: This is a NEUTRAL chat endpoint. Do NOT use Eldon persona here.
//       Eldon is SANCTUARY-ONLY and belongs in /porch/ context.

import OpenAI from "openai";
import { createRequire } from "module";
import fs from "fs/promises";
import path from "path";

const require = createRequire(import.meta.url);
const { verifyOidcFromRequest } = require("../lib/oidc.js");

// Constants
const MAX_SINGLE_MESSAGE_CHARS = 4000;
const MAX_MESSAGES_COUNT = 50;
const MAX_TOTAL_CHARS = 16000;
const REQUEST_TIMEOUT_MS = 30000;

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

// Validate and sanitize a single message
function validateMessage(msg) {
  if (!msg || typeof msg !== "object") {
    return { valid: false, error: "Message must be an object" };
  }
  if (!msg.role || typeof msg.role !== "string") {
    return { valid: false, error: "Message must have a 'role' field" };
  }
  if (!["system", "user", "assistant"].includes(msg.role)) {
    return { valid: false, error: "Message role must be 'system', 'user', or 'assistant'" };
  }
  if (!msg.content || typeof msg.content !== "string") {
    return { valid: false, error: "Message must have a 'content' field" };
  }
  const trimmed = msg.content.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Message content cannot be empty or only whitespace" };
  }
  return { valid: true, content: trimmed };
}

// Convert legacy format to messages array
function normalizeMessages(body) {
  // New format: { messages: [...] }
  if (body.messages && Array.isArray(body.messages)) {
    return { messages: body.messages, isLegacy: false };
  }
  // Legacy format: { message: "..." }
  if (body.message && typeof body.message === "string") {
    const trimmed = body.message.trim();
    if (trimmed.length === 0) {
      return { error: "Message cannot be empty or only whitespace" };
    }
    if (trimmed.length > MAX_SINGLE_MESSAGE_CHARS) {
      return { error: `Message too long (max ${MAX_SINGLE_MESSAGE_CHARS} characters)` };
    }
    return {
      messages: [{ role: "user", content: trimmed }],
      isLegacy: true
    };
  }
  return { error: "Request must include 'message' or 'messages' field" };
}

// Validate messages array
function validateMessages(messages) {
  if (messages.length === 0) {
    return { valid: false, error: "Messages array cannot be empty" };
  }
  if (messages.length > MAX_MESSAGES_COUNT) {
    return { valid: false, error: `Too many messages (max ${MAX_MESSAGES_COUNT})` };
  }

  const validated = [];
  let totalChars = 0;

  for (let i = 0; i < messages.length; i++) {
    const result = validateMessage(messages[i]);
    if (!result.valid) {
      return { valid: false, error: `Message ${i + 1}: ${result.error}` };
    }
    validated.push({ ...messages[i], content: result.content });
    totalChars += result.content.length;
  }

  if (totalChars > MAX_TOTAL_CHARS) {
    return { valid: false, error: `Conversation too long. Please start a new chat.` };
  }

  return { valid: true, messages: validated };
}

// Prepend system prompt if needed
function ensureSystemPrompt(messages) {
  if (messages.length > 0 && messages[0].role === "system") {
    return messages;
  }
  return [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
}

// Handle OpenAI-specific errors
function handleOpenAIError(err) {
  console.error("/api/chat OpenAI error:", err.message, err.stack);

  if (err.status === 429 || err.code === "rate_limit_exceeded") {
    return {
      status: 429,
      error: "Rate limit exceeded. Please wait and try again."
    };
  }
  if (err.status === 401 || err.code === "invalid_api_key") {
    return {
      status: 401,
      error: "Authentication failed"
    };
  }
  if (err.status === 400 && err.message?.includes("context_length")) {
    return {
      status: 400,
      error: "Conversation too long. Please start a new chat."
    };
  }
  // Generic error - don't leak internal details
  return {
    status: 500,
    error: "An error occurred processing your request"
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // OIDC authentication (optional)
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

    const client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });

    // Parse and normalize messages (legacy or new format)
    const normalized = normalizeMessages(req.body);
    if (normalized.error) {
      return res.status(400).json({ error: normalized.error });
    }

    // Validate messages
    const validation = validateMessages(normalized.messages);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Ensure system prompt is present
    const finalMessages = ensureSystemPrompt(validation.messages);

    // Check streaming mode
    const stream = req.body.stream === true;

    // Log request details
    const turnCount = validation.messages.length;
    const loggedMessages = validation.messages
      .map(m => `[${m.role}] ${clampText(m.content, 200)}`)
      .join(" | ");
    await appendWorkspaceLog(
      `Chat request from ${userLabel} (${stream ? "streaming" : "non-streaming"}, ${turnCount} turn${turnCount !== 1 ? "s" : ""}): ${loggedMessages}`
    );

    if (stream) {
      // Streaming mode (SSE)
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      try {
        const streamResponse = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: finalMessages,
          stream: true,
        });

        let fullReply = "";
        for await (const chunk of streamResponse) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            fullReply += content;
            res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
          }
        }

        res.write("data: [DONE]\n\n");
        res.end();

        // Log the completed streaming response
        await appendWorkspaceLog(
          `Streaming reply to ${userLabel}: "${clampText(fullReply, 200)}"`
        );
      } catch (err) {
        const errorResponse = handleOpenAIError(err);
        res.write(`data: ${JSON.stringify({ error: errorResponse.error })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming mode
      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: finalMessages,
        });

        const reply = completion.choices?.[0]?.message?.content ?? "";
        const usage = completion.usage || null;

        // Log token usage
        if (usage) {
          await appendWorkspaceLog(
            `Token usage for ${userLabel}: prompt=${usage.prompt_tokens}, completion=${usage.completion_tokens}, total=${usage.total_tokens}`
          );
        }

        await appendWorkspaceLog(
          `Reply to ${userLabel}: "${clampText(reply, 200)}"`
        );

        return res.status(200).json({ reply, usage });
      } catch (err) {
        const errorResponse = handleOpenAIError(err);
        return res.status(errorResponse.status).json({ error: errorResponse.error });
      }
    }
  } catch (err) {
    console.error("/api/chat unexpected error:", err.message, err.stack);
    return res.status(500).json({ error: "An error occurred processing your request" });
  }
}
