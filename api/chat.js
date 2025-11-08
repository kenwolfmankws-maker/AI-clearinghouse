// Vercel Serverless Function: POST /api/chat
// Expects JSON: { message: string }
// Returns JSON: { reply: string }

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!process.env.OPENAI_API_KEY) {
      console.error('[chat] OPENAI_API_KEY missing in environment');
    } else {
      console.log('[chat] OPENAI_API_KEY present (masked) length=' + (process.env.OPENAI_API_KEY.length));
    }
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'Server misconfigured: missing OPENAI_API_KEY' });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing "message" in body' });
    }

  const OpenAI = await getOpenAI();
  const openai = new OpenAI({ apiKey });
  console.log('[chat] creating completion');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
