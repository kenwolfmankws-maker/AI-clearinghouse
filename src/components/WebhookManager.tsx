import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import WebhookSecretKey from './WebhookSecretKey';
import { IPAllowlistManager } from './IPAllowlistManager';
import { RateLimitStatus } from './RateLimitStatus';
import { RateLimitConfigurator, RateLimit } from './RateLimitConfigurator';
import { WebhookHealthDashboard } from './WebhookHealthDashboard';
import { WebhookDeliveryTable } from './WebhookDeliveryTable';
import WebhookAnalyticsDashboard from './WebhookAnalyticsDashboard';
import ScheduledWebhookReports from './ScheduledWebhookReports';
import { WebhookAlertRuleManager } from './WebhookAlertRuleManager';
import { WebhookAlertHistory } from './WebhookAlertHistory';
import { SlackConfigurationManager } from './SlackConfigurationManager';
import EmailConfigurationManager from './EmailConfigurationManager';
import SMSConfigurationManager from './SMSConfigurationManager';
import SMSAnalyticsDashboard from './SMSAnalyticsDashboard';
import SMSCostBudgetManager from './SMSCostBudgetManager';
import SMSCostProjectionDashboard from './SMSCostProjectionDashboard';
import { SMSRateLimitConfig } from './SMSRateLimitConfig';
import { SMSRateLimitStatus } from './SMSRateLimitStatus';
import { SMSPricingTierManager } from './SMSPricingTierManager';
import { SMSCostAnalysisChart } from './SMSCostAnalysisChart';










import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, Plus, Send, CheckCircle, XCircle, Clock, Activity, TrendingUp, AlertCircle, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';


interface Webhook {
  id: string;
  name: string;
  url: string;
  service_type: string;
  enabled: boolean;
  events: string[];
  retry_enabled: boolean;
  max_retries: number;
  secret_key?: string;
  allowed_ips?: string[];
  rate_limits?: RateLimit[];
}





interface Delivery {
  id: string;
  event_type: string;
  status: string;
  response_status: number;
  retry_count: number;
  created_at: string;
  last_attempt_at: string;
  response_body: string;
  delivery_time_ms: number;
}

