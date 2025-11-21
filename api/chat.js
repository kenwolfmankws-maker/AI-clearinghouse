// api/chat.js — Clean Vercel Serverless Function (ESM)

import OpenAI from "openai";

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
      messages: [{ role: "user", content: message }],
    });

    const reply = completion.choices[0]?.message?.content || "";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("/api/chat error:", err);
    return res.status(500).json({ error: err.message });
  }
}


