import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface SuccessRateChartProps {
  data: Array<{ date: string; calls: number; cost: number; violations: number }>;
}

export function SuccessRateChart({ data }: SuccessRateChartProps) {
  const chartData = data.map(d => ({
    date: d.date,
    successful: d.calls - d.violations,
    violations: d.violations,
    successRate: d.calls > 0 ? ((d.calls - d.violations) / d.calls * 100).toFixed(1) : 100,
  }));

  const totalViolations = data.reduce((sum, d) => sum + d.violations, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Rate Limit Violations
        </CardTitle>
        <CardDescription>Total violations: {totalViolations}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="successful" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Successful" />
            <Area type="monotone" dataKey="violations" stackId="1" stroke="#ff6b6b" fill="#ff6b6b" name="Violations" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
