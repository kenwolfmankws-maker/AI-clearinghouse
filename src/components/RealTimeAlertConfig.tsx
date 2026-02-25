import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { APIAlertService, AlertRule, NotificationPreference } from '@/lib/apiAlertService';

export function RealTimeAlertConfig() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreference>({ browserEnabled: true });
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  useEffect(() => {
    setRules(APIAlertService.getAlertRules());
    setPrefs(APIAlertService.getNotificationPreferences());
  }, []);

  const saveRules = (newRules: AlertRule[]) => {
    setRules(newRules);
    APIAlertService.saveAlertRules(newRules);
  };

  const savePrefs = (newPrefs: NotificationPreference) => {
    setPrefs(newPrefs);
    APIAlertService.saveNotificationPreferences(newPrefs);
  };

  const handleEnableBrowser = async () => {
    await APIAlertService.requestBrowserPermission();
    savePrefs({ ...prefs, browserEnabled: true });
  };

  const deleteRule = (id: string) => {
    saveRules(rules.filter(r => r.id !== id));
  };

  const toggleRule = (id: string) => {
    saveRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Configure how you receive API usage alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">Show desktop notifications</p>
            </div>
            <Switch
              checked={prefs.browserEnabled}
              onCheckedChange={handleEnableBrowser}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={prefs.email || ''}
              onChange={(e) => savePrefs({ ...prefs, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slack">Slack Webhook URL</Label>
            <Input
              id="slack"
              placeholder="https://hooks.slack.com/services/..."
              value={prefs.slackWebhook || ''}
              onChange={(e) => savePrefs({ ...prefs, slackWebhook: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discord">Discord Webhook URL</Label>
            <Input
              id="discord"
              placeholder="https://discord.com/api/webhooks/..."
              value={prefs.discordWebhook || ''}
              onChange={(e) => savePrefs({ ...prefs, discordWebhook: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Rules
          </CardTitle>
          <CardDescription>Configure when to receive alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{rule.name}</h4>
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Threshold: {rule.threshold}{rule.type === 'rate_limit' ? '%' : rule.type === 'cost_spike' ? '% increase' : ' violations'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {rule.channels.map(ch => (
                      <Badge key={ch} variant="outline">{ch}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
