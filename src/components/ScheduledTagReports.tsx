import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Mail, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReportTemplateManager from './ReportTemplateManager';


interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  email_subject: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'csv' | 'pdf';
  metrics: string[];
  date_range_days: number | null;
  recipients: string[];
  is_active: boolean;
  last_sent_at: string | null;
  next_scheduled_at: string | null;
}

export function ScheduledTagReports() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const { toast } = useToast();


  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email_subject: 'Tag Analytics Report',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    format: 'csv' as 'csv' | 'pdf',
    metrics: ['tag_statistics', 'top_tags', 'usage_over_time'],
    date_range_days: 30,
    recipients: [''],
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_tag_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validRecipients = formData.recipients.filter(r => r.trim());
    if (validRecipients.length === 0) {
      toast({ title: 'Error', description: 'Add at least one recipient', variant: 'destructive' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('scheduled_tag_reports').insert({
        user_id: user.id,
        ...formData,
        recipients: validRecipients,
        is_active: true,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Scheduled report created' });
      setDialogOpen(false);
      loadReports();
      resetForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      email_subject: 'Tag Analytics Report',
      frequency: 'weekly',
      format: 'csv',
      metrics: ['tag_statistics', 'top_tags', 'usage_over_time'],
      date_range_days: 30,
      recipients: [''],
    });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_tag_reports')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      loadReports();
      toast({ title: 'Success', description: `Report ${!isActive ? 'activated' : 'paused'}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase.from('scheduled_tag_reports').delete().eq('id', id);
      if (error) throw error;
      loadReports();
      toast({ title: 'Success', description: 'Report deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const addRecipient = () => {
    setFormData({ ...formData, recipients: [...formData.recipients, ''] });
  };

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = value;
    setFormData({ ...formData, recipients: newRecipients });
  };

  const removeRecipient = (index: number) => {
    setFormData({ ...formData, recipients: formData.recipients.filter((_, i) => i !== index) });
  };

  const toggleMetric = (metric: string) => {
    const newMetrics = formData.metrics.includes(metric)
      ? formData.metrics.filter(m => m !== metric)
      : [...formData.metrics, metric];
    setFormData({ ...formData, metrics: newMetrics });
  };

  const handleUseTemplate = (template: any) => {
    const dateRangeDays = template.date_range === 'last_7_days' ? 7 :
                          template.date_range === 'last_30_days' ? 30 :
                          template.date_range === 'last_90_days' ? 90 : null;

    setFormData({
      name: template.name,
      description: template.description || '',
      email_subject: 'Tag Analytics Report',
      frequency: template.frequency,
      format: template.format,
      metrics: template.metrics,
      date_range_days: dateRangeDays,
      recipients: [''],
    });
    
    setTemplateManagerOpen(false);
    setDialogOpen(true);
    toast({ title: 'Template loaded', description: 'Fill in recipients to create report' });
  };

  const getCurrentConfig = () => ({
    frequency: formData.frequency,
    format: formData.format,
    date_range: formData.date_range_days === 7 ? 'last_7_days' :
                formData.date_range_days === 30 ? 'last_30_days' :
                formData.date_range_days === 90 ? 'last_90_days' : 'all_time',
    metrics: formData.metrics,
  });



  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Scheduled Reports</h3>
            <p className="text-sm text-muted-foreground">
              Automate tag analytics reports via email
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTemplateManagerOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Template Library
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Scheduled Report</DialogTitle>
                  <DialogDescription>
                    Configure automated tag analytics reports
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Report Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Select value={formData.format} onValueChange={(value: any) => setFormData({ ...formData, format: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Range (days)</Label>
                    <Input type="number" value={formData.date_range_days || ''} onChange={(e) => setFormData({ ...formData, date_range_days: parseInt(e.target.value) || null })} placeholder="Leave empty for all time" />
                  </div>
                  <div className="space-y-2">
                    <Label>Metrics to Include</Label>
                    <div className="space-y-2">
                      {['tag_statistics', 'top_tags', 'usage_over_time'].map((metric) => (
                        <div key={metric} className="flex items-center space-x-2">
                          <Checkbox checked={formData.metrics.includes(metric)} onCheckedChange={() => toggleMetric(metric)} />
                          <Label className="font-normal">{metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email Recipients</Label>
                    {formData.recipients.map((recipient, index) => (
                      <div key={index} className="flex gap-2">
                        <Input type="email" value={recipient} onChange={(e) => updateRecipient(index, e.target.value)} placeholder="email@example.com" />
                        {formData.recipients.length > 1 && (
                          <Button type="button" variant="outline" size="icon" onClick={() => removeRecipient(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addRecipient} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Recipient
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Create Report</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>


      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No scheduled reports yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {report.name}
                      <Badge variant={report.is_active ? 'default' : 'secondary'}>
                        {report.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Switch
                      checked={report.is_active}
                      onCheckedChange={() => toggleActive(report.id, report.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReport(report.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Frequency
                    </div>
                    <div className="font-medium capitalize">{report.frequency}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Format</div>
                    <div className="font-medium uppercase">{report.format}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Recipients
                    </div>
                    <div className="font-medium">{report.recipients.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Sent</div>
                    <div className="font-medium">
                      {report.last_sent_at
                        ? new Date(report.last_sent_at).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </div>

      <ReportTemplateManager
        open={templateManagerOpen}
        onClose={() => setTemplateManagerOpen(false)}
        onUseTemplate={handleUseTemplate}
        currentConfig={dialogOpen ? getCurrentConfig() : undefined}
      />
    </>
  );
}
