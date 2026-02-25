import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Clock } from 'lucide-react';

interface GracePeriodStatsProps {
  history: any[];
}

export function GracePeriodStats({ history }: GracePeriodStatsProps) {
  const getGracePeriodUsage = () => {
    const recent = history.slice(0, 50);
    const withGrace = recent.filter(h => h.grace_period_days > 0).length;
    const withoutGrace = recent.length - withGrace;
    
    return [
      { name: 'With Grace Period', value: withGrace, color: '#10b981' },
      { name: 'Immediate Rotation', value: withoutGrace, color: '#3b82f6' }
    ];
  };

  const data = getGracePeriodUsage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Grace Period Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
