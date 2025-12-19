import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Key, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BackupCodesModal } from './BackupCodesModal';

export function TwoFactorManagement() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesCount, setBackupCodesCount] = useState(0);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_two_factor')
        .select('enabled')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setEnabled(data.enabled);
      }

      // Count unused backup codes
      const { count } = await supabase
        .from('two_factor_backup_codes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('used', false);

      setBackupCodesCount(count || 0);
    } catch (err) {
      console.error('Failed to check 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_two_factor')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setEnabled(false);
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Manage your two-factor authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {enabled ? (
            <>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is currently <strong>enabled</strong> for your account.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Backup Codes</p>
                    <p className="text-sm text-muted-foreground">
                      {backupCodesCount} unused codes remaining
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowBackupCodes(true)}>
                  Regenerate
                </Button>
              </div>

              <Button variant="destructive" onClick={disable2FA} className="w-full">
                Disable 2FA
              </Button>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is currently <strong>disabled</strong>. Enable it to secure your account.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <BackupCodesModal
        open={showBackupCodes}
        onOpenChange={setShowBackupCodes}
      />
    </>
  );
}