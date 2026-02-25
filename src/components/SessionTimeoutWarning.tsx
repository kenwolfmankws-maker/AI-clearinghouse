import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const checkSessionTimeout = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const expiresAt = new Date(session.expires_at || 0).getTime();
        const now = Date.now();
        const remaining = expiresAt - now;

        // Show warning 5 minutes before expiration
        if (remaining > 0 && remaining < 5 * 60 * 1000) {
          setTimeRemaining(Math.floor(remaining / 1000));
          setShowWarning(true);
        }
      } catch (error) {
        console.error('Error checking session timeout:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkSessionTimeout, 60000);
    checkSessionTimeout();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeRemaining > 0 && showWarning) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setShowWarning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showWarning]);

  const extendSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setShowWarning(false);
    } catch (error) {
      console.error('Error extending session:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in {formatTime(timeRemaining)}. Would you like to extend your session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={extendSession}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
