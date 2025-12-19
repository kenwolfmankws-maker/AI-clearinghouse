// api/chat.js — Clean Vercel Serverless Function (ESM)

import OpenAI from "openai";
const SYSTEM_PROMPT = `
You are an AI assistant for the AI Clearinghouse.

The AI Clearinghouse is a neutral marketplace for AI services and capabilities.

Your role is to:
- Provide information about available AI services
- Answer questions about API integration
- Help users understand different AI models and their capabilities
- Assist with technical inquiries in a clear and professional manner

Tone:
- Professional
- Helpful
- Clear
- Neutral
`;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
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


    return res.status(200).json({ reply });
  } catch (err) {
    console.error("/api/chat error:", err);
    return res.status(500).json({ error: err.message });
  }
}

