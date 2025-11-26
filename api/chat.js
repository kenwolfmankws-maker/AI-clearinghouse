import OpenAI from "openai";

export default async function handler(request) {
  try {
    // Allow only POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create client ONCE
    const client = new OpenAI({ apiKey });

    // Parse body
    const body = await request.json();
    const message = body?.message;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call GPT
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }]
    });

    const reply = completion.choices[0].message.content;

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("API ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
