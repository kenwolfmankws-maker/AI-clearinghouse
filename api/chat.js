// api/chat.js — Clean Vercel Serverless Function (ESM)

import OpenAI from "openai";

export default async function handler(request) {
  try {
    // Vercel functions use Web API Request object
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new OpenAI({ apiKey });

    // Parse request body from Web API Request
    const body = await request.json();
    const { message } = body;
    
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'message' field in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    const reply = completion.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("/api/chat error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


