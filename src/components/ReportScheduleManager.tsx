import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createReportSchedule, updateReportSchedule, deleteReportSchedule, getReportSchedules, type ReportSchedule } from '@/lib/apiKeyRotationReportService';
import { useToast } from '@/hooks/use-toast';

export function ReportScheduleManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ReportSchedule>({
    report_name: '',
    schedule_frequency: 'weekly',
    report_format: 'csv',
    recipient_emails: [],
    compliance_threshold: 80,
    expiration_warning_days: 7,
    include_policy_violations: true,
    include_rotation_history: true,
    include_compliance_trends: true,
    enabled: true
  });

  useEffect(() => {
    if (user) loadSchedules();
  }, [user]);

  const loadSchedules = async () => {
    if (!user) return;
    try {
      const data = await getReportSchedules(user.id);
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await createReportSchedule({
        ...formData,
        organization_id: user.id
      });
      toast({ title: 'Report schedule created successfully' });
      setIsDialogOpen(false);
      loadSchedules();
      resetForm();
    } catch (error) {
      toast({ title: 'Error creating schedule', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await updateReportSchedule(id, { enabled });
      loadSchedules();
      toast({ title: `Schedule ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
      toast({ title: 'Error updating schedule', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReportSchedule(id);
      loadSchedules();
      toast({ title: 'Schedule deleted' });
    } catch (error) {
      toast({ title: 'Error deleting schedule', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      report_name: '',
      schedule_frequency: 'weekly',
      report_format: 'csv',
      recipient_emails: [],
      compliance_threshold: 80,
      expiration_warning_days: 7,
      include_policy_violations: true,
      include_rotation_history: true,
      include_compliance_trends: true,
      enabled: true
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Automated Compliance Reports</CardTitle>
            <CardDescription>Schedule automated email reports for API key rotation compliance</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Schedule</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Report Schedule</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Report Name</Label>
                  <Input value={formData.report_name} onChange={(e) => setFormData({...formData, report_name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frequency</Label>
                    <Select value={formData.schedule_frequency} onValueChange={(v: any) => setFormData({...formData, schedule_frequency: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Format</Label>
                    <Select value={formData.report_format} onValueChange={(v: any) => setFormData({...formData, report_format: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Recipient Emails (comma-separated)</Label>
                  <Input 
                    value={formData.recipient_emails.join(', ')} 
                    onChange={(e) => setFormData({...formData, recipient_emails: e.target.value.split(',').map(s => s.trim())})} 
                    placeholder="admin@example.com, security@example.com"
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Compliance Threshold (%)</Label>
                    <Input type="number" value={formData.compliance_threshold} onChange={(e) => setFormData({...formData, compliance_threshold: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <Label>Expiration Warning (days)</Label>
                    <Input type="number" value={formData.expiration_warning_days} onChange={(e) => setFormData({...formData, expiration_warning_days: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Include Policy Violations</Label>
                    <Switch checked={formData.include_policy_violations} onCheckedChange={(c) => setFormData({...formData, include_policy_violations: c})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Include Rotation History</Label>
                    <Switch checked={formData.include_rotation_history} onCheckedChange={(c) => setFormData({...formData, include_rotation_history: c})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Include Compliance Trends</Label>
                    <Switch checked={formData.include_compliance_trends} onCheckedChange={(c) => setFormData({...formData, include_compliance_trends: c})} />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">Create Schedule</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{schedule.report_name}</h4>
                  <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                    {schedule.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {schedule.schedule_frequency}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {schedule.recipient_emails.length} recipients
                  </span>
                  {schedule.last_sent_at && (
                    <span>Last sent: {new Date(schedule.last_sent_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={schedule.enabled} onCheckedChange={(c) => handleToggle(schedule.id!, c)} />
                <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.id!)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No report schedules configured</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
