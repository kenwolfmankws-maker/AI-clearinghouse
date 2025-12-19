import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, DollarSign, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Budget {
  id: string;
  budget_type: 'daily' | 'monthly';
  budget_limit: number;
  current_spend: number;
  warning_threshold: number;
  critical_threshold: number;
  alert_email: string;
  alert_slack_channel: string;
  is_active: boolean;
}

export default function SMSCostBudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    budget_type: 'monthly' as 'daily' | 'monthly',
    budget_limit: '',
    warning_threshold: '80',
    critical_threshold: '95',
    alert_email: '',
    alert_slack_channel: ''
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sms_cost_budgets')
        .select('*')
        .eq('organization_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error: any) {
      toast.error('Failed to load budgets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('sms_cost_budgets').insert({
        organization_id: user.id,
        budget_type: formData.budget_type,
        budget_limit: parseFloat(formData.budget_limit),
        warning_threshold: parseInt(formData.warning_threshold),
        critical_threshold: parseInt(formData.critical_threshold),
        alert_email: formData.alert_email || null,
        alert_slack_channel: formData.alert_slack_channel || null
      });

      if (error) throw error;
      toast.success('Budget created successfully');
      setShowForm(false);
      setFormData({
        budget_type: 'monthly',
        budget_limit: '',
        warning_threshold: '80',
        critical_threshold: '95',
        alert_email: '',
        alert_slack_channel: ''
      });
      fetchBudgets();
    } catch (error: any) {
      toast.error('Failed to create budget: ' + error.message);
    }
  };

  const toggleBudget = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('sms_cost_budgets')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Budget ${!isActive ? 'activated' : 'deactivated'}`);
      fetchBudgets();
    } catch (error: any) {
      toast.error('Failed to update budget: ' + error.message);
    }
  };

  const deleteBudget = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try {
      const { error } = await supabase.from('sms_cost_budgets').delete().eq('id', id);
      if (error) throw error;
      toast.success('Budget deleted');
      fetchBudgets();
    } catch (error: any) {
      toast.error('Failed to delete budget: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">SMS Cost Budgets</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Budget Type</Label>
                  <Select value={formData.budget_type} onValueChange={(v: any) => setFormData({...formData, budget_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Budget Limit ($)</Label>
                  <Input type="number" step="0.01" value={formData.budget_limit} onChange={(e) => setFormData({...formData, budget_limit: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Warning Threshold (%)</Label>
                  <Input type="number" value={formData.warning_threshold} onChange={(e) => setFormData({...formData, warning_threshold: e.target.value})} />
                </div>
                <div>
                  <Label>Critical Threshold (%)</Label>
                  <Input type="number" value={formData.critical_threshold} onChange={(e) => setFormData({...formData, critical_threshold: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Alert Email</Label>
                <Input type="email" value={formData.alert_email} onChange={(e) => setFormData({...formData, alert_email: e.target.value})} />
              </div>
              <div>
                <Label>Slack Channel</Label>
                <Input value={formData.alert_slack_channel} onChange={(e) => setFormData({...formData, alert_slack_channel: e.target.value})} placeholder="#alerts" />
              </div>
              <Button type="submit">Create Budget</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {budgets.map((budget) => {
          const percentUsed = (budget.current_spend / budget.budget_limit) * 100;
          return (
            <Card key={budget.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5" />
                      <h3 className="font-semibold capitalize">{budget.budget_type} Budget</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Limit:</span>
                        <span className="font-medium">${budget.budget_limit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Spend:</span>
                        <span className="font-medium">${budget.current_spend.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usage:</span>
                        <span className={`font-medium ${percentUsed >= budget.critical_threshold ? 'text-red-600' : percentUsed >= budget.warning_threshold ? 'text-yellow-600' : 'text-green-600'}`}>
                          {percentUsed.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${percentUsed >= budget.critical_threshold ? 'bg-red-600' : percentUsed >= budget.warning_threshold ? 'bg-yellow-600' : 'bg-green-600'}`} style={{width: `${Math.min(percentUsed, 100)}%`}} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={budget.is_active} onCheckedChange={() => toggleBudget(budget.id, budget.is_active)} />
                    <Button variant="ghost" size="icon" onClick={() => deleteBudget(budget.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
