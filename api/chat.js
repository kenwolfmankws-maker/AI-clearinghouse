// Vercel Serverless Function: POST /api/chat
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

    const reply = completion.choices?.[0]?.message?.content || '';
    console.log('[chat] completion success, chars=' + reply.length);
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('[chat] API error:', err?.response?.data || err?.message || err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
