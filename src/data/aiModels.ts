export interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  pricing: string;
  pricingTier: 'free' | 'low' | 'medium' | 'high';
  performance: number;
  imageUrl: string;
  capabilities: string[];
  contextWindow?: string;
}

const img1 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131721924_2a0fe6e1.webp';
const img2 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131723619_ebf0046a.webp';
const img3 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131725358_6d9d399e.webp';
const img4 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131727089_f803549b.webp';
const img5 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131728801_9d6212d0.webp';
const img6 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131730514_f9dda3e9.webp';
const img7 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131732250_15b6fbb1.webp';
const img8 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131733936_ba31c5ca.webp';

export const aiModels: AIModel[] = [
  {
    id: '1', name: 'GPT-4 Turbo', provider: 'OpenAI', category: 'LLM',
    description: 'Most capable language model with advanced reasoning',
    pricing: '$0.01/1K tokens', pricingTier: 'high', performance: 98,
    imageUrl: img1, capabilities: ['Text', 'Code', 'Analysis'], contextWindow: '128K'
  },
  {
    id: '2', name: 'Claude 3 Opus', provider: 'Anthropic', category: 'LLM',
    description: 'Powerful AI with exceptional reasoning abilities',
    pricing: '$0.015/1K tokens', pricingTier: 'high', performance: 97,
    imageUrl: img2, capabilities: ['Analysis', 'Writing', 'Research'], contextWindow: '200K'
  },
  {
    id: '3', name: 'Gemini Pro', provider: 'Google', category: 'Multimodal',
    description: 'Versatile multimodal AI for text and images',
    pricing: '$0.0005/1K tokens', pricingTier: 'low', performance: 94,
    imageUrl: img3, capabilities: ['Text', 'Vision', 'Video'], contextWindow: '32K'
  },
  {
    id: '4', name: 'DALL-E 3', provider: 'OpenAI', category: 'Vision',
    description: 'State-of-the-art image generation',
    pricing: '$0.04/image', pricingTier: 'medium', performance: 96,
    imageUrl: img4, capabilities: ['Image Generation', 'Art']
  }
];
