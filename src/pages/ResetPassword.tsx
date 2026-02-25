import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Lock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the password reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidToken(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    });
  }, []);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Contains number', test: (p: string) => /[0-9]/.test(p) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are identical.',
        variant: 'destructive'
      });
      return;
    }

    const allRequirementsMet = passwordRequirements.every(req => req.test(newPassword));
    if (!allRequirementsMet) {
      setError('Password does not meet requirements');
      toast({
        title: 'Password requirements not met',
        description: 'Please ensure your password meets all requirements.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'Password reset successful!',
        description: 'You can now log in with your new password.',
      });

      setTimeout(() => navigate('/'), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
            <p className="text-slate-400">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Reset Password
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!validToken ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Invalid or expired reset link. Please request a new one.'}
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-slate-300 mb-2">Password Requirements:</p>
                {passwordRequirements.map((req, idx) => {
                  const met = req.test(newPassword);
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {met ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-500" />
                      )}
                      <span className={met ? 'text-green-400' : 'text-slate-400'}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
