import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SMSDeliveryChartProps {
  data: Array<{
    date: string;
    delivered: number;
    failed: number;
    total: number;
    rate: number;
  }>;
}

export default function SMSDeliveryChart({ data }: SMSDeliveryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Success Rate Over Time</CardTitle>
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
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="delivered"
              stroke="#10b981"
              name="Delivered"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="failed"
              stroke="#ef4444"
              name="Failed"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              name="Success Rate %"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
