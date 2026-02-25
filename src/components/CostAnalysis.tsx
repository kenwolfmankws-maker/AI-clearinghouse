import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

interface CostAnalysisProps {
  data: Array<{ date: string; calls: number; cost: number; violations: number }>;
}

export function CostAnalysis({ data }: CostAnalysisProps) {
  const totalCost = data.reduce((sum, d) => sum + d.cost, 0);
  const avgCost = data.length > 0 ? totalCost / data.length : 0;
  
  // Project next period cost based on trend
  const recentData = data.slice(-7);
  const recentAvg = recentData.reduce((sum, d) => sum + d.cost, 0) / recentData.length;
  const projection = recentAvg * 30;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cost Analysis & Projections
        </CardTitle>
        <CardDescription>
          Total: ${totalCost.toFixed(2)} | Avg: ${avgCost.toFixed(4)}/period | 30-day projection: ${projection.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
            <Legend />
            <Bar dataKey="cost" fill="#82ca9d" name="Cost ($)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
