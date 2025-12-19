import { supabase } from './supabase';

interface LogApiCallParams {
  userId: string;
  modelName: string;
  modelProvider: string;
  status: 'success' | 'error';
  responseTime?: number;
  cost?: number;
  errorMessage?: string;
}

export async function logApiCall(params: LogApiCallParams) {
  try {
    const { data, error } = await supabase.functions.invoke('log-api-call', {
      body: params
    });

    if (error) {
      console.error('Failed to log API call:', error);
    }

    return { data, error };
  } catch (err) {
    console.error('Error logging API call:', err);
    return { data: null, error: err };
  }
}

// Generate sample analytics data for testing
export async function generateSampleData(userId: string, count: number = 50) {
  const models = [
    { name: 'GPT-4', provider: 'OpenAI', cost: 0.03 },
    { name: 'GPT-3.5 Turbo', provider: 'OpenAI', cost: 0.002 },
    { name: 'Claude 3 Opus', provider: 'Anthropic', cost: 0.015 },
    { name: 'Claude 3 Sonnet', provider: 'Anthropic', cost: 0.003 },
    { name: 'Gemini Pro', provider: 'Google', cost: 0.00025 },
    { name: 'Llama 2 70B', provider: 'Meta', cost: 0.0007 },
    { name: 'Mistral Large', provider: 'Mistral', cost: 0.008 },
    { name: 'Command R+', provider: 'Cohere', cost: 0.003 }
  ];

  const promises = [];
  
  for (let i = 0; i < count; i++) {
    const model = models[Math.floor(Math.random() * models.length)];
    const status = Math.random() > 0.1 ? 'success' : 'error';
    const daysAgo = Math.floor(Math.random() * 30);
    
    promises.push(
      logApiCall({
        userId,
        modelName: model.name,
        modelProvider: model.provider,
        status,
        responseTime: Math.floor(Math.random() * 2000) + 100,
        cost: status === 'success' ? model.cost : 0,
        errorMessage: status === 'error' ? 'Sample error message' : undefined
      })
    );
    
    // Add small delay to avoid overwhelming the server
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  await Promise.all(promises);
}
