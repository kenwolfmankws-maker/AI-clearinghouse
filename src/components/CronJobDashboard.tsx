import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Clock, CheckCircle, XCircle, Activity, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CronStats {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  avg_execution_time_ms: number;
  last_execution_time: string | null;
  last_execution_status: string | null;
  next_scheduled_time: string;
}

interface ExecutionLog {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  execution_time_ms: number | null;
  records_processed: number;
  records_failed: number;
  error_message: string | null;
}

export function CronJobDashboard() {
  const [stats, setStats] = useState<CronStats | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Get statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_cron_job_stats', { p_job_name: 'send-2fa-reminders', p_days: 30 });

      if (statsError) throw statsError;
      setStats(statsData[0] || null);

      // Get recent logs
      const { data: logsData, error: logsError } = await supabase
        .from('cron_job_executions')
        .select('*')
        .eq('job_name', 'send-2fa-reminders')
        .order('started_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;
      setLogs(logsData || []);
    } catch (error: any) {
      console.error('Error loading cron data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualTrigger = async () => {
    setTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-2fa-reminders', {
        body: { manual: true }
      });

      if (error) throw error;

      toast.success(`Manual trigger completed. Sent ${data.sent} reminders.`);
      setTimeout(loadData, 2000);
    } catch (error: any) {
      toast.error('Failed to trigger job: ' + error.message);
    } finally {
      setTriggering(false);
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading cron job data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">2FA Reminder Scheduler</h3>
          <p className="text-sm text-muted-foreground">Automated daily at 9:00 AM UTC</p>
        </div>
        <Button onClick={handleManualTrigger} disabled={triggering}>
          {triggering ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Manual Trigger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.success_rate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.successful_executions || 0} / {stats?.total_executions || 0} runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats?.avg_execution_time_ms || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per execution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats?.last_execution_status === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : stats?.last_execution_status === 'failed' ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Activity className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-sm">{formatDateTime(stats?.last_execution_time || null)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Next Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm">{formatDateTime(stats?.next_scheduled_time || null)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>Recent job executions (last 10 runs)</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <Alert>
              <AlertDescription>No execution history yet. Trigger manually or wait for scheduled run.</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Processed</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDateTime(log.started_at)}</TableCell>
                    <TableCell>{formatDuration(log.execution_time_ms)}</TableCell>
                    <TableCell>{log.records_processed}</TableCell>
                    <TableCell>{log.records_failed}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {log.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
