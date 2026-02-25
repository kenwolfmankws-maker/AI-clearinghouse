import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface RotationAuditChartProps {
  auditLogs: any[];
}

export function RotationAuditChart({ auditLogs }: RotationAuditChartProps) {
  const getRotationTrends = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentLogs = auditLogs.filter(log => 
      new Date(log.created_at) >= last30Days
    );

    const groupedByDay = recentLogs.reduce((acc: any, log) => {
      const date = new Date(log.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, manual: 0, automatic: 0, total: 0 };
      }
      if (log.action === 'manual_rotation') acc[date].manual++;
      if (log.action === 'automatic_rotation') acc[date].automatic++;
      acc[date].total++;
      return acc;
    }, {});

    return Object.values(groupedByDay).slice(-14);
  };

  const data = getRotationTrends();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Rotation Frequency Trends (Last 14 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="manual" fill="#3b82f6" name="Manual" />
            <Bar dataKey="automatic" fill="#10b981" name="Automatic" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
