import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SpendingData {
  date: string;
  spend: number;
  projected: number;
}

export default function SMSCostProjectionDashboard() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [spendingData, setSpendingData] = useState<SpendingData[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSpend: 0,
    projectedSpend: 0,
    alertsCount: 0,
    daysRemaining: 0
  });

  useEffect(() => {
    fetchBudgets();
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (selectedBudget) {
      fetchSpendingData();
    }
  }, [selectedBudget]);

  const fetchBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sms_cost_budgets')
        .select('*')
        .eq('organization_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setBudgets(data || []);
      if (data && data.length > 0) {
        setSelectedBudget(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const fetchSpendingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const budget = budgets.find(b => b.id === selectedBudget);
      if (!budget) return;

      const startDate = new Date(budget.last_reset_at);
      const endDate = new Date();
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const { data, error } = await supabase
        .from('sms_notification_deliveries')
        .select('sent_at, cost')
        .eq('organization_id', user.id)
        .gte('sent_at', startDate.toISOString())
        .order('sent_at');

      if (error) throw error;

      const dailySpend: { [key: string]: number } = {};
      (data || []).forEach(item => {
        const date = new Date(item.sent_at).toISOString().split('T')[0];
        dailySpend[date] = (dailySpend[date] || 0) + (item.cost || 0);
      });

      const chartData: SpendingData[] = [];
      let cumulativeSpend = 0;
      const avgDailySpend = budget.current_spend / Math.max(days, 1);
      const totalDays = budget.budget_type === 'daily' ? 1 : 30;

      for (let i = 0; i < Math.min(days, totalDays); i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const daySpend = dailySpend[dateStr] || 0;
        cumulativeSpend += daySpend;

        chartData.push({
          date: dateStr,
          spend: cumulativeSpend,
          projected: avgDailySpend * (i + 1)
        });
      }

      // Add future projection
      for (let i = days; i < totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        chartData.push({
          date: date.toISOString().split('T')[0],
          spend: 0,
          projected: avgDailySpend * (i + 1)
        });
      }

      setSpendingData(chartData);

      const daysRemaining = totalDays - days;
      const projectedTotal = avgDailySpend * totalDays;

      setStats({
        totalSpend: budget.current_spend,
        projectedSpend: projectedTotal,
        alertsCount: alerts.filter(a => a.budget_id === selectedBudget).length,
        daysRemaining: Math.max(daysRemaining, 0)
      });
    } catch (error) {
      console.error('Error fetching spending data:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: budgetData } = await supabase
        .from('sms_cost_budgets')
        .select('id')
        .eq('organization_id', user.id);

      if (!budgetData) return;

      const budgetIds = budgetData.map(b => b.id);

      const { data, error } = await supabase
        .from('sms_cost_alerts')
        .select('*')
        .in('budget_id', budgetIds)
        .order('alert_sent_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const currentBudget = budgets.find(b => b.id === selectedBudget);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cost Projections & Budget Tracking</h2>
        <Select value={selectedBudget} onValueChange={setSelectedBudget}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select budget" />
          </SelectTrigger>
          <SelectContent>
            {budgets.map(budget => (
              <SelectItem key={budget.id} value={budget.id}>
                {budget.budget_type.charAt(0).toUpperCase() + budget.budget_type.slice(1)} Budget
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">${stats.totalSpend.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projected Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold">${stats.projectedSpend.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.daysRemaining}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alerts Triggered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-2xl font-bold">{stats.alertsCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spending Trend & Projection</CardTitle>
          <CardDescription>Actual vs projected spending over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="spend" stroke="#3b82f6" name="Actual Spend" strokeWidth={2} />
              <Line type="monotone" dataKey="projected" stroke="#a855f7" strokeDasharray="5 5" name="Projected" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {currentBudget && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Budget Limit:</span>
                <span className="font-medium">${currentBudget.budget_limit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Usage:</span>
                <span className="font-medium">{((currentBudget.current_spend / currentBudget.budget_limit) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    (currentBudget.current_spend / currentBudget.budget_limit) * 100 >= currentBudget.critical_threshold 
                      ? 'bg-red-600' 
                      : (currentBudget.current_spend / currentBudget.budget_limit) * 100 >= currentBudget.warning_threshold 
                      ? 'bg-yellow-600' 
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min((currentBudget.current_spend / currentBudget.budget_limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
