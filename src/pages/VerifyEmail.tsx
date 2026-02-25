import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailVerification = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (type === 'email' && token_hash) {
        setStatus('verifying');
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email',
          });

          if (error) throw error;

          setStatus('success');
          setMessage('Your email has been verified successfully!');

          setTimeout(() => {
            navigate('/profile');
          }, 3000);

        } catch (error: any) {
          setStatus('error');
          setMessage(error.message || 'Failed to verify email');
        }
      } else {
        setStatus('pending');
        setMessage('Check your email for the verification link');
      }
    };

    handleEmailVerification();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === 'pending' ? 'Verify your email address' : 'Processing verification'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === 'pending' && (
            <>
              <Mail className="h-16 w-16 text-indigo-600" />
              <p className="text-gray-600 text-center">{message}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                Return Home
              </Button>
            </>
          )}

          {status === 'verifying' && (
            <>
              <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
              <p className="text-gray-600">Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600" />
              <p className="text-green-600 font-medium text-center">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to your profile...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-600" />
              <p className="text-red-600 font-medium text-center">{message}</p>
              <Button onClick={() => navigate('/profile')} className="mt-4">
                Go to Profile
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
