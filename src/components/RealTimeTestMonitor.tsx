import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Activity, AlertTriangle, CheckCircle, Pause, Play, TrendingDown, TrendingUp } from 'lucide-react';

interface TestMetrics {
  id: string;
  name: string;
  status: string;
  variants: any[];
  winner_variant?: string;
  confidence_level?: number;
  total_sends: number;
  created_at: string;
}

export function RealTimeTestMonitor() {
  const { toast } = useToast();
  const [tests, setTests] = useState<TestMetrics[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveTests();
    const interval = setInterval(loadActiveTests, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadActiveTests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: testsData } = await supabase
      .from('digest_ab_tests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'scheduled'])
      .order('created_at', { ascending: false });

    const { data: alertsData } = await supabase
      .from('digest_alert_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (testsData) setTests(testsData);
    if (alertsData) setAlerts(alertsData);
    setLoading(false);
  };

  const analyzePerformance = (test: TestMetrics) => {
    if (!test.variants || test.variants.length === 0) return null;

    const opens = test.variants.map((v: any) => v.opens || 0);
    const clicks = test.variants.map((v: any) => v.clicks || 0);
    const sends = test.variants.map((v: any) => v.sends || 0);

    const openRates = sends.map((s, i) => s > 0 ? (opens[i] / s) * 100 : 0);
    const clickRates = sends.map((s, i) => s > 0 ? (clicks[i] / s) * 100 : 0);

    const maxOpenRate = Math.max(...openRates);
    const minOpenRate = Math.min(...openRates);
    const avgOpenRate = openRates.reduce((a, b) => a + b, 0) / openRates.length;

    const variance = Math.abs(maxOpenRate - minOpenRate);
    const isSignificant = variance > 5 && test.total_sends > 100;
    const hasUnderperformer = minOpenRate < avgOpenRate * 0.5 && test.total_sends > 50;

    return { openRates, clickRates, isSignificant, hasUnderperformer, variance };
  };

  const pauseTest = async (testId: string) => {
    const { error } = await supabase
      .from('digest_ab_tests')
      .update({ status: 'paused' })
      .eq('id', testId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Test Paused', description: 'Test has been paused' });
      loadActiveTests();
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('digest_alert_history')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', alertId);

    if (!error) loadActiveTests();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-3 bg-white rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      {alert.severity}
                    </Badge>
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => acknowledgeAlert(alert.id)}>
                  Dismiss
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tests.map((test) => {
          const metrics = analyzePerformance(test);
          return (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {test.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge>{test.status}</Badge>
                      {metrics?.isSignificant && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Significant
                        </Badge>
                      )}
                      {metrics?.hasUnderperformer && (
                        <Badge variant="destructive">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Underperformer
                        </Badge>
                      )}
                    </div>
                  </div>
                  {test.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => pauseTest(test.id)}>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Sends</span>
                      <span className="font-medium">{test.total_sends}</span>
                    </div>
                    <Progress value={(test.total_sends / 1000) * 100} className="h-2" />
                  </div>
                  
                  {metrics && (
                    <div className="grid grid-cols-2 gap-4">
                      {test.variants.map((variant: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium mb-2">Variant {String.fromCharCode(65 + idx)}</div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Open Rate:</span>
                              <span className="font-medium">{metrics.openRates[idx]?.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Click Rate:</span>
                              <span className="font-medium">{metrics.clickRates[idx]?.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {test.confidence_level && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Confidence: {(test.confidence_level * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No active tests to monitor
          </CardContent>
        </Card>
      )}
    </div>
  );
}
