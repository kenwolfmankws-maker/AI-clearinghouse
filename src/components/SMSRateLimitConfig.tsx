import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Shield, Save, AlertTriangle } from 'lucide-react';

export function SMSRateLimitConfig() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    max_messages_per_hour: 10,
    max_messages_per_day: 50,
    cooldown_minutes: 60,
    auto_block_enabled: true,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('sms_rate_limit_config')
      .select('*')
      .eq('org_id', user.id)
      .single();

    if (data) {
      setConfig(data);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('sms_rate_limit_config')
      .upsert({
        org_id: user.id,
        ...config,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Rate limit configuration saved' });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          SMS Rate Limiting Configuration
        </CardTitle>
        <CardDescription>
          Configure rate limits to prevent spam and control SMS costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hourly">Max Messages Per Hour</Label>
            <Input
              id="hourly"
              type="number"
              value={config.max_messages_per_hour}
              onChange={(e) => setConfig({ ...config, max_messages_per_hour: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="daily">Max Messages Per Day</Label>
            <Input
              id="daily"
              type="number"
              value={config.max_messages_per_day}
              onChange={(e) => setConfig({ ...config, max_messages_per_day: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cooldown">Cooldown Period (minutes)</Label>
          <Input
            id="cooldown"
            type="number"
            value={config.cooldown_minutes}
            onChange={(e) => setConfig({ ...config, cooldown_minutes: parseInt(e.target.value) })}
          />
          <p className="text-sm text-muted-foreground">
            Time to wait before allowing messages after limit exceeded
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label>Automatic Blocking</Label>
            <p className="text-sm text-muted-foreground">
              Automatically block recipients when limits are exceeded
            </p>
          </div>
          <Switch
            checked={config.auto_block_enabled}
            onCheckedChange={(checked) => setConfig({ ...config, auto_block_enabled: checked })}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Rate Limiting Best Practices</p>
            <ul className="mt-2 space-y-1 text-amber-800">
              <li>• Set hourly limits to prevent burst spam</li>
              <li>• Daily limits help control overall costs</li>
              <li>• Cooldown periods prevent immediate retries</li>
            </ul>
          </div>
        </div>

        <Button onClick={saveConfig} disabled={loading} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}
