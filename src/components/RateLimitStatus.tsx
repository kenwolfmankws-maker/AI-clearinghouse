import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { Activity, AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';

interface RateLimit {
  window: 'minute' | 'hour' | 'day' | 'week';
  max_requests: number;
  enabled: boolean;
}

interface RateLimitStatusProps {
  webhookId: string;
  rateLimits: RateLimit[];
}

export function RateLimitStatus({ webhookId, rateLimits }: RateLimitStatusProps) {
  const [usageData, setUsageData] = useState<Record<string, number>>({});
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const enabledLimits = rateLimits.filter(l => l.enabled);

  useEffect(() => {
    if (enabledLimits.length > 0) {
      fetchRateLimitData();
      const interval = setInterval(fetchRateLimitData, 30000);
      return () => clearInterval(interval);
    }
  }, [webhookId, JSON.stringify(rateLimits)]);

  const fetchRateLimitData = async () => {
    try {
      const usage: Record<string, number> = {};
      
      for (const limit of enabledLimits) {
        const windowMs = { minute: 60000, hour: 3600000, day: 86400000, week: 604800000 }[limit.window];
        const windowStart = new Date(Date.now() - windowMs).toISOString();
        
        const { data: deliveries } = await supabase
          .from('webhook_deliveries')
          .select('id')
          .eq('webhook_id', webhookId)
          .gte('created_at', windowStart);

        usage[limit.window] = deliveries?.length || 0;
      }

      setUsageData(usage);

      const { data: violationData } = await supabase
        .from('rate_limit_violations')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('attempted_at', { ascending: false })
        .limit(5);

      setViolations(violationData || []);
    } catch (error) {
      console.error('Error fetching rate limit data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getWindowLabel = (window: string) => {
    return { minute: 'min', hour: 'hr', day: 'day', week: 'week' }[window] || window;
  };

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
        <CardDescription>Multi-window rate limiting with burst protection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabledLimits.map((limit) => {
          const usage = usageData[limit.window] || 0;
          const percent = (usage / limit.max_requests) * 100;
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
                    {percent.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={percent} 
                className={status === 'critical' ? '[&>div]:bg-red-600' : status === 'warning' ? '[&>div]:bg-yellow-600' : ''} 
              />
            </div>
          );
        })}

        {violations.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Recent Violations
            </h4>
            <div className="space-y-2">
              {violations.slice(0, 3).map((violation) => (
                <div key={violation.id} className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-orange-900 capitalize">
                      {violation.window_type} limit exceeded
                    </span>
                    <span className="text-orange-700">
                      {new Date(violation.attempted_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-orange-700 mt-1">
                    Limit: {violation.limit_value} requests
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {violations.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">No violations detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
