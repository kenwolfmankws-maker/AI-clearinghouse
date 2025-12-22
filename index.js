// Top-level runner and simple chat helper (ESM)
// Loads environment from .env so you don't need to set PowerShell env vars

import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

export function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('Missing OPENAI_API_KEY.');
    console.error('Create a .env file with:');
    console.error('  OPENAI_API_KEY=sk-your-real-key');
    process.exit(1);
  }
  return new OpenAI({ apiKey: key });
}

export async function chat(message) {
  const client = getClient();
  const prompt = message && message.trim() ? message : 'Say hello briefly.';
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    });
    const out = res.choices?.[0]?.message?.content?.trim() || '';
    console.log(out);
    return out;
  } catch (err) {
    console.error('Chat failed:', err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv.slice(2).join(' ');
  chat(input);
}
