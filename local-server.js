import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY. Add it to your .env file.');
  }
  return new OpenAI({ apiKey });
}

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Clearinghouse API is running' });
  });

  // Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const openai = getClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: message }],
        max_tokens: 500,
        temperature: 0.7
      });
      const choice = completion.choices?.[0] || {};
      const raw = choice?.message?.content ?? '';
      const reply = typeof raw === 'string' ? raw.trim() : '';
      const usage = completion.usage || {};
      const truncated = Boolean(choice?.finish_reason && choice.finish_reason !== 'stop');

      if (!reply) {
        console.warn('[local-chat] empty reply from model', {
          finish_reason: choice?.finish_reason,
          usage,
        });
      }

      console.log('[local-chat] completion success', {
        id: completion.id,
        chars: reply.length,
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
      });
      return res.status(200).json({
        reply,
        model: 'gpt-4o-mini',
        mode: 'local',
        id: completion.id,
        tokens: {
          prompt: usage.prompt_tokens || 0,
          completion: usage.completion_tokens || 0,
          total: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
        },
        truncated,
      });

    } catch (error) {
      console.error('Chat error:', error);
      const message = error?.message || 'Unknown error';
      res.status(500).json({
        error: 'Failed to get response',
        details: message
      });
    }
  });

  // Serve index.html for root
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  return app;
}

const app = createApp();

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API endpoint: http://localhost:${PORT}/api/chat`);
  });
}

export default app;
