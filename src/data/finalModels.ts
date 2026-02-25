import { AIModel } from './aiModels';

const img = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131723619_ebf0046a.webp';

export const finalModels: AIModel[] = [
  {
    id: '13', name: 'GPT-3.5 Turbo', provider: 'OpenAI', category: 'LLM',
    description: 'Fast and efficient language model',
    pricing: '$0.0015/1K tokens', pricingTier: 'low', performance: 85,
    imageUrl: img, capabilities: ['Text', 'Chat'], contextWindow: '16K'
  },
  {
    id: '14', name: 'Claude 3 Sonnet', provider: 'Anthropic', category: 'LLM',
    description: 'Balanced performance and speed',
    pricing: '$0.003/1K tokens', pricingTier: 'low', performance: 88,
    imageUrl: img, capabilities: ['Writing', 'Analysis']
  },
  {
    id: '15', name: 'Cohere Command', provider: 'Cohere', category: 'LLM',
    description: 'Enterprise-focused language model',
    pricing: '$0.002/1K tokens', pricingTier: 'low', performance: 86,
    imageUrl: img, capabilities: ['Business', 'Analysis']
  },
  {
    id: '16', name: 'GitHub Copilot', provider: 'GitHub', category: 'Code',
    description: 'AI pair programmer for developers',
    pricing: '$10/month', pricingTier: 'medium', performance: 91,
    imageUrl: img, capabilities: ['Code', 'Autocomplete']
  },
  {
    id: '17', name: 'Runway Gen-2', provider: 'Runway', category: 'Vision',
    description: 'AI video generation and editing',
    pricing: '$0.05/sec', pricingTier: 'high', performance: 90,
    imageUrl: img, capabilities: ['Video', 'Editing']
  }
];
