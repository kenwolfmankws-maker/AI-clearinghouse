import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, CheckCircle, XCircle, DollarSign, TrendingUp, Download } from 'lucide-react';
import SMSDeliveryChart from './SMSDeliveryChart';


export default function SMSAnalyticsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    totalCost: 0,
    deliveryRate: 0
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, severityFilter]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('sms_notification_deliveries')
        .select('*')
        .order('sent_at', { ascending: false });

      if (dateRange.start) {
        query = query.gte('sent_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('sent_at', dateRange.end);
      }
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setDeliveries(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const total = data.length;
    const delivered = data.filter(d => d.status === 'delivered').length;
    const failed = data.filter(d => d.status === 'failed').length;
    const pending = data.filter(d => d.status === 'pending').length;
    const totalCost = data.reduce((sum, d) => sum + (d.cost || 0), 0);
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

    setStats({ total, delivered, failed, pending, totalCost, deliveryRate });
  };

  const getDeliveryChartData = () => {
    const grouped = deliveries.reduce((acc, d) => {
      const date = new Date(d.sent_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, delivered: 0, failed: 0, total: 0 };
      }
      acc[date].total++;
      if (d.status === 'delivered') acc[date].delivered++;
      if (d.status === 'failed') acc[date].failed++;
      return acc;
    }, {});

    return Object.values(grouped).map((g: any) => ({
      ...g,
      rate: g.total > 0 ? (g.delivered / g.total) * 100 : 0
    }));
  };

  const getCostChartData = () => {
    const grouped = deliveries.reduce((acc, d) => {
      const recipient = d.recipient_phone;
      if (!acc[recipient]) {
        acc[recipient] = { recipient, messages: 0, cost: 0 };
      }
      acc[recipient].messages++;
      acc[recipient].cost += d.cost || 0;
      return acc;
    }, {});

    return Object.values(grouped).map((g: any) => ({
      ...g,
      avgCost: g.messages > 0 ? g.cost / g.messages : 0
    }));
  };

  const exportData = () => {
    const csv = [
      ['Date', 'Recipient', 'Severity', 'Status', 'Cost', 'Message'].join(','),
      ...deliveries.map(d => [
        new Date(d.sent_at).toLocaleString(),
        d.recipient_phone,
        d.severity,
        d.status,
        d.cost || 0,
        `"${d.message_preview}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-analytics-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">SMS Delivery Analytics</h2>
        <Button onClick={exportData} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Delivery Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.deliveryRate.toFixed(2)}%</div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Input
          type="date"
          placeholder="Start Date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
        />
        <Input
          type="date"
          placeholder="End Date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
        />
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SMSDeliveryChart data={getDeliveryChartData()} />


      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>{new Date(delivery.sent_at).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-sm">{delivery.recipient_phone}</TableCell>
                  <TableCell>
                    <Badge variant={
                      delivery.severity === 'critical' ? 'destructive' :
                      delivery.severity === 'high' ? 'default' : 'secondary'
                    }>
                      {delivery.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      delivery.status === 'delivered' ? 'default' :
                      delivery.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {delivery.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${(delivery.cost || 0).toFixed(4)}</TableCell>
                  <TableCell className="max-w-xs truncate">{delivery.message_preview}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
