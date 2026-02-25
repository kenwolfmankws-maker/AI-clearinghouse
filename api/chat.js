const { cors } = require('@vercel/functions');
const OpenAI = require('openai');

/**
 * Vercel serverless function for chat API
 * Supports:
 * - Direct OpenAI API (via OPENAI_API_KEY)
 * - AI Gateway (via AI_GATEWAY_API_KEY)
 * - Optional OIDC authentication (via REQUIRE_OIDC_FOR_CHAT)
 */

async function handler(req) {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return cors()(new Response(null, { status: 204 }));
    }

    // Only allow POST
    if (req.method !== 'POST') {
      return cors()(
        new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

  // Optional OIDC check
  if (process.env.REQUIRE_OIDC_FOR_CHAT === 'true') {
    try {
      const { verifyToken } = require('../lib/oidc');
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return cors()(
        new Response(
          JSON.stringify({ error: 'Missing or invalid Authorization header' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      );
      }
      const token = authHeader.substring(7);
      await verifyToken(token);
    } catch (err) {
      return cors()(
        new Response(
          JSON.stringify({ error: 'OIDC verification failed', details: err.message }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }
  }

  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return cors()(
        new Response(
          JSON.stringify({ error: 'Message is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    // Determine API configuration
    const useGateway = !!process.env.AI_GATEWAY_API_KEY;
    const apiKey = useGateway ? process.env.AI_GATEWAY_API_KEY : process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return cors()(
        new Response(
          JSON.stringify({ error: 'API key not configured' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    // Configure OpenAI client with timeout
    const config = {
      apiKey,
      timeout: 60000, // 60 seconds timeout for API calls
    };

    if (useGateway) {
      config.baseURL = 'https://ai-gateway.vercel.sh/v1';
    }

    const openai = new OpenAI(config);

    // Determine model
    const model = process.env.CHAT_MODEL || (useGateway ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');

    // Create completion with timeout wrapper to prevent hanging
    // Note: vercel.json sets maxDuration to 60s, so timeout should be less
    const timeoutMs = 55000; // 55 seconds max (5s buffer before Vercel's 60s limit)
    const completionPromise = openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: message }],
      max_tokens: 500,
      temperature: 0.7,
    });

    // Wrap in timeout to ensure it fails fast
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: OpenAI API call exceeded 90 seconds')), timeoutMs);
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    const choice = completion.choices?.[0] || {};
    const raw = choice?.message?.content ?? '';
    const reply = typeof raw === 'string' ? raw.trim() : '';
    const usage = completion.usage || {};
    const truncated = Boolean(choice?.finish_reason && choice.finish_reason !== 'stop');

    if (!reply) {
      console.warn('[api/chat] empty reply from model', {
        finish_reason: choice?.finish_reason,
        usage,
      });
    }

    console.log('[api/chat] completion success', {
      id: completion.id,
      chars: reply.length,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
    });

    const response = {
      reply,
      model,
      mode: useGateway ? 'gateway' : 'direct',
      id: completion.id,
      tokens: {
        prompt: usage.prompt_tokens || 0,
        completion: usage.completion_tokens || 0,
        total: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
      },
      truncated,
    };

    return cors()(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (error) {
    console.error('[api/chat] error:', error);
    return cors()(
      new Response(
        JSON.stringify({
          error: 'Failed to get response',
          details: error.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  } catch (outerError) {
    // Catch any unexpected errors outside the main try-catch
    console.error('[api/chat] unexpected error:', outerError);
    return cors()(
      new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: outerError?.message || 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }
}

// Export for Vercel Functions v3
module.exports = handler;


