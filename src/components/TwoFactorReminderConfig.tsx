import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Bell, Calendar, Clock, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ReminderConfig {
  id?: string;
  org_id: string;
  enabled: boolean;
  reminder_days: number[];
  reminder_frequency_hours: number;
}

interface TwoFactorReminderConfigProps {
  orgId: string;
}

export const TwoFactorReminderConfig: React.FC<TwoFactorReminderConfigProps> = ({ orgId }) => {
  const [config, setConfig] = useState<ReminderConfig>({
    org_id: orgId,
    enabled: true,
    reminder_days: [7, 3, 1],
    reminder_frequency_hours: 24
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [orgId]);

  const loadConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('two_factor_reminder_config')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (data) {
      setConfig(data);
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('two_factor_reminder_config')
      .upsert({
        ...config,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to save configuration');
    } else {
      toast.success('Reminder configuration saved');
    }
    setSaving(false);
  };

  const toggleReminderDay = (day: number) => {
    const days = config.reminder_days.includes(day)
      ? config.reminder_days.filter(d => d !== day)
      : [...config.reminder_days, day].sort((a, b) => b - a);
    setConfig({ ...config, reminder_days: days });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          2FA Reminder Configuration
        </CardTitle>
        <CardDescription>
          Configure automated reminders for users without 2FA enabled
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled">Enable Automated Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Send email reminders to users approaching grace period expiration
            </p>
          </div>
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
          />
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reminder Schedule (Days Before Expiration)
          </Label>
          <div className="flex gap-2 flex-wrap">
            {[7, 5, 3, 2, 1].map(day => (
              <Badge
                key={day}
                variant={config.reminder_days.includes(day) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleReminderDay(day)}
              >
                {day} day{day !== 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Selected: {config.reminder_days.sort((a, b) => b - a).join(', ')} days before expiration
          </p>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Minimum Hours Between Reminders
          </Label>
          <div className="flex gap-2">
            {[12, 24, 48, 72].map(hours => (
              <Badge
                key={hours}
                variant={config.reminder_frequency_hours === hours ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setConfig({ ...config, reminder_frequency_hours: hours })}
              >
                {hours}h
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={saveConfig} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
};
