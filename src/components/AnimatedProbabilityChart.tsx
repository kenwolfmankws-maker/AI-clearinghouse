import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface AnimatedProbabilityChartProps {
  bayesianData: any[];
}

export function AnimatedProbabilityChart({ bayesianData }: AnimatedProbabilityChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    // Transform data for chart
    const data = bayesianData.map(v => ({
      name: v.variant_name,
      'Probability of Being Best': (v.probability_best * 100).toFixed(1),
      'Posterior Mean': (v.posterior_mean * 100).toFixed(1),
      'Thompson Score': (v.thompson_sampling_score * 100).toFixed(1)
    }));

    setChartData(data);
    setAnimationKey(prev => prev + 1);
  }, [bayesianData]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Probability Analysis (Live)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} key={animationKey}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                border: 'none', 
                borderRadius: '8px',
                animation: 'fadeIn 0.3s'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Probability of Being Best" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ r: 6 }}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
            <Line 
              type="monotone" 
              dataKey="Posterior Mean" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
            <Line 
              type="monotone" 
              dataKey="Thompson Score" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
