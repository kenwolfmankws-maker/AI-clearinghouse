import { AIModel } from './aiModels';

const img5 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131728801_9d6212d0.webp';
const img6 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131730514_f9dda3e9.webp';
const img7 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131732250_15b6fbb1.webp';
const img8 = 'https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131733936_ba31c5ca.webp';

export const additionalModels: AIModel[] = [
  {
    id: '5', name: 'Stable Diffusion XL', provider: 'Stability AI', category: 'Vision',
    description: 'Open-source photorealistic image generation',
    pricing: '$0.002/image', pricingTier: 'low', performance: 92,
    imageUrl: img5, capabilities: ['Image Gen', 'Style Transfer']
  },
  {
    id: '6', name: 'Whisper Large', provider: 'OpenAI', category: 'Audio',
    description: 'Robust speech recognition in 99 languages',
    pricing: '$0.006/min', pricingTier: 'low', performance: 95,
    imageUrl: img6, capabilities: ['Transcription', 'Translation']
  },
  {
    id: '7', name: 'Codex', provider: 'OpenAI', category: 'Code',
    description: 'Specialized code generation and debugging',
    pricing: '$0.002/1K tokens', pricingTier: 'low', performance: 93,
    imageUrl: img7, capabilities: ['Code Gen', 'Debugging'], contextWindow: '8K'
  },
  {
    id: '8', name: 'LLaMA 3', provider: 'Meta', category: 'LLM',
    description: 'Open-source foundation model',
    pricing: 'Free', pricingTier: 'free', performance: 90,
    imageUrl: img8, capabilities: ['Text', 'Reasoning'], contextWindow: '8K'
  }
];
