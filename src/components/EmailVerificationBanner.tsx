import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationBannerProps {
  isVerified: boolean;
  userEmail: string;
}

export function EmailVerificationBanner({ isVerified, userEmail }: EmailVerificationBannerProps) {
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (cooldown > 0) return;

    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) throw error;

      toast({
        title: 'Verification email sent',
        description: `Check your inbox at ${userEmail}`,
      });

      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send verification email',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (isVerified) {
    return null;
  }

  return (
    <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="flex items-center justify-between text-yellow-800 dark:text-yellow-200">
        <span>Please verify your email address to access all features</span>
        <Button
          onClick={handleResendVerification}
          disabled={sending || cooldown > 0}
          variant="outline"
          size="sm"
          className="ml-4"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Email'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
