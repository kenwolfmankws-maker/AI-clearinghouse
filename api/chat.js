// Vercel Serverless Function: POST /api/chat
// Expects JSON: { message: string }
// Returns JSON: { reply: string }

// Use dynamic import to be compatible with ESM-only 'openai' package on Vercel
let OpenAICtor;
async function getOpenAI() {
  if (!OpenAICtor) {
    const mod = await import('openai');
    OpenAICtor = mod.default || mod.OpenAI || mod;
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('API error:', err?.response?.data || err?.message || err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
