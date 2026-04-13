import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

interface RateLimit {
  window: 'minute' | 'hour' | 'day' | 'week';
  max_requests: number;
  enabled: boolean;
}

interface RateLimitStatusProps {
  webhookId: string;
  rateLimits: RateLimit[];
}

export function RateLimitStatus({ webhookId: _webhookId, rateLimits }: RateLimitStatusProps) {
  // Supabase removed: usage + violation analytics are disabled without backend.
  const [loading, setLoading] = useState(true);

  const enabledLimits = rateLimits.filter((l) => l.enabled);

  useEffect(() => {
    // Keep deterministic behavior: stop loading immediately.
    setLoading(false);
  }, []);

  if (enabledLimits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rate Limiting
          </CardTitle>
          <CardDescription>No rate limits configured</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatus = (usage: number, max: number) => {
    const percent = (usage / max) * 100;
    return percent >= 90 ? 'critical' : percent >= 70 ? 'warning' : 'healthy';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Rate Limit Status
        </CardTitle>
        <CardDescription>Rate-limit analytics are disabled (backend removed)</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <p className="text-sm">Loading…</p>
          </div>
        )}

        {enabledLimits.map((limit) => {
          // Without backend, we can’t compute usage. Show 0/limit with an “Unavailable” badge.
          const usage = 0;
          const percent = 0;
          const status = getStatus(usage, limit.max_requests);

          return (
            <div key={limit.window} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {limit.window === 'minute' && <Zap className="h-4 w-4 text-yellow-600" />}
                  <span className="font-medium capitalize">{limit.window}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {usage} / {limit.max_requests}
                  </span>
                  <Badge variant={status === 'critical' ? 'destructive' : status === 'warning' ? 'default' : 'secondary'}>
                    Unavailable
                  </Badge>
                </div>
              </div>

              <Progress value={percent} />
            </div>
          );
        })}

        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            No violations detected (analytics disabled)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