interface HealthMetrics {
  totalDeliveries: number;
  successRate: number;
  avgDeliveryTime: number;
  retryRate: number;
  failureRate: number;
  last24h: {
    total: number;
    success: number;
    failed: number;
  };
}

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    service_type: 'custom',
    events: [] as string[],
    retry_enabled: true,
    max_retries: 3,
    rate_limit_enabled: false,
    rate_limit_max_requests: 100,
    rate_limit_window_minutes: 60
  });


  const eventTypes = [
    { value: 'test_complete', label: 'Test Completed' },
    { value: 'alert_triggered', label: 'Alert Triggered' },
    { value: 'test_started', label: 'Test Started' },
    { value: 'variant_winner', label: 'Variant Winner Detected' }
  ];

  useEffect(() => {
    loadWebhooks();
    loadDeliveries();
    loadAllDeliveries();
  }, []);

  const loadWebhooks = async () => {
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setWebhooks(data);
  };

  const loadDeliveries = async () => {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) setDeliveries(data);
  };

  const loadAllDeliveries = async () => {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setAllDeliveries(data);
  };

  const calculateHealthMetrics = (): HealthMetrics => {
    const total = allDeliveries.length;
    const successful = allDeliveries.filter(d => d.status === 'success').length;
    const failed = allDeliveries.filter(d => d.status === 'failed').length;
    const retried = allDeliveries.filter(d => d.retry_count > 0).length;
    
    const deliveriesWithTime = allDeliveries.filter(d => d.delivery_time_ms > 0);
    const avgTime = deliveriesWithTime.length > 0
      ? deliveriesWithTime.reduce((sum, d) => sum + d.delivery_time_ms, 0) / deliveriesWithTime.length
      : 0;

    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    const recent = allDeliveries.filter(d => new Date(d.created_at) > last24h);

    return {
      totalDeliveries: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDeliveryTime: avgTime,
      retryRate: total > 0 ? (retried / total) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
      last24h: {
        total: recent.length,
        success: recent.filter(d => d.status === 'success').length,
        failed: recent.filter(d => d.status === 'failed').length
      }
    };
  };

  const metrics = calculateHealthMetrics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('webhook_configs').insert([{
      ...formData,
      user_id: (await supabase.auth.getUser()).data.user?.id
    }]);

    if (error) {
      toast.error('Failed to create webhook');
    } else {
      toast.success('Webhook created successfully');
      setShowForm(false);
      setFormData({ name: '', url: '', service_type: 'custom', events: [], retry_enabled: true, max_retries: 3 });
      loadWebhooks();
    }
    setLoading(false);
  };

  const toggleWebhook = async (id: string, enabled: boolean) => {
    await supabase.from('webhook_configs').update({ enabled }).eq('id', id);
    loadWebhooks();
    toast.success(`Webhook ${enabled ? 'enabled' : 'disabled'}`);
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from('webhook_configs').delete().eq('id', id);
    loadWebhooks();
    toast.success('Webhook deleted');
  };

  const testWebhook = async (webhook: Webhook) => {
    setLoading(true);
    const { error } = await supabase.functions.invoke('send-webhook', {
      body: { webhookId: webhook.id, test: true }
    });
    
    if (error) {
      toast.error('Test failed: ' + error.message);
    } else {
      toast.success('Test webhook sent!');
      setTimeout(loadDeliveries, 1000);
    }
    setLoading(false);
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Webhook Integration</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Slack Webhook"
                  required
                />
              </div>
              <div>
                <Label>Service Type</Label>
                <Select value={formData.service_type} onValueChange={(v) => setFormData({ ...formData, service_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Webhook URL</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://hooks.slack.com/..."
                  required
                />
              </div>
              <div>
                <Label>Events to Trigger</Label>
                <div className="space-y-2 mt-2">
                  {eventTypes.map(event => (
                    <label key={event.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="rounded"
                      />
                      <span>{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.retry_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, retry_enabled: checked })}
                />
                <Label>Enable Retry Logic</Label>
              </div>
              {formData.retry_enabled && (
                <div>
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    value={formData.max_retries}
                    onChange={(e) => setFormData({ ...formData, max_retries: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.rate_limit_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, rate_limit_enabled: checked })}
                />
                <Label>Enable Rate Limiting</Label>
              </div>
              {formData.rate_limit_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Requests</Label>
                    <Input
                      type="number"
                      value={formData.rate_limit_max_requests}
                      onChange={(e) => setFormData({ ...formData, rate_limit_max_requests: parseInt(e.target.value) })}
                      min="1"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label>Window (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.rate_limit_window_minutes}
                      onChange={(e) => setFormData({ ...formData, rate_limit_window_minutes: parseInt(e.target.value) })}
                      min="1"
                      placeholder="60"
                    />
                  </div>
                </div>
              )}
              <Button type="submit" disabled={loading}>
                Create Webhook
              </Button>

            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="health">Health Metrics</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery History</TabsTrigger>
          <TabsTrigger value="retry-queue">Retry Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="alerts">Alert Rules</TabsTrigger>
          <TabsTrigger value="alert-history">Alert History</TabsTrigger>
          <TabsTrigger value="email">Email Notifications</TabsTrigger>
          <TabsTrigger value="sms">SMS Notifications</TabsTrigger>
          <TabsTrigger value="sms-analytics">SMS Analytics</TabsTrigger>
          <TabsTrigger value="sms-projections">Cost Projections</TabsTrigger>
          <TabsTrigger value="sms-rate-limits">SMS Rate Limits</TabsTrigger>
          <TabsTrigger value="sms-rate-status">Rate Limit Status</TabsTrigger>
          <TabsTrigger value="sms-pricing">SMS Pricing Tiers</TabsTrigger>
          <TabsTrigger value="sms-cost-analysis">Cost Analysis</TabsTrigger>


        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">

          {webhooks.map(webhook => (
            <Card key={webhook.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{webhook.name}</h3>
                      <Badge variant={webhook.service_type === 'custom' ? 'secondary' : 'default'}>
                        {webhook.service_type}
                      </Badge>
                      <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                        {webhook.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{webhook.url}</p>
                    <div className="flex gap-2">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="outline">{event}</Badge>
                      ))}
                    </div>
                    {webhook.secret_key && (
                      <div className="mt-3">
                        <WebhookSecretKey
                          webhookId={webhook.id}
                          secretKey={webhook.secret_key}
                          onRegenerate={loadWebhooks}
                        />
                      </div>
                    )}
                    <div className="mt-3 border-t pt-3">
                      <IPAllowlistManager
                        allowedIPs={webhook.allowed_ips || []}
                        onChange={async (ips) => {
                          await supabase
                            .from('webhook_configs')
                            .update({ allowed_ips: ips })
                            .eq('id', webhook.id);
                          loadWebhooks();
                          toast.success('IP allowlist updated');
                        }}
                      />
                     </div>
                    <div className="mt-3 border-t pt-3">
                      <RateLimitConfigurator
                        rateLimits={webhook.rate_limits || []}
                        onChange={async (limits) => {
                          await supabase
                            .from('webhook_configs')
                            .update({ rate_limits: limits })
                            .eq('id', webhook.id);
                          loadWebhooks();
                          toast.success('Rate limits updated');
                        }}
                      />
                    </div>
                    <div className="mt-3 border-t pt-3">
                      <RateLimitStatus
                        webhookId={webhook.id}
                        rateLimits={webhook.rate_limits || []}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => testWebhook(webhook)}>
                      <Send className="w-4 h-4" />
                    </Button>
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                    />
                    <Button size="sm" variant="destructive" onClick={() => deleteWebhook(webhook.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {allDeliveries.filter(d => d.status === 'success').length} of {metrics.totalDeliveries} deliveries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgDeliveryTime.toFixed(0)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retry Rate</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.retryRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Deliveries requiring retry
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.failureRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {allDeliveries.filter(d => d.status === 'failed').length} failed deliveries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.last24h.total}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.last24h.success} success, {metrics.last24h.failed} failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                <Send className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalDeliveries}</div>
                <p className="text-xs text-muted-foreground">
                  All time webhook deliveries
                </p>
              </CardContent>
            </Card>
          </div>

          {metrics.failureRate > 20 && (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-5 w-5" />
                  High Failure Rate Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your webhook failure rate is above 20%. Consider checking your webhook URLs and configurations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          {deliveries.map(delivery => (
            <Card key={delivery.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge>{delivery.event_type}</Badge>
                      {delivery.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {delivery.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                      {delivery.status === 'retrying' && <Clock className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(delivery.created_at).toLocaleString()}
                    </p>
                    {delivery.error_message && (
                      <p className="text-sm text-red-500">{delivery.error_message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Attempts: {delivery.attempt_count}</p>
                    {delivery.response_code && (
                      <Badge variant={delivery.response_code < 300 ? 'default' : 'destructive'}>
                        {delivery.response_code}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="retry-queue" className="space-y-4">
          <WebhookHealthDashboard />
          <Card>
            <CardHeader>
              <CardTitle>Failed Webhook Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <WebhookDeliveryTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <WebhookAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="reports">
          <ScheduledWebhookReports />
        </TabsContent>

        <TabsContent value="alerts">
          <WebhookAlertRuleManager />
        </TabsContent>

        <TabsContent value="alert-history">
          <WebhookAlertHistory />
        </TabsContent>

        <TabsContent value="slack">
          <SlackConfigurationManager />
        </TabsContent>

        <TabsContent value="email">
          <EmailConfigurationManager />
        </TabsContent>

        <TabsContent value="sms">
          <SMSConfigurationManager />
        </TabsContent>

        <TabsContent value="sms-analytics">
          <SMSAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="sms-budgets">
          <SMSCostBudgetManager />
        </TabsContent>

        <TabsContent value="sms-projections">
          <SMSCostProjectionDashboard />
        </TabsContent>

        <TabsContent value="sms-rate-limits">
          <SMSRateLimitConfig />
        </TabsContent>

        <TabsContent value="sms-rate-status">
          <SMSRateLimitStatus />
        </TabsContent>

        <TabsContent value="sms-pricing">
          <SMSPricingTierManager />
        </TabsContent>

        <TabsContent value="sms-cost-analysis">
          <SMSCostAnalysisChart />
        </TabsContent>


      </Tabs>


    </div>
  );
}
