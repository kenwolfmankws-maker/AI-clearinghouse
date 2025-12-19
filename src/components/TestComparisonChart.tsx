import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TestData {
  id: string;
  name: string;
  avg_open_rate: number;
  avg_click_rate: number;
  completed_at: string;
}

interface TestComparisonChartProps {
  tests: TestData[];
  metric: 'open_rate' | 'click_rate';
}

export default function TestComparisonChart({ tests, metric }: TestComparisonChartProps) {
  const sortedTests = [...tests].sort((a, b) => 
    new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );

  const data = sortedTests.map((test, index) => ({
    index: index + 1,
    name: test.name.substring(0, 20),
    value: metric === 'open_rate' ? test.avg_open_rate : test.avg_click_rate,
    date: new Date(test.completed_at).toLocaleDateString()
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {metric === 'open_rate' ? 'Open Rate' : 'Click Rate'} Trends Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: '%', position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(2)}%`}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            name={metric === 'open_rate' ? 'Open Rate' : 'Click Rate'}
            dot={{ fill: '#8b5cf6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
