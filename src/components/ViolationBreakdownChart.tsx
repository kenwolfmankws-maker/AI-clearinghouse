import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ViolationBreakdownChartProps {
  reports: any[];
}

export function ViolationBreakdownChart({ reports }: ViolationBreakdownChartProps) {
  // Aggregate violation types across all reports
  const violationCounts: Record<string, number> = {};
  
  reports.forEach(report => {
    if (report.report_data?.violations) {
      report.report_data.violations.forEach((v: any) => {
        const type = v.violation_type || 'Unknown';
        violationCounts[type] = (violationCounts[type] || 0) + 1;
      });
    }
  });

  const chartData = Object.entries(violationCounts)
    .map(([type, count]) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Common Violations</CardTitle>
        <p className="text-sm text-muted-foreground">
          Top policy violations across all reports
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="type" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="count" 
              fill="#ef4444" 
              name="Violation Count"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
