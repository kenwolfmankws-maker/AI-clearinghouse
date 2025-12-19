import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Plus, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailConfig {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
}

interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  severity_levels: string[];
  is_active: boolean;
}

export default function EmailConfigurationManager() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: 'Webhook Alerts',
    use_tls: true,
    is_active: true
  });

  const [newRecipient, setNewRecipient] = useState({
    email: '',
    name: '',
    severity_levels: ['critical', 'high', 'medium', 'low']
  });

  useEffect(() => {
    loadConfig();
    loadRecipients();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('email_configurations')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setConfig(data);
        setFormData(data);
      }
    } catch (error: any) {
      console.error('Error loading email config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const { data, error } = await supabase
        .from('email_alert_recipients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error: any) {
      console.error('Error loading recipients:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const configData = { ...formData, organization_id: user.id };

      if (config) {
        const { error } = await supabase
          .from('email_configurations')
          .update(configData)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_configurations')
          .insert([configData]);
        if (error) throw error;
      }

      toast({ title: 'Email configuration saved successfully' });
      loadConfig();
    } catch (error: any) {
      toast({ title: 'Error saving configuration', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const testEmail = async () => {
    setTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user email found');

      toast({ title: 'Test email sent!', description: `Check ${user.email}` });
    } catch (error: any) {
      toast({ title: 'Error sending test email', description: error.message, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const addRecipient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('email_alert_recipients')
        .insert([{ ...newRecipient, organization_id: user.id }]);

      if (error) throw error;

      toast({ title: 'Recipient added successfully' });
      setNewRecipient({ email: '', name: '', severity_levels: ['critical', 'high', 'medium', 'low'] });
      loadRecipients();
    } catch (error: any) {
      toast({ title: 'Error adding recipient', description: error.message, variant: 'destructive' });
    }
  };

  const deleteRecipient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_alert_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Recipient removed' });
      loadRecipients();
    } catch (error: any) {
      toast({ title: 'Error removing recipient', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="smtp">
        <TabsList>
          <TabsTrigger value="smtp">SMTP Configuration</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP Settings
              </CardTitle>
              <CardDescription>Configure your email server for webhook alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SMTP Host</Label>
                  <Input value={formData.smtp_host} onChange={(e) => setFormData({...formData, smtp_host: e.target.value})} placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input type="number" value={formData.smtp_port} onChange={(e) => setFormData({...formData, smtp_port: parseInt(e.target.value)})} />
                </div>
              </div>

              <div>
                <Label>Username</Label>
                <Input value={formData.smtp_user} onChange={(e) => setFormData({...formData, smtp_user: e.target.value})} />
              </div>

              <div>
                <Label>Password</Label>
                <Input type="password" value={formData.smtp_password} onChange={(e) => setFormData({...formData, smtp_password: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Email</Label>
                  <Input value={formData.from_email} onChange={(e) => setFormData({...formData, from_email: e.target.value})} />
                </div>
                <div>
                  <Label>From Name</Label>
                  <Input value={formData.from_name} onChange={(e) => setFormData({...formData, from_name: e.target.value})} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={formData.use_tls} onCheckedChange={(checked) => setFormData({...formData, use_tls: checked})} />
                <Label>Use TLS</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveConfig} disabled={saving}>Save Configuration</Button>
                <Button onClick={testEmail} disabled={testing} variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle>Alert Recipients</CardTitle>
              <CardDescription>Manage who receives email alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Email" value={newRecipient.email} onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})} />
                <Input placeholder="Name" value={newRecipient.name} onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})} />
                <Button onClick={addRecipient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </div>

              <div className="space-y-2">
                {recipients.map(recipient => (
                  <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{recipient.name || recipient.email}</div>
                      <div className="text-sm text-muted-foreground">{recipient.email}</div>
                      <div className="flex gap-1 mt-1">
                        {recipient.severity_levels.map(level => (
                          <Badge key={level} variant="outline">{level}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {recipient.is_active ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      <Button variant="ghost" size="sm" onClick={() => deleteRecipient(recipient.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}