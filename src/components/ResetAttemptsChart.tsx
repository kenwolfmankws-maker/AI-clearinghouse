import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartData {
  time: string;
  attempts: number;
  blocked: number;
}

interface Props {
  data: ChartData[];
}

export function ResetAttemptsChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Reset Attempts Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="attempts" stroke="#3b82f6" name="Total Attempts" />
            <Line type="monotone" dataKey="blocked" stroke="#ef4444" name="Blocked" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}