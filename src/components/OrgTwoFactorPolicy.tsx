import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorPolicy {
  id: string;
  organization_id: string;
  enforce_for_all_members: boolean;
  grace_period_days: number;
  allow_trusted_devices: boolean;
  trusted_device_duration_days: number;
  require_on_sensitive_actions: boolean;
}

export default function OrgTwoFactorPolicy() {
  const [policy, setPolicy] = useState<TwoFactorPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const organizationId = 'default-org'; // Replace with actual org ID from context

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const { data, error } = await supabase
        .from('org_two_factor_policies')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPolicy(data || createDefaultPolicy());
    } catch (error) {
      console.error('Error loading policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load 2FA policy',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPolicy = (): TwoFactorPolicy => ({
    id: '',
    organization_id: organizationId,
    enforce_for_all_members: false,
    grace_period_days: 7,
    allow_trusted_devices: true,
    trusted_device_duration_days: 30,
    require_on_sensitive_actions: true,
  });

  const savePolicy = async () => {
    if (!policy) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('org_two_factor_policies')
        .upsert({
          ...policy,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast({
        title: 'Success',
        description: '2FA policy updated successfully',
      });
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save 2FA policy',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Organization 2FA Policy
          </CardTitle>
          <CardDescription>
            Configure two-factor authentication requirements for all organization members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {policy?.enforce_for_all_members && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                2FA is currently enforced for all organization members
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enforce 2FA for All Members</Label>
                <p className="text-sm text-muted-foreground">
                  Require all organization members to enable 2FA
                </p>
              </div>
              <Switch
                checked={policy?.enforce_for_all_members || false}
                onCheckedChange={(checked) =>
                  setPolicy(prev => prev ? { ...prev, enforce_for_all_members: checked } : null)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grace-period">Grace Period (days)</Label>
              <Input
                id="grace-period"
                type="number"
                min="0"
                max="90"
                value={policy?.grace_period_days || 7}
                onChange={(e) =>
                  setPolicy(prev => prev ? { ...prev, grace_period_days: parseInt(e.target.value) } : null)
                }
              />
              <p className="text-sm text-muted-foreground">
                New users have this many days to enable 2FA
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Trusted Devices</Label>
                <p className="text-sm text-muted-foreground">
                  Let users mark devices as trusted to skip 2FA
                </p>
              </div>
              <Switch
                checked={policy?.allow_trusted_devices || false}
                onCheckedChange={(checked) =>
                  setPolicy(prev => prev ? { ...prev, allow_trusted_devices: checked } : null)
                }
              />
            </div>

            {policy?.allow_trusted_devices && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="device-duration">Trusted Device Duration (days)</Label>
                <Input
                  id="device-duration"
                  type="number"
                  min="1"
                  max="365"
                  value={policy?.trusted_device_duration_days || 30}
                  onChange={(e) =>
                    setPolicy(prev => prev ? { ...prev, trusted_device_duration_days: parseInt(e.target.value) } : null)
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require on Sensitive Actions</Label>
                <p className="text-sm text-muted-foreground">
                  Always require 2FA for sensitive operations
                </p>
              </div>
              <Switch
                checked={policy?.require_on_sensitive_actions || false}
                onCheckedChange={(checked) =>
                  setPolicy(prev => prev ? { ...prev, require_on_sensitive_actions: checked } : null)
                }
              />
            </div>
          </div>

          <Button onClick={savePolicy} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Policy'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}