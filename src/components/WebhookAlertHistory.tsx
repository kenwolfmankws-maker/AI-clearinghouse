import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function WebhookAlertHistory() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadAlerts();
    const subscription = supabase
      .channel('alert_history_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webhook_alert_history' }, loadAlerts)
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('webhook_alert_history')
      .select(`
        *,
        alert_rule:webhook_alert_rules(name, condition_type, is_critical)
      `)
      .order('triggered_at', { ascending: false })
      .limit(100);
    
    if (!error && data) setAlerts(data);
  };

  const resolveAlert = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('webhook_alert_history')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
        resolution_notes: resolutionNotes
      })
      .eq('id', alertId);
    
    if (error) {
      toast.error('Failed to resolve alert');
      return;
    }
    
    toast.success('Alert resolved');
    setSelectedAlert(null);
    setResolutionNotes('');
    loadAlerts();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Alert History</h2>
        <p className="text-muted-foreground">View and manage triggered alerts</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(a => !a.resolved_at).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.alert_rule?.is_critical && !a.resolved_at).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map(alert => (
                <TableRow key={alert.id}>
                  <TableCell className="text-sm">
                    {new Date(alert.triggered_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {alert.alert_rule?.name}
                      {alert.alert_rule?.is_critical && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />Critical
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{alert.condition_met}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {alert.actual_value.toFixed(2)} / {alert.threshold_value}
                  </TableCell>
                  <TableCell>
                    {alert.resolved_at ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="w-3 h-3" />Resolved
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="w-3 h-3" />Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!alert.resolved_at && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedAlert(alert)}>
                            Resolve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolve Alert</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Resolution Notes</p>
                              <Textarea
                                value={resolutionNotes}
                                onChange={e => setResolutionNotes(e.target.value)}
                                placeholder="Describe how this issue was resolved..."
                                rows={4}
                              />
                            </div>
                            <Button onClick={() => resolveAlert(alert.id)} className="w-full">
                              Mark as Resolved
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}