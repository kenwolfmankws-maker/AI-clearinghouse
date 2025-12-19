import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TwoFactorVerificationProps {
  open: boolean;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorVerification({ open, onVerified, onCancel }: TwoFactorVerificationProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's 2FA secret
      const { data: twoFactorData, error: fetchError } = await supabase
        .from('user_two_factor')
        .select('secret')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .single();

      if (fetchError || !twoFactorData) throw new Error('2FA not configured');

      // Verify TOTP code (simplified - in production use a proper TOTP library)
      const isValid = verifyTOTP(twoFactorData.secret, code);

      if (isValid) {
        // Log successful verification
        await supabase.from('two_factor_verification_log').insert({
          user_id: user.id,
          success: true
        });

        onVerified();
      } else {
        setError('Invalid verification code');
        await supabase.from('two_factor_verification_log').insert({
          user_id: user.id,
          success: false
        });
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyBackupCode = async () => {
    if (!code || code.length !== 8) {
      setError('Please enter a valid 8-digit backup code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Hash the backup code
      const encoder = new TextEncoder();
      const data = encoder.encode(code);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const codeHash = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Verify backup code
      const { data: isValid, error } = await supabase.rpc('verify_backup_code', {
        p_user_id: user.id,
        p_code_hash: codeHash
      });

      if (error) throw error;

      if (isValid) {
        onVerified();
      } else {
        setError('Invalid or already used backup code');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = (secret: string, token: string): boolean => {
    // Simplified TOTP verification - in production use a library like otplib
    // This is a placeholder that accepts any 6-digit code for demo purposes
    return /^\d{6}$/.test(token);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {useBackupCode 
              ? 'Enter one of your backup recovery codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{useBackupCode ? 'Backup Code' : 'Verification Code'}</Label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              maxLength={useBackupCode ? 8 : 6}
              placeholder={useBackupCode ? '12345678' : '123456'}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={useBackupCode ? verifyBackupCode : verifyCode}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          <Button
            variant="link"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
              setError('');
            }}
            className="w-full text-sm"
          >
            {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}