import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Trash2, Plus } from 'lucide-react';

interface ScheduledReport {
  id: string;
  email: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastSent?: string;
}

export function ScheduledReports() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const saved = localStorage.getItem('scheduled_reports');
    if (saved) setReports(JSON.parse(saved));
  }, []);

  const saveReports = (newReports: ScheduledReport[]) => {
    setReports(newReports);
    localStorage.setItem('scheduled_reports', JSON.stringify(newReports));
  };

  const addReport = () => {
    if (!email) return;
    const newReport: ScheduledReport = {
      id: Date.now().toString(),
      email,
      frequency,
      enabled: true,
    };
    saveReports([...reports, newReport]);
    setEmail('');
  };

  const toggleReport = (id: string) => {
    saveReports(reports.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteReport = (id: string) => {
    saveReports(reports.filter(r => r.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Scheduled Reports
        </CardTitle>
        <CardDescription>Automatically email API usage reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
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
          <Button onClick={addReport} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Scheduled Report
          </Button>
        </div>

        <div className="space-y-2 pt-4 border-t">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No scheduled reports</p>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{report.email}</p>
                    <p className="text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{report.frequency}</Badge>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={report.enabled} onCheckedChange={() => toggleReport(report.id)} />
                  <Button variant="ghost" size="sm" onClick={() => deleteReport(report.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
