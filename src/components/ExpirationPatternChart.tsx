import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ExpirationPatternChartProps {
  reports: any[];
}

export function ExpirationPatternChart({ reports }: ExpirationPatternChartProps) {
  const chartData = reports
    .slice(0, 20)
    .reverse()
    .map(report => {
      const expiringData = report.report_data?.expiring_keys || [];
      const within7Days = expiringData.filter((k: any) => {
        const days = Math.floor((new Date(k.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 7;
      }).length;
      const within30Days = expiringData.filter((k: any) => {
        const days = Math.floor((new Date(k.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days > 7 && days <= 30;
      }).length;

      return {
        date: format(new Date(report.generated_at), 'MMM dd'),
        within7Days,
        within30Days,
      };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiration Patterns</CardTitle>
        <p className="text-sm text-muted-foreground">
          Keys expiring within 7 and 30 days over time
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="within7Days" 
              stackId="1"
              stroke="#dc2626" 
              fill="#dc2626"
              name="Within 7 Days"
            />
            <Area 
              type="monotone" 
              dataKey="within30Days" 
              stackId="1"
              stroke="#f97316" 
              fill="#f97316"
              name="Within 30 Days"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
