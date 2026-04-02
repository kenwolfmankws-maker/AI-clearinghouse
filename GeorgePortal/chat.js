import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('Missing OPENAI_API_KEY. Put it in .env as OPENAI_API_KEY=sk-...');
    process.exit(1);
  }
  return new OpenAI({ apiKey: key });
}

export async function chat(userInput) {
  const client = getClient();
  const prompt = userInput && userInput.trim() ? userInput : 'Say hello in one short sentence.';
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    });
    const text = res.choices?.[0]?.message?.content?.trim() || '';
    console.log(text);
    return text;
  } catch (e) {
    console.error('Chat request failed:', e.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv.slice(2).join(' ');
  chat(input);
}

export { getClient };
