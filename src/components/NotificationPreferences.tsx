import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from 'sonner';
import { Bell, FileCheck, CheckCircle, XCircle, AlertTriangle, UserPlus, Volume2, VolumeX, Mail } from 'lucide-react';

interface NotificationPref {
  event_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
}

interface DigestSettings {
  digest_enabled: boolean;
  digest_frequency: 'daily' | 'weekly';
  digest_time: string;
  digest_day_of_week: number;
}


const approvalEventTypes = [
  { type: 'approval_request', label: 'Approval Request', icon: FileCheck, description: 'When a template change request needs your approval' },
  { type: 'approval_granted', label: 'Approval Granted', icon: CheckCircle, description: 'When your change request is approved' },
  { type: 'approval_rejected', label: 'Approval Rejected', icon: XCircle, description: 'When your change request is rejected' },
  { type: 'approval_escalated', label: 'Request Escalated', icon: AlertTriangle, description: 'When a request is escalated to you' },
  { type: 'delegation_activated', label: 'Delegation Activated', icon: UserPlus, description: 'When you delegate approval authority' },
  { type: 'delegation_received', label: 'Delegation Received', icon: UserPlus, description: 'When someone delegates authority to you' },
];

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const { soundEnabled, setSoundEnabled } = useNotifications();
  const [preferences, setPreferences] = useState<Record<string, NotificationPref>>({});
  const [digestSettings, setDigestSettings] = useState<DigestSettings>({
    digest_enabled: false,
    digest_frequency: 'daily',
    digest_time: '09:00:00',
    digest_day_of_week: 1
  });
  const [loading, setLoading] = useState(true);

  const toggleSound = () => setSoundEnabled(!soundEnabled);

  useEffect(() => {
    if (user) loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    const { data } = await supabase
      .from('notification_preferences')
      .select('event_type, in_app_enabled, email_enabled, digest_enabled, digest_frequency, digest_time, digest_day_of_week')
      .eq('user_id', user?.id);

    const prefs: Record<string, NotificationPref> = {};
    approvalEventTypes.forEach(et => prefs[et.type] = { event_type: et.type, in_app_enabled: true, email_enabled: true });
    
    if (data && data.length > 0) {
      data.forEach((pref: any) => {
        if (pref.event_type) {
          prefs[pref.event_type] = pref;
        }
        // Load digest settings from first row (user-level settings)
        if (pref.digest_enabled !== undefined) {
          setDigestSettings({
            digest_enabled: pref.digest_enabled || false,
            digest_frequency: pref.digest_frequency || 'daily',
            digest_time: pref.digest_time || '09:00:00',
            digest_day_of_week: pref.digest_day_of_week || 1
          });
        }
      });
    }
    
    setPreferences(prefs);
    setLoading(false);
  };


  const togglePreference = async (eventType: string, field: 'in_app_enabled' | 'email_enabled', enabled: boolean) => {
    const currentPref = preferences[eventType] || { event_type: eventType, in_app_enabled: true, email_enabled: true };
    const updatedPref = { ...currentPref, [field]: enabled };
    setPreferences(prev => ({ ...prev, [eventType]: updatedPref }));

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user?.id,
        event_type: eventType,
        in_app_enabled: updatedPref.in_app_enabled,
        email_enabled: updatedPref.email_enabled,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,event_type' });

    if (error) {
      toast.error('Failed to update preference');
      setPreferences(prev => ({ ...prev, [eventType]: currentPref }));
    } else {
      toast.success('Notification preference updated');
    }
  };

  const updateDigestSettings = async (field: keyof DigestSettings, value: any) => {
    const updated = { ...digestSettings, [field]: value };
    setDigestSettings(updated);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user?.id,
        event_type: 'digest_settings',
        digest_enabled: updated.digest_enabled,
        digest_frequency: updated.digest_frequency,
        digest_time: updated.digest_time,
        digest_day_of_week: updated.digest_day_of_week,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,event_type' });

    if (error) {
      toast.error('Failed to update digest settings');
      setDigestSettings(digestSettings);
    } else {
      toast.success('Digest settings updated');
    }
  };

  const sendTestNotification = () => {
    toast.success('Test notification sent!', {
      description: 'This is how your notifications will appear',
      action: { label: 'View', onClick: () => {} }
    });
  };



  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive approval workflow notifications</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleSound}>
                {soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </Button>
              <Button variant="outline" size="sm" onClick={sendTestNotification}>
                <Bell className="w-4 h-4 mr-2" />
                Test Notification
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 pb-2 border-b font-medium text-sm">
            <div>Event Type</div>
            <div className="text-center">In-App</div>
            <div className="text-center">Email</div>
          </div>
          {approvalEventTypes.map(({ type, label, icon: Icon, description }) => {
            const pref = preferences[type] || { in_app_enabled: true, email_enabled: true };
            return (
              <div key={type} className="grid grid-cols-3 gap-4 items-center p-4 rounded-lg border">
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <Label className="text-base">{label}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={pref.in_app_enabled}
                    onCheckedChange={(checked) => togglePreference(type, 'in_app_enabled', checked)}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={pref.email_enabled}
                    onCheckedChange={(checked) => togglePreference(type, 'email_enabled', checked)}
                    disabled={digestSettings.digest_enabled}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <div>
              <CardTitle>Email Digest Mode</CardTitle>
              <CardDescription>Receive a summary email instead of individual notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base">Enable Digest Mode</Label>
              <p className="text-sm text-muted-foreground">Get one summary email instead of individual emails</p>
            </div>
            <Switch
              checked={digestSettings.digest_enabled}
              onCheckedChange={(checked) => updateDigestSettings('digest_enabled', checked)}
            />
          </div>

          {digestSettings.digest_enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={digestSettings.digest_frequency}
                    onValueChange={(value) => updateDigestSettings('digest_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Delivery Time</Label>
                  <Select
                    value={digestSettings.digest_time.slice(0, 5)}
                    onValueChange={(value) => updateDigestSettings('digest_time', value + ':00')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {digestSettings.digest_frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select
                    value={digestSettings.digest_day_of_week.toString()}
                    onValueChange={(value) => updateDigestSettings('digest_day_of_week', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  When digest mode is enabled, you'll receive a single {digestSettings.digest_frequency} email 
                  at {digestSettings.digest_time.slice(0, 5)}
                  {digestSettings.digest_frequency === 'weekly' && 
                    ` on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][digestSettings.digest_day_of_week]}`
                  } with all your unread notifications.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
