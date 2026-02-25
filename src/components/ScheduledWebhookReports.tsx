import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ScheduledWebhookReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'weekly',
    recipient_emails: '',
    format: 'csv',
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data } = await supabase
      .from('scheduled_webhook_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setReports(data);
  };

  const handleCreate = async () => {
    try {
      const emails = formData.recipient_emails.split(',').map(e => e.trim());
      const nextRun = new Date();
      if (formData.frequency === 'daily') nextRun.setDate(nextRun.getDate() + 1);
      else if (formData.frequency === 'weekly') nextRun.setDate(nextRun.getDate() + 7);
      else nextRun.setMonth(nextRun.getMonth() + 1);

      const { error } = await supabase
        .from('scheduled_webhook_reports')
        .insert({
          name: formData.name,
          frequency: formData.frequency,
          recipient_emails: emails,
          format: formData.format,
          next_scheduled_at: nextRun.toISOString(),
        });

      if (error) throw error;
      toast.success('Report scheduled successfully');
      setOpen(false);
      loadReports();
      setFormData({ name: '', frequency: 'weekly', recipient_emails: '', format: 'csv' });
    } catch (error) {
      toast.error('Failed to create report');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('scheduled_webhook_reports')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Report deleted');
      loadReports();
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('scheduled_webhook_reports')
      .update({ enabled: !enabled })
      .eq('id', id);

    if (!error) {
      toast.success(enabled ? 'Report disabled' : 'Report enabled');
      loadReports();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Scheduled Reports</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Report Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Weekly webhook summary"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recipients (comma-separated)</Label>
                <Input
                  value={formData.recipient_emails}
                  onChange={(e) => setFormData({ ...formData, recipient_emails: e.target.value })}
                  placeholder="admin@example.com, team@example.com"
                />
              </div>
              <div>
                <Label>Format</Label>
                <Select value={formData.format} onValueChange={(v) => setFormData({ ...formData, format: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{report.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {report.frequency} • {report.format.toUpperCase()} • {report.recipient_emails.length} recipients
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={report.enabled ? 'default' : 'secondary'}>
                  {report.enabled ? 'Active' : 'Disabled'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggle(report.id, report.enabled)}
                >
                  {report.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(report.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
