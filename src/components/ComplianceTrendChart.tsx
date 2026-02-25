import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ComplianceTrendChartProps {
  reports: any[];
}

export function ComplianceTrendChart({ reports }: ComplianceTrendChartProps) {
  const chartData = reports
    .slice(0, 30)
    .reverse()
    .map(report => ({
      date: format(new Date(report.generated_at), 'MMM dd'),
      compliance: report.compliance_rate || 0,
      violations: report.policy_violations || 0,
      expiring: report.keys_expiring_soon || 0,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Trends Over Time</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track compliance rate, violations, and expiring keys across reports
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="compliance" 
              stroke="#22c55e" 
              strokeWidth={2}
              name="Compliance Rate (%)"
            />
            <Line 
              type="monotone" 
              dataKey="violations" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Violations"
            />
            <Line 
              type="monotone" 
              dataKey="expiring" 
              stroke="#f97316" 
              strokeWidth={2}
              name="Expiring Keys"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
