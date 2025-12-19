import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Activity, Ban, CheckCircle, Clock, Search, Unlock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RateLimitStatus {
  id: string;
  phone_number: string;
  message_count_hour: number;
  message_count_day: number;
  last_message_at: string;
  is_blocked: boolean;
  blocked_until: string | null;
  blocked_reason: string | null;
}

export function SMSRateLimitStatus() {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<RateLimitStatus[]>([]);
  const [config, setConfig] = useState({ max_messages_per_hour: 10, max_messages_per_day: 50 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [statusRes, configRes] = await Promise.all([
      supabase.from('sms_rate_limit_tracking').select('*').eq('org_id', user.id).order('last_message_at', { ascending: false }),
      supabase.from('sms_rate_limit_config').select('*').eq('org_id', user.id).single(),
    ]);

    if (statusRes.data) setStatuses(statusRes.data);
    if (configRes.data) setConfig(configRes.data);
    setLoading(false);
  };

  const unblockRecipient = async (id: string) => {
    const { error } = await supabase
      .from('sms_rate_limit_tracking')
      .update({ is_blocked: false, blocked_until: null, blocked_reason: null })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Recipient unblocked' });
      loadData();
    }
  };

  const filtered = statuses.filter(s => s.phone_number.includes(search));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Rate Limit Status by Recipient
        </CardTitle>
        <CardDescription>Monitor SMS usage and blocked recipients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((status) => {
            const hourPercent = (status.message_count_hour / config.max_messages_per_hour) * 100;
            const dayPercent = (status.message_count_day / config.max_messages_per_day) * 100;
            const isNearLimit = hourPercent > 80 || dayPercent > 80;

            return (
              <div key={status.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{status.phone_number}</span>
                    {status.is_blocked ? (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />
                        Blocked
                      </Badge>
                    ) : isNearLimit ? (
                      <Badge variant="outline" className="gap-1 border-amber-500 text-amber-700">
                        <Clock className="h-3 w-3" />
                        Near Limit
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  {status.is_blocked && (
                    <Button size="sm" variant="outline" onClick={() => unblockRecipient(status.id)}>
                      <Unlock className="mr-2 h-4 w-4" />
                      Unblock
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hourly: {status.message_count_hour}/{config.max_messages_per_hour}</span>
                      <span className={hourPercent > 80 ? 'text-amber-600' : ''}>{Math.round(hourPercent)}%</span>
                    </div>
                    <Progress value={hourPercent} className={hourPercent > 80 ? 'bg-amber-100' : ''} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Daily: {status.message_count_day}/{config.max_messages_per_day}</span>
                      <span className={dayPercent > 80 ? 'text-amber-600' : ''}>{Math.round(dayPercent)}%</span>
                    </div>
                    <Progress value={dayPercent} className={dayPercent > 80 ? 'bg-amber-100' : ''} />
                  </div>
                </div>

                {status.blocked_until && (
                  <p className="text-sm text-muted-foreground">
                    Blocked until: {new Date(status.blocked_until).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">No recipients found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
