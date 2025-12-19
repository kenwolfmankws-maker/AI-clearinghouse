import { AIModel } from './aiModels';

const img = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131727089_f803549b.webp';

export const lastModels: AIModel[] = [
  {
    id: '22', name: 'Jasper AI', provider: 'Jasper', category: 'LLM',
    description: 'Marketing-focused content generation',
    pricing: '$49/month', pricingTier: 'high', performance: 84,
    imageUrl: img, capabilities: ['Marketing', 'Content']
  },
  {
    id: '23', name: 'Synthesia', provider: 'Synthesia', category: 'Vision',
    description: 'AI video avatars and presentations',
    pricing: '$30/month', pricingTier: 'high', performance: 87,
    imageUrl: img, capabilities: ['Video', 'Avatars']
  },
  {
    id: '24', name: 'Descript Overdub', provider: 'Descript', category: 'Audio',
    description: 'Voice cloning for audio editing',
    pricing: '$12/month', pricingTier: 'medium', performance: 89,
    imageUrl: img, capabilities: ['Voice', 'Editing']
  },
  {
    id: '25', name: 'Perplexity AI', provider: 'Perplexity', category: 'LLM',
    description: 'AI-powered search and research',
    pricing: '$20/month', pricingTier: 'medium', performance: 88,
    imageUrl: img, capabilities: ['Search', 'Research']
  }
];
