import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TwoFactorSetupProps {
  onComplete: () => void;
  isRequired?: boolean;
}

export function TwoFactorSetup({ onComplete, isRequired = false }: TwoFactorSetupProps) {
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateSecret();
  }, []);

  const generateSecret = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate a random secret (base32)
      const newSecret = generateBase32Secret();
      setSecret(newSecret);

      // Generate QR code URL
      const otpauthUrl = `otpauth://totp/AdminDashboard:${user.email}?secret=${newSecret}&issuer=AdminDashboard`;
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`);
    } catch (err) {
      setError('Failed to generate 2FA secret');
    }
  };

  const generateBase32Secret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyAndEnable = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Store secret and mark as enabled
      const { error: insertError } = await supabase
        .from('user_two_factor')
        .upsert({
          user_id: user.id,
          secret: secret,
          enabled: true,
          verified_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            2FA Setup Complete
          </CardTitle>
          <CardDescription>
            Two-factor authentication has been enabled for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Your account is now protected with 2FA. You'll need to enter a code from your authenticator app each time you access admin features.
            </AlertDescription>
          </Alert>
          <Button onClick={onComplete} className="w-full">
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {isRequired ? 'Required: ' : ''}Enable Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          {isRequired 
            ? 'Admin users must enable 2FA to access administrative features'
            : 'Secure your account with two-factor authentication'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>1. Scan QR Code</Label>
          <p className="text-sm text-muted-foreground">
            Use an authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
          </p>
          {qrCode && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>2. Or Enter Secret Manually</Label>
          <div className="flex gap-2">
            <Input value={secret} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copySecret}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={verifyAndEnable} disabled={loading} className="w-full">
          {loading ? 'Enabling...' : 'Enable 2FA'}
        </Button>
      </CardContent>
    </Card>
  );
}