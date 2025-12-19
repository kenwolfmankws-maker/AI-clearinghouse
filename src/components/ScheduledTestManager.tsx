import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Play, Pause, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduledTest {
  id: string;
  name: string;
  description: string;
  scheduled_start_time: string;
  timezone: string;
  recurrence_pattern: string;
  variant_count: number;
  algorithm: string;
  status: string;
  next_run_at: string;
  last_run_at: string;
}

export function ScheduledTestManager() {
  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scheduled_start_time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    recurrence_pattern: 'none',
    recurrence_end_date: '',
    variant_count: 2,
    algorithm: 'equal',
    subject_line_template: '',
  });

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scheduled_digest_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('next_run_at', { ascending: true });

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading tests', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createTest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('scheduled_digest_tests').insert({
        ...formData,
        user_id: user.id,
        next_run_at: formData.scheduled_start_time,
      });

      if (error) throw error;
      toast({ title: 'Test scheduled successfully' });
      setShowForm(false);
      loadTests();
    } catch (error: any) {
      toast({ title: 'Error scheduling test', description: error.message, variant: 'destructive' });
    }
  };

  const deleteTest = async (id: string) => {
    try {
      const { error } = await supabase.from('scheduled_digest_tests').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Test deleted' });
      loadTests();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'running': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scheduled Tests</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule New Test
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule A/B Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Test Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <Label>Start Date & Time</Label>
              <Input type="datetime-local" value={formData.scheduled_start_time} 
                onChange={(e) => setFormData({...formData, scheduled_start_time: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recurrence</Label>
                <Select value={formData.recurrence_pattern} onValueChange={(v) => setFormData({...formData, recurrence_pattern: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Variants</Label>
                <Input type="number" min="2" value={formData.variant_count} 
                  onChange={(e) => setFormData({...formData, variant_count: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createTest}>Schedule Test</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tests.map((test) => (
          <Card key={test.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{test.name}</h3>
                    <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                    {test.recurrence_pattern !== 'none' && (
                      <Badge variant="outline"><RefreshCw className="w-3 h-3 mr-1" />{test.recurrence_pattern}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Next run: {new Date(test.next_run_at).toLocaleString()}
                    </div>
                    <div>Variants: {test.variant_count} | Algorithm: {test.algorithm}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteTest(test.id)}>
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
