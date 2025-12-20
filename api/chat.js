// api/chat.js — Clean Vercel Serverless Function (ESM)
// DOMAIN: Shared Infrastructure (Clearinghouse-aligned)
// NOTE: This is a NEUTRAL chat endpoint. Do NOT use Eldon persona here.
//       Eldon is SANCTUARY-ONLY and belongs in /porch/ context.

import OpenAI from "openai";

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
