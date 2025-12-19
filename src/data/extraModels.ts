import { AIModel } from './aiModels';

const img = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131725358_6d9d399e.webp';

export const extraModels: AIModel[] = [
  {
    id: '18', name: 'Anthropic Claude Instant', provider: 'Anthropic', category: 'LLM',
    description: 'Fast, affordable Claude variant',
    pricing: '$0.0008/1K tokens', pricingTier: 'low', performance: 82,
    imageUrl: img, capabilities: ['Chat', 'Speed']
  },
  {
    id: '19', name: 'Replicate SDXL', provider: 'Replicate', category: 'Vision',
    description: 'Cloud-hosted Stable Diffusion',
    pricing: '$0.0025/image', pricingTier: 'low', performance: 91,
    imageUrl: img, capabilities: ['Images', 'API']
  },
  {
    id: '20', name: 'Hugging Face Inference', provider: 'Hugging Face', category: 'Multimodal',
    description: 'Access thousands of open models',
    pricing: 'Free tier', pricingTier: 'free', performance: 80,
    imageUrl: img, capabilities: ['Various', 'Open Source']
  },
  {
    id: '21', name: 'Azure OpenAI', provider: 'Microsoft', category: 'LLM',
    description: 'Enterprise OpenAI with Azure integration',
    pricing: '$0.01/1K tokens', pricingTier: 'high', performance: 97,
    imageUrl: img, capabilities: ['Enterprise', 'Secure']
  }
];
