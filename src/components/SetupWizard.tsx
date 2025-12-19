import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('supabase.co') || parsed.hostname.includes('localhost');
    } catch {
      return false;
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setError('');
    setSuccess(false);

    if (!validateUrl(supabaseUrl)) {
      setError('Invalid Supabase URL format');
      setTesting(false);
      return;
    }

    if (!supabaseKey || supabaseKey.length < 20) {
      setError('Invalid Supabase anon key');
      setTesting(false);
      return;
    }

    try {
      const testClient = createClient(supabaseUrl, supabaseKey);
      const { error: testError } = await testClient.from('profiles').select('count').limit(1);
      
      if (testError && testError.code !== 'PGRST116') {
        throw testError;
      }

      localStorage.setItem('supabase_url', supabaseUrl);
      localStorage.setItem('supabase_anon_key', supabaseKey);
      setSuccess(true);
      setTimeout(() => onComplete(), 1500);
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Supabase Configuration</CardTitle>
          <CardDescription>Configure your Supabase credentials to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Supabase Project URL</Label>
            <Input
              id="url"
              placeholder="https://xxxxx.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key">Supabase Anon Key</Label>
            <Input
              id="key"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Connection successful! Loading app...</AlertDescription>
            </Alert>
          )}
          <Button onClick={testConnection} disabled={testing || success} className="w-full">
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {success ? 'Connected!' : testing ? 'Testing...' : 'Test & Save'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
