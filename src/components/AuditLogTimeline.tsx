import { Card } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuditLog {
  created_at: string;
  action_type: string;
}

interface AuditLogTimelineProps {
  logs: AuditLog[];
}

export default function AuditLogTimeline({ logs }: AuditLogTimelineProps) {
  const generateTimelineData = () => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(log => 
        format(new Date(log.created_at), 'yyyy-MM-dd') === dayStr
      );

      return {
        date: format(day, 'MMM dd'),
        total: dayLogs.length,
        api_key: dayLogs.filter(l => l.action_type.includes('api_key')).length,
        collection: dayLogs.filter(l => l.action_type.includes('collection')).length,
        organization: dayLogs.filter(l => l.action_type.includes('organization')).length,
        member: dayLogs.filter(l => l.action_type.includes('member')).length
      };
    });
  };

  const timelineData = generateTimelineData();

  const chartConfig = {
    total: { label: 'Total', color: 'hsl(var(--chart-1))' },
    api_key: { label: 'API Keys', color: 'hsl(var(--chart-2))' },
    collection: { label: 'Collections', color: 'hsl(var(--chart-3))' },
    organization: { label: 'Organizations', color: 'hsl(var(--chart-4))' },
    member: { label: 'Members', color: 'hsl(var(--chart-5))' }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Activity Timeline</h2>
      <Tabs defaultValue="total" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="total">Total Activity</TabsTrigger>
          <TabsTrigger value="breakdown">By Category</TabsTrigger>
        </TabsList>
        
        <TabsContent value="total" className="mt-4">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
        
        <TabsContent value="breakdown" className="mt-4">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="api_key" fill="var(--color-api_key)" />
                <Bar dataKey="collection" fill="var(--color-collection)" />
                <Bar dataKey="organization" fill="var(--color-organization)" />
                <Bar dataKey="member" fill="var(--color-member)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
