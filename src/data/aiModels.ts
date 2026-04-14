export interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  capabilities: string[];
  pricingTier: 'free' | 'low' | 'medium' | 'high';
  pricing: string;
  performance: string;
  imageUrl: string;
  contextWindow?: string;
}

export const aiModels: AIModel[] = [];
