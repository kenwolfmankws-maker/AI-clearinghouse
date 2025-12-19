import { AIModel } from '@/data/aiModels';
import { supabase } from './supabase';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface FilterAction {
  action: 'filter';
  filters: {
    provider?: string;
    category?: string;
    pricingTier?: string;
    capabilities?: string[];
  };
}

export async function sendChatMessage(
  messages: { text: string; sender: 'user' | 'ai' }[],
  models: AIModel[],
  onStream?: (chunk: string) => void
): Promise<{ text: string; filterAction?: FilterAction }> {
  
  const modelSummary = `Available models include: ${models.slice(0, 20).map(m => 
    `${m.name} (${m.provider})`
  ).join(', ')}... and ${models.length - 20} more.`;

  const chatMessages = messages.map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text
  }));

  try {
    // Get the edge function URL
    const { data: { session } } = await supabase.auth.getSession();
    const anonKey = supabase.supabaseKey;
    const projectUrl = supabase.supabaseUrl;
    
    const response = await fetch(`${projectUrl}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        messages: chatMessages,
        modelContext: modelSummary
      }),
    });

    if (!response.ok) {
      throw new Error('Edge function error');
    }

    // Handle streaming response
    if (response.body && onStream) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                onStream(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      const filterAction = extractFilterAction(fullText);
      return { text: fullText, filterAction };
    }

    // Fallback to non-streaming
    const data = await response.json();
    const text = data.response || data.text || 'I can help you find AI models!';
    const filterAction = extractFilterAction(text);
    return { text, filterAction };

  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateIntelligentResponse(messages[messages.length - 1].text, models);
  }
}

function extractFilterAction(text: string): FilterAction | undefined {
  const filterMatch = text.match(/\[FILTER:([^\]]+)\]/);
  if (!filterMatch) return undefined;

  const filterStr = filterMatch[1];
  const filters: any = {};

  if (filterStr.includes('provider=')) {
    filters.provider = filterStr.match(/provider=([^,\]]+)/)?.[1];
  }
  if (filterStr.includes('category=')) {
    filters.category = filterStr.match(/category=([^,\]]+)/)?.[1];
  }
  if (filterStr.includes('pricing=')) {
    filters.pricingTier = filterStr.match(/pricing=([^,\]]+)/)?.[1];
  }

  return Object.keys(filters).length > 0 ? { action: 'filter', filters } : undefined;
}

function generateIntelligentResponse(query: string, models: AIModel[]): { text: string; filterAction?: FilterAction } {
  const q = query.toLowerCase();
  
  if (q.match(/cod(e|ing)|program|developer/)) {
    return {
      text: `For coding tasks, I recommend models like GPT-4, Claude 3.5 Sonnet, or specialized code models. Let me filter those for you.`,
      filterAction: { action: 'filter', filters: { category: 'Code' } }
    };
  }
  
  if (q.match(/cheap|free|budget|affordable/)) {
    return {
      text: `Here are budget-friendly AI models with great performance at lower costs.`,
      filterAction: { action: 'filter', filters: { pricingTier: 'low' } }
    };
  }
  
  if (q.match(/image|visual|picture|art/)) {
    return {
      text: `For image generation, check out DALL-E 3, Stable Diffusion, and Midjourney. Filtering vision models now.`,
      filterAction: { action: 'filter', filters: { category: 'Vision' } }
    };
  }
  
  if (q.match(/openai|gpt/)) {
    return {
      text: `Showing OpenAI models including GPT-4, GPT-3.5, and DALL-E.`,
      filterAction: { action: 'filter', filters: { provider: 'OpenAI' } }
    };
  }
  
  if (q.match(/anthropic|claude/)) {
    return {
      text: `Claude models excel at analysis and reasoning. Filtering Anthropic models.`,
      filterAction: { action: 'filter', filters: { provider: 'Anthropic' } }
    };
  }
  
  return {
    text: `I can help you find AI models! Ask about coding, images, budget options, or specific providers like OpenAI or Anthropic.`
  };
}
