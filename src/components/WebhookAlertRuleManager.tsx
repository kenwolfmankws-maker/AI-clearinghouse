import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Plus, Trash2, Edit, Bell } from 'lucide-react';
import { toast } from 'sonner';

export function WebhookAlertRuleManager() {
  const [rules, setRules] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    webhook_type: '',
    endpoint_url: '',
    condition_type: 'failure_rate',
    threshold_value: 10,
    time_window_minutes: 60,
    notification_channels: ['email'],
    is_critical: false,
    is_enabled: true
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const { data, error } = await supabase
      .from('webhook_alert_rules')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setRules(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      webhook_type: formData.webhook_type || null,
      endpoint_url: formData.endpoint_url || null,
      notification_channels: JSON.stringify(formData.notification_channels)
    };

    if (editingRule) {
      const { error } = await supabase
        .from('webhook_alert_rules')
        .update(payload)
        .eq('id', editingRule.id);
      
      if (error) {
        toast.error('Failed to update alert rule');
        return;
      }
      toast.success('Alert rule updated');
    } else {
      const { error } = await supabase
        .from('webhook_alert_rules')
        .insert([payload]);
      
      if (error) {
        toast.error('Failed to create alert rule');
        return;
      }
      toast.success('Alert rule created');
    }

    setIsOpen(false);
    setEditingRule(null);
    resetForm();
    loadRules();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      webhook_type: '',
      endpoint_url: '',
      condition_type: 'failure_rate',
      threshold_value: 10,
      time_window_minutes: 60,
      notification_channels: ['email'],
      is_critical: false,
      is_enabled: true
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this alert rule?')) return;
    
    const { error } = await supabase
      .from('webhook_alert_rules')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete rule');
      return;
    }
    toast.success('Rule deleted');
    loadRules();
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('webhook_alert_rules')
      .update({ is_enabled: enabled })
      .eq('id', id);
    
    if (!error) {
      toast.success(enabled ? 'Rule enabled' : 'Rule disabled');
      loadRules();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alert Rules</h2>
          <p className="text-muted-foreground">Configure webhook failure alerts</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="w-4 h-4 mr-2" />New Rule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit' : 'Create'} Alert Rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Rule Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Condition Type</Label>
                  <Select value={formData.condition_type} onValueChange={v => setFormData({...formData, condition_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="failure_rate">Failure Rate (%)</SelectItem>
                      <SelectItem value="response_time">Avg Response Time (ms)</SelectItem>
                      <SelectItem value="consecutive_failures">Consecutive Failures</SelectItem>
                      <SelectItem value="total_failures">Total Failures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Threshold</Label>
                  <Input type="number" value={formData.threshold_value} onChange={e => setFormData({...formData, threshold_value: parseFloat(e.target.value)})} required />
                </div>
              </div>
              <div>
                <Label>Time Window (minutes)</Label>
                <Input type="number" value={formData.time_window_minutes} onChange={e => setFormData({...formData, time_window_minutes: parseInt(e.target.value)})} required />
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={formData.is_critical} onCheckedChange={v => setFormData({...formData, is_critical: v})} />
                <Label>Critical Alert</Label>
              </div>
              <Button type="submit" className="w-full">Save Rule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {rule.name}
                    {rule.is_critical && <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>}
                  </CardTitle>
                  <CardDescription>{rule.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Switch checked={rule.is_enabled} onCheckedChange={v => toggleEnabled(rule.id, v)} />
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="font-medium">Condition:</span> {rule.condition_type}</div>
                <div><span className="font-medium">Threshold:</span> {rule.threshold_value}</div>
                <div><span className="font-medium">Window:</span> {rule.time_window_minutes}m</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}