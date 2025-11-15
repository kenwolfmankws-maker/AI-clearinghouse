// Vercel Serverless Function: POST /api/chat// api/chat.js
// Vercel serverless function for chatbot backend

const OpenAI = require("openai");

module.exports = async function handler(req, res) {
  // Allow CORS for browser requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Respond to preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Server misconfigured: missing OPENAI_API_KEY"
      });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: 'Missing "message" in body' });
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
      max_tokens: 500
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a reply.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};

// Expects JSON: { message: string }
// Returns JSON: { reply: string }
// Updated: 2025-11-08 (AI Gateway optional integration)
// If AI_GATEWAY_API_KEY is present, route via Vercel AI Gateway (unified provider endpoint)
// Otherwise fall back to direct OpenAI usage with OPENAI_API_KEY.

// Use dynamic import to be compatible with ESM-only 'openai' package on Vercel
let OpenAICtor;
async function getOpenAI() {
  if (!OpenAICtor) {
    try {
      console.log('[chat] importing openai SDK');
      const mod = await import('openai');
      OpenAICtor = mod.default || mod.OpenAI || mod;
      console.log('[chat] openai SDK imported');
    } catch (e) {
      console.error('[chat] failed to import openai SDK', e);
      throw new Error('Failed to load OpenAI SDK');
    }
  }
  return OpenAICtor;
}

function selectMode() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  if (gatewayKey) {
    return {
      kind: 'gateway',
      apiKey: gatewayKey,
      baseURL: 'https://ai-gateway.vercel.sh/v1',
      // For gateway the model name should be provider-prefixed
      model: process.env.CHAT_MODEL || 'openai/gpt-4o-mini'
    };
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  return {
    kind: 'openai',
    apiKey: openaiKey,
    baseURL: undefined,
    model: process.env.CHAT_MODEL || 'gpt-4o-mini'
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Optional: require OIDC JWT to access chat
    if (String(process.env.REQUIRE_OIDC_FOR_CHAT).toLowerCase() === 'true') {
      try {
        const { verifyOidcFromRequest } = require('../lib/oidc');
        await verifyOidcFromRequest(req);
      } catch (authErr) {
        const status = authErr?.statusCode || 401;
        return res.status(status).json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' });
      }
    }
    const mode = selectMode();
    if (!mode.apiKey) {
      console.error('[chat] No API key found. Expected AI_GATEWAY_API_KEY or OPENAI_API_KEY');
      return res.status(500).json({ error: 'Server misconfigured: missing AI gateway or OpenAI API key' });
    }
    console.log(`[chat] mode=${mode.kind} model=${mode.model}`);

    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing "message" in body' });
    }

    const OpenAI = await getOpenAI();
    const clientConfig = { apiKey: mode.apiKey };
    if (mode.baseURL) clientConfig.baseURL = mode.baseURL; // Gateway path
    const openai = new OpenAI(clientConfig);
    console.log('[chat] creating completion');
    const completion = await openai.chat.completions.create({
      model: mode.model,
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
    });
    const choice = completion.choices?.[0] || {};
    const raw = choice?.message?.content ?? '';
    const reply = typeof raw === 'string' ? raw.trim() : '';
    const usage = completion.usage || {};
    const truncated = Boolean(choice?.finish_reason && choice.finish_reason !== 'stop');

    if (!reply) {
      console.warn('[chat] empty reply from model', {
        finish_reason: choice?.finish_reason,
        usage,
      });
    }

    console.log('[chat] completion success', {
      id: completion.id,
      chars: reply.length,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
    });
    return res.status(200).json({
      reply,
      model: mode.model,
      mode: mode.kind,
      id: completion.id,
      tokens: {
        prompt: usage.prompt_tokens || 0,
        completion: usage.completion_tokens || 0,
        total: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
      },
      truncated,
    });
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    const provider = err?.response?.data || null;
    console.error('[chat] API error', {
      status,
      message: err?.message,
      provider,
    });
    const retryable = [408, 429, 500, 502, 503, 504].includes(status);
    return res.status(status).json({
      error: retryable ? 'Upstream temporarily unavailable' : 'Internal Server Error',
      code: status,
      detail: (provider && (provider.error?.message || provider.message)) || err?.message,
      retryable,
    });
  }
};
