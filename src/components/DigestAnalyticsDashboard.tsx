import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Mail, MousePointer, TrendingUp, Users, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export function DigestAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

    const { data, error } = await supabase
      .from('digest_analytics')
      .select('*')
      .gte('sent_at', daysAgo.toISOString())
      .order('sent_at', { ascending: false });

    if (!error && data) {
      setAnalytics(data);
    }
    setLoading(false);
  };

  const stats = {
    totalSent: analytics.length,
    delivered: analytics.filter(a => a.delivered).length,
    opened: analytics.filter(a => a.opened).length,
    clicked: analytics.filter(a => a.clicked).length,
    avgNotifications: analytics.length > 0 
      ? (analytics.reduce((sum, a) => sum + a.notification_count, 0) / analytics.length).toFixed(1)
      : 0
  };

  const openRate = stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : 0;
  const clickRate = stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : 0;
  const deliveryRate = stats.totalSent > 0 ? ((stats.delivered / stats.totalSent) * 100).toFixed(1) : 0;

  const frequencyData = [
    { name: 'Daily', value: analytics.filter(a => a.frequency === 'daily').length },
    { name: 'Weekly', value: analytics.filter(a => a.frequency === 'weekly').length }
  ];

  const notificationTypes = analytics.reduce((acc, a) => {
    Object.entries(a.notification_types || {}).forEach(([type, count]) => {
      acc[type] = (acc[type] || 0) + (count as number);
    });
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(notificationTypes).map(([name, value]) => ({ name, value }));

  const dailyData = analytics.reduce((acc, a) => {
    const date = new Date(a.sent_at).toLocaleDateString();
    if (!acc[date]) acc[date] = { date, sent: 0, opened: 0, clicked: 0 };
    acc[date].sent++;
    if (a.opened) acc[date].opened++;
    if (a.clicked) acc[date].clicked++;
    return acc;
  }, {} as Record<string, any>);

  const trendData = Object.values(dailyData).slice(-14);

  const exportData = () => {
    const csv = [
      ['Date', 'Frequency', 'Notifications', 'Delivered', 'Opened', 'Clicked'].join(','),
      ...analytics.map(a => [
        new Date(a.sent_at).toLocaleString(),
        a.frequency,
        a.notification_count,
        a.delivered,
        a.opened,
        a.clicked
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digest-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Export complete', description: 'Analytics data downloaded' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Digest Analytics</h2>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.opened} of {stats.delivered} opened</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <MousePointer className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clickRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.clicked} of {stats.opened} clicked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.delivered} of {stats.totalSent} delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Digests</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-muted-foreground">Sent in selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Notifications</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgNotifications}</div>
            <p className="text-xs text-muted-foreground">Per digest email</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="Sent" />
                <Line type="monotone" dataKey="opened" stroke="#10b981" name="Opened" />
                <Line type="monotone" dataKey="clicked" stroke="#8b5cf6" name="Clicked" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frequency Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={frequencyData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {frequencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notification Types in Digests</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
