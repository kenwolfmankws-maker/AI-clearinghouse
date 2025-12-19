import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Trash2, TestTube, Plus, CheckCircle, XCircle } from 'lucide-react';

interface SlackConfig {
  id: string;
  name: string;
  webhook_url: string;
  default_channel: string;
  is_active: boolean;
  created_at: string;
}

interface ChannelMapping {
  id: string;
  slack_config_id: string;
  alert_severity: string;
  channel_name: string;
}

export function SlackConfigurationManager() {
  const [configs, setConfigs] = useState<SlackConfig[]>([]);
  const [mappings, setMappings] = useState<ChannelMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    webhook_url: '',
    default_channel: '#alerts',
  });

  const [mappingForm, setMappingForm] = useState({
    slack_config_id: '',
    alert_severity: 'medium',
    channel_name: '',
  });

  useEffect(() => {
    loadConfigs();
    loadMappings();
  }, []);

  const loadConfigs = async () => {
    const { data, error } = await supabase
      .from('slack_configurations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load Slack configurations');
      return;
    }

    setConfigs(data || []);
    setLoading(false);
  };

  const loadMappings = async () => {
    const { data } = await supabase
      .from('slack_channel_mappings')
      .select('*');

    setMappings(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('slack_configurations')
      .insert([formData]);

    if (error) {
      toast.error('Failed to create Slack configuration');
      return;
    }

    toast.success('Slack configuration created');
    setFormData({ name: '', webhook_url: '', default_channel: '#alerts' });
    setShowForm(false);
    loadConfigs();
  };

  const testSlackWebhook = async (config: SlackConfig) => {
    setTestingConfig(config.id);

    try {
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: config.default_channel,
          text: '🧪 Test notification from Webhook Alert System',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Test Notification*\nThis is a test message to verify your Slack integration is working correctly.'
              }
            }
          ]
        })
      });

      if (response.ok) {
        toast.success('Test message sent to Slack!');
      } else {
        toast.error('Failed to send test message');
      }
    } catch (error) {
      toast.error('Error sending test message');
    } finally {
      setTestingConfig(null);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('slack_configurations')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update configuration');
      return;
    }

    toast.success(`Configuration ${!isActive ? 'enabled' : 'disabled'}`);
    loadConfigs();
  };

  const deleteConfig = async (id: string) => {
    const { error } = await supabase
      .from('slack_configurations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete configuration');
      return;
    }

    toast.success('Configuration deleted');
    loadConfigs();
  };

  const addMapping = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('slack_channel_mappings')
      .insert([mappingForm]);

    if (error) {
      toast.error('Failed to add channel mapping');
      return;
    }

    toast.success('Channel mapping added');
    setMappingForm({ slack_config_id: '', alert_severity: 'medium', channel_name: '' });
    loadMappings();
  };

  const deleteMapping = async (id: string) => {
    const { error } = await supabase
      .from('slack_channel_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete mapping');
      return;
    }

    toast.success('Mapping deleted');
    loadMappings();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Slack Integration</h2>
          <p className="text-muted-foreground">Configure Slack notifications for webhook alerts</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Configuration
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Slack Configuration</CardTitle>
            <CardDescription>Add a Slack webhook URL for alert notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Configuration Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Production Alerts"
                  required
                />
              </div>
              <div>
                <Label>Slack Webhook URL</Label>
                <Input
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                  required
                />
              </div>
              <div>
                <Label>Default Channel</Label>
                <Input
                  value={formData.default_channel}
                  onChange={(e) => setFormData({ ...formData, default_channel: e.target.value })}
                  placeholder="#alerts"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Configuration</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {config.name}
                    {config.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Channel: {config.default_channel}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testSlackWebhook(config)}
                    disabled={testingConfig === config.id}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingConfig === config.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={() => toggleActive(config.id, config.is_active)}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteConfig(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Channel Mappings</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {['low', 'medium', 'high', 'critical'].map((severity) => {
                      const mapping = mappings.find(
                        (m) => m.slack_config_id === config.id && m.alert_severity === severity
                      );
                      return (
                        <div key={severity} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm capitalize">{severity}</span>
                          {mapping ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{mapping.channel_name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMapping(mapping.id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Default</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={addMapping} className="flex gap-2">
                  <Select
                    value={mappingForm.slack_config_id === config.id ? mappingForm.alert_severity : ''}
                    onValueChange={(value) =>
                      setMappingForm({ ...mappingForm, slack_config_id: config.id, alert_severity: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Channel (e.g., #critical-alerts)"
                    value={mappingForm.slack_config_id === config.id ? mappingForm.channel_name : ''}
                    onChange={(e) =>
                      setMappingForm({ ...mappingForm, slack_config_id: config.id, channel_name: e.target.value })
                    }
                  />
                  <Button type="submit" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}