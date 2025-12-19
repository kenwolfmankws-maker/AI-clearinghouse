require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

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
    res.status(500).json({ 
      error: 'Failed to get response',
      details: error.message 
    });
  }
});

// Serve index.html for root (AI Clearinghouse)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🏠 AI Clearinghouse: http://localhost:${PORT}/`);
});
