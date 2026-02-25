import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Globe, TrendingUp } from 'lucide-react';

interface RegionalCost {
  country_code: string;
  country_name: string;
  region: string;
  message_count: number;
  total_cost: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

export function SMSCostAnalysisChart() {
  const [costs, setCosts] = useState<RegionalCost[]>([]);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCosts();
  }, [period]);

  const loadCosts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDate = new Date();
      if (period === '7d') startDate.setDate(now.getDate() - 7);
      else if (period === '30d') startDate.setDate(now.getDate() - 30);
      else if (period === '90d') startDate.setDate(now.getDate() - 90);

      const { data, error } = await supabase
        .from('sms_cost_by_region')
        .select('*')
        .eq('org_id', user.id)
        .gte('period_start', startDate.toISOString())
        .order('total_cost', { ascending: false });

      if (error) throw error;

      // Aggregate by country
      const aggregated = (data || []).reduce((acc, item) => {
        const key = item.country_code;
        if (!acc[key]) {
          acc[key] = {
            country_code: item.country_code,
            country_name: item.country_name,
            region: item.region,
            message_count: 0,
            total_cost: 0,
          };
        }
        acc[key].message_count += item.message_count;
        acc[key].total_cost += parseFloat(item.total_cost);
        return acc;
      }, {} as Record<string, RegionalCost>);

      setCosts(Object.values(aggregated));
    } catch (error: any) {
      toast.error('Failed to load cost analysis');
    } finally {
      setLoading(false);
    }
  };

  const regionData = costs.reduce((acc, cost) => {
    const existing = acc.find(r => r.name === cost.region);
    if (existing) {
      existing.value += cost.total_cost;
      existing.messages += cost.message_count;
    } else {
      acc.push({ name: cost.region, value: cost.total_cost, messages: cost.message_count });
    }
    return acc;
  }, [] as { name: string; value: number; messages: number }[]);

  const totalCost = costs.reduce((sum, c) => sum + c.total_cost, 0);
  const totalMessages = costs.reduce((sum, c) => sum + c.message_count, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                SMS Cost by Region
              </CardTitle>
              <CardDescription>Geographic cost breakdown</CardDescription>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Messages Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${totalMessages > 0 ? (totalCost / totalMessages).toFixed(4) : '0.0000'}</div>
              <div className="text-sm text-muted-foreground">Avg Cost/Message</div>
            </div>
          </div>

          {regionData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={regionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${entry.name}: $${entry.value.toFixed(2)}`}>
                  {regionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cost by Country
          </CardTitle>
        </CardHeader>
        <CardContent>
          {costs.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={costs.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country_code" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="total_cost" fill="#3b82f6" name="Total Cost" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No data available</div>
          )}

          <div className="mt-6 space-y-2">
            {costs.slice(0, 10).map((cost) => (
              <div key={cost.country_code} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{cost.country_code}</Badge>
                  <div>
                    <div className="font-medium">{cost.country_name}</div>
                    <div className="text-sm text-muted-foreground">{cost.region}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${cost.total_cost.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">{cost.message_count} messages</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
