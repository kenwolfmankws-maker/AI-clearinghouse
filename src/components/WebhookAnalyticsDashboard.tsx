import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Download, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { exportWebhookAnalytics, downloadFile } from '@/lib/webhookAnalyticsExport';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function WebhookAnalyticsDashboard() {
  const [dailyTrends, setDailyTrends] = useState<any[]>([]);
  const [hourlyPatterns, setHourlyPatterns] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    webhookType: '',
    status: '',
    endpoint: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [trendsRes, patternsRes] = await Promise.all([
        supabase.rpc('get_webhook_daily_trends', { days_back: 30 }),
        supabase.rpc('get_webhook_hourly_patterns', { days_back: 7 }),
      ]);

      if (trendsRes.data) setDailyTrends(trendsRes.data);
      if (patternsRes.data) setHourlyPatterns(patternsRes.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const content = await exportWebhookAnalytics(filters, format);
      const filename = `webhook-analytics-${Date.now()}.${format}`;
      downloadFile(content, filename, format === 'csv' ? 'text/csv' : 'application/json');
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Webhook Analytics</h2>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('csv')} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => handleExport('json')} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Trends (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="successful_deliveries" stroke="#10b981" name="Success" />
              <Line type="monotone" dataKey="failed_deliveries" stroke="#ef4444" name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Peak Usage Hours (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyPatterns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour_of_day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_deliveries" fill="#3b82f6" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
