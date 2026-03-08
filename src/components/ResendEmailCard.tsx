import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Send, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_APP_API_URL || '';

export function ResendEmailCard() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setResult({ ok: true, message: data.message || 'Test email sent. Check delivered@resend.dev.' });
      } else {
        setResult({ ok: false, message: data.error || data.details || `Request failed (${res.status})` });
      }
    } catch (err: unknown) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setTesting(false);
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim().split(',').map((s) => s.trim()).filter(Boolean),
          subject: subject.trim(),
          html: body.trim() ? `<p>${body.trim().replace(/\n/g, '</p><p>')}</p>` : '<p>No content.</p>',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setResult({ ok: true, message: `Email sent. Id: ${data.id || '—'}` });
        setBody('');
      } else {
        setResult({ ok: false, message: data.error || data.details || `Request failed (${res.status})` });
      }
    } catch (err: unknown) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email (Resend)
        </CardTitle>
        <CardDescription>
          Send email via Resend. Configure RESEND_API_KEY (and optionally RESEND_FROM) in your environment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={testConnection}
            disabled={testing}
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test connection
          </Button>
        </div>

        <form onSubmit={sendEmail} className="space-y-4">
          <div>
            <Label htmlFor="resend-to">To (comma-separated)</Label>
            <Input
              id="resend-to"
              type="text"
              placeholder="you@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="resend-subject">Subject</Label>
            <Input
              id="resend-subject"
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="resend-body">Body (plain text)</Label>
            <textarea
              id="resend-body"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>
          <Button type="submit" disabled={loading || !to.trim() || !subject.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send email
          </Button>
        </form>

        {result && (
          <Alert variant={result.ok ? 'default' : 'destructive'}>
            {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
