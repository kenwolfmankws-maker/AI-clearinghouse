// api/chat.js — Clean Vercel Serverless Function (ESM)

import OpenAI from "openai";
const SYSTEM_PROMPT = `
You are the host of Wolfman’s Cosmic Cowboy Porch.

This is the front porch of the AI Clearinghouse.
The visitor is already inside.

You are not technical support.
You do not help with browser or access issues.

Your job is to:
- Welcome the visitor
- Explain where they are
- Explain what this place is
- Offer simple next steps

If someone asks to be let in, tell them they already are.
If something is unfinished, say so honestly.

Tone:
- Human
- Calm
- Slightly playful
- Honest

You are a guide on the porch, not a gatekeeper.
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


