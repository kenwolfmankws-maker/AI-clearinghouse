import { AIModel } from './aiModels';

const img1 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131721924_2a0fe6e1.webp';

export const extendedModels: AIModel[] = [
  {
    id: '9', name: 'Mistral Large', provider: 'Mistral AI', category: 'LLM',
    description: 'European AI with multilingual excellence',
    pricing: '$0.008/1K tokens', pricingTier: 'medium', performance: 91,
    imageUrl: img1, capabilities: ['Text', 'Multi-language'], contextWindow: '32K'
  },
  {
    id: '10', name: 'PaLM 2', provider: 'Google', category: 'LLM',
    description: 'Advanced reasoning and multilingual model',
    pricing: '$0.0005/1K tokens', pricingTier: 'low', performance: 89,
    imageUrl: img1, capabilities: ['Reasoning', 'Translation']
  },
  {
    id: '11', name: 'Midjourney v6', provider: 'Midjourney', category: 'Vision',
    description: 'Artistic image generation with stunning quality',
    pricing: '$10/month', pricingTier: 'medium', performance: 95,
    imageUrl: img1, capabilities: ['Art', 'Design']
  },
  {
    id: '12', name: 'ElevenLabs', provider: 'ElevenLabs', category: 'Audio',
    description: 'Natural voice synthesis and cloning',
    pricing: '$0.30/1K chars', pricingTier: 'medium', performance: 94,
    imageUrl: img1, capabilities: ['TTS', 'Voice Clone']
  }
];
