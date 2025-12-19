import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SMSConfig {
  id: string;
  from_phone_number: string;
  enabled: boolean;
}

interface SMSRecipient {
  id: string;
  phone_number: string;
  name: string;
  alert_types: string[];
  enabled: boolean;
}

export default function SMSConfigurationManager() {
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [recipients, setRecipients] = useState<SMSRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const [fromPhone, setFromPhone] = useState('');
  const [enabled, setEnabled] = useState(true);
  
  const [newRecipient, setNewRecipient] = useState({
    phone_number: '',
    name: '',
    alert_types: ['critical', 'high'] as string[]
  });

  useEffect(() => {
    loadConfiguration();
    loadRecipients();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sms_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfig(data);
        setFromPhone(data.from_phone_number);
        setEnabled(data.enabled);
      }
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

  const loadRecipients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sms_alert_recipients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading recipients',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const configData = {
        user_id: user.id,
        from_phone_number: fromPhone,
        enabled
      };

      if (config) {
        const { error } = await supabase
          .from('sms_configurations')
          .update(configData)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sms_configurations')
          .insert([configData]);
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'SMS configuration saved successfully'
      });
      
      loadConfiguration();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addRecipient = async () => {
    if (!newRecipient.phone_number) {
      toast({
        title: 'Error',
        description: 'Phone number is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('sms_alert_recipients')
        .insert([{
          user_id: user.id,
          ...newRecipient,
          enabled: true
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Recipient added successfully'
      });

      setNewRecipient({
        phone_number: '',
        name: '',
        alert_types: ['critical', 'high']
      });

      loadRecipients();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deleteRecipient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sms_alert_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Recipient removed'
      });

      loadRecipients();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const toggleRecipient = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('sms_alert_recipients')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
      loadRecipients();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const sendTestSMS = async () => {
    setTesting(true);
    try {
      toast({
        title: 'Test SMS',
        description: 'Test SMS functionality would be triggered via edge function'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Twilio SMS Configuration</CardTitle>
          <CardDescription>
            Configure Twilio settings for SMS alerts. Account SID and Auth Token are managed via environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from-phone">From Phone Number</Label>
            <Input
              id="from-phone"
              placeholder="+1234567890"
              value={fromPhone}
              onChange={(e) => setFromPhone(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your Twilio phone number (E.164 format)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Turn SMS alerts on or off
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex gap-2">
            <Button onClick={saveConfiguration} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            <Button variant="outline" onClick={sendTestSMS} disabled={testing}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Test SMS
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS Recipients</CardTitle>
          <CardDescription>
            Manage phone numbers that receive webhook alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipient-phone">Phone Number</Label>
              <Input
                id="recipient-phone"
                placeholder="+1234567890"
                value={newRecipient.phone_number}
                onChange={(e) => setNewRecipient({ ...newRecipient, phone_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient-name">Name (Optional)</Label>
              <Input
                id="recipient-name"
                placeholder="John Doe"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={addRecipient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Recipient
          </Button>

          <div className="space-y-2">
            {recipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{recipient.name || recipient.phone_number}</div>
                  {recipient.name && (
                    <div className="text-sm text-muted-foreground">{recipient.phone_number}</div>
                  )}
                  <div className="flex gap-1 mt-1">
                    {recipient.alert_types.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={recipient.enabled}
                    onCheckedChange={(checked) => toggleRecipient(recipient.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRecipient(recipient.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {recipients.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No recipients configured
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
