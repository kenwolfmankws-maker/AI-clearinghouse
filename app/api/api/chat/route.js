import OpenAI from "openai";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OpenAI API Key." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { message } = body;
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "POST body must contain a 'message' string." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Eldon, Gatekeeper of the Clearinghouse." },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat API Error:", error);

    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export function GET() {
  return new Response(
    JSON.stringify({ error: "Method GET not allowed. Use POST." }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
}
import OpenAI from "openai";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OpenAI API Key." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { message } = body;
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "POST body must contain a 'message' string." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Eldon, Gatekeeper of the Clearinghouse." },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat API Error:", error);

    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export function GET() {
  return new Response(
    JSON.stringify({ error: "Method GET not allowed. Use POST." }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
}
