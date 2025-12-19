import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2, AlertCircle, Clock, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (remainingTime <= 0) return;
    
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [remainingTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('request-password-reset', {
        body: { email, captchaToken: null }
      });

      if (fnError) throw fnError;

      if (data.error) {
        if (data.rateLimited || data.blocked) {
          setError(data.error);
          if (data.remainingSeconds) {
            setRemainingTime(data.remainingSeconds);
          }
          if (data.blocked) {
            setIsBlocked(true);
          }
        } else if (data.requiresCaptcha) {
          setRequiresCaptcha(true);
          setAttemptsCount(data.attemptsCount);
          setError('Too many attempts. CAPTCHA verification required.');
        } else {
          setError(data.error);
        }
        
        toast({
          title: 'Request Failed',
          description: data.error,
          variant: 'destructive'
        });
      } else {
        setSent(true);
        setAttemptsCount(data.attemptsRemaining || 0);
        toast({
          title: 'Email sent!',
          description: 'Check your inbox for password reset instructions.',
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    setError('');
    setRemainingTime(0);
    setRequiresCaptcha(false);
    setIsBlocked(false);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOnCooldown = remainingTime > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {sent 
              ? 'Check your email for reset instructions.'
              : 'Enter your email to receive a password reset link.'}
          </DialogDescription>
        </DialogHeader>
        
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant={isBlocked ? "destructive" : "default"} className={isBlocked ? "" : "bg-amber-500/10 border-amber-500/50"}>
                <AlertCircle className={`h-4 w-4 ${isBlocked ? '' : 'text-amber-500'}`} />
                <AlertDescription className={isBlocked ? '' : 'text-amber-200'}>{error}</AlertDescription>
              </Alert>
            )}
            
            {isOnCooldown && !isBlocked && (
              <Alert className="bg-blue-500/10 border-blue-500/50">
                <Clock className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  Please wait <span className="font-mono font-bold">{formatTime(remainingTime)}</span> before trying again
                </AlertDescription>
              </Alert>
            )}

            {requiresCaptcha && (
              <Alert className="bg-purple-500/10 border-purple-500/50">
                <Shield className="h-4 w-4 text-purple-400" />
                <AlertDescription className="text-purple-200">
                  CAPTCHA verification required after {attemptsCount} attempts
                </AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="reset-email" className="text-slate-300">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="bg-slate-800 border-slate-700 text-white"
                disabled={isOnCooldown || isBlocked}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading || isOnCooldown || isBlocked} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : isOnCooldown ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Wait {formatTime(remainingTime)}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-slate-300 mb-4">
              If an account exists with {email}, you'll receive a password reset link shortly.
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
