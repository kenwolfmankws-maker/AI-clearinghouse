import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface UsageChartProps {
  data: Array<{ date: string; calls: number; cost: number; violations: number }>;
  title?: string;
}

export function UsageChart({ data, title = 'API Usage Trends' }: UsageChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>Track API calls and costs over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="calls" stroke="#8884d8" name="API Calls" />
            <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#82ca9d" name="Cost ($)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
