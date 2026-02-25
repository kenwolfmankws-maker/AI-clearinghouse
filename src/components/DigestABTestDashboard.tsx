import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, TrendingUp, Users, Mail } from 'lucide-react';

export function DigestABTestDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('digest_ab_tests')
      .select('*, digest_ab_variants(*)')
      .order('created_at', { ascending: false });
    
    setTests(data || []);
    if (data?.length && !selectedTest) {
      setSelectedTest(data[0]);
      loadResults(data[0].id);
    }
    setLoading(false);
  };

  const loadResults = async (testId: string) => {
    const { data } = await supabase
      .from('digest_ab_results')
      .select('*, digest_ab_variants(*)')
      .eq('test_id', testId);
    
    setResults(data || []);
  };

  const calculateSignificance = (variantA: any, variantB: any) => {
    const n1 = variantA.digests_sent;
    const n2 = variantB.digests_sent;
    const p1 = variantA.open_rate || 0;
    const p2 = variantB.open_rate || 0;

    if (n1 < 30 || n2 < 30) return { significant: false, pValue: 1 };

    const p = (n1 * p1 + n2 * p2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
    const z = Math.abs(p1 - p2) / se;
    const pValue = 2 * (1 - normalCDF(z));

    return { significant: pValue < 0.05, pValue };
  };

  const normalCDF = (x: number) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  };

  const declareWinner = async (testId: string, variantId: string) => {
    await supabase
      .from('digest_ab_tests')
      .update({ 
        status: 'completed',
        winner_variant_id: variantId,
        end_date: new Date().toISOString()
      })
      .eq('id', testId);
    
    loadTests();
  };

  const chartData = results.map(r => ({
    name: r.digest_ab_variants?.name || 'Variant',
    'Open Rate': (r.open_rate * 100).toFixed(1),
    'Click Rate': (r.click_rate * 100).toFixed(1),
    'Sent': r.digests_sent
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">A/B Test Dashboard</h2>
        <CreateTestDialog onCreated={loadTests} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.filter(t => t.status === 'active').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.reduce((sum, r) => sum + r.digests_sent, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.length ? (results.reduce((sum, r) => sum + (r.open_rate || 0), 0) / results.length * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Winners Declared</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.filter(t => t.winner_variant_id).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {tests.filter(t => t.status === 'active').map(test => (
            <TestResultCard 
              key={test.id} 
              test={test} 
              onSelect={() => { setSelectedTest(test); loadResults(test.id); }}
              onDeclareWinner={declareWinner}
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {tests.filter(t => t.status === 'completed').map(test => (
            <TestResultCard key={test.id} test={test} />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {tests.map(test => (
            <TestResultCard key={test.id} test={test} />
          ))}
        </TabsContent>
      </Tabs>

      {selectedTest && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Open Rate" fill="#3b82f6" />
                <Bar dataKey="Click Rate" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TestResultCard({ test, onSelect, onDeclareWinner }: any) {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    loadResults();
  }, [test.id]);

  const loadResults = async () => {
    const { data } = await supabase
      .from('digest_ab_results')
      .select('*, digest_ab_variants(*)')
      .eq('test_id', test.id);
    setResults(data || []);
  };

  const winner = results.find(r => r.variant_id === test.winner_variant_id);
  const sortedResults = [...results].sort((a, b) => (b.open_rate || 0) - (a.open_rate || 0));

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onSelect}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{test.name}</CardTitle>
            <CardDescription>{test.description}</CardDescription>
          </div>
          <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
            {test.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedResults.map((result, idx) => (
            <div key={result.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {idx === 0 && test.status === 'active' && (
                  <Trophy className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <div className="font-medium">{result.digest_ab_variants?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {result.digests_sent} sent • {((result.open_rate || 0) * 100).toFixed(1)}% opened
                  </div>
                </div>
              </div>
              {test.status === 'active' && onDeclareWinner && idx === 0 && result.digests_sent >= 100 && (
                <Button 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); onDeclareWinner(test.id, result.variant_id); }}
                >
                  Declare Winner
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTestDialog({ onCreated }: any) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [testType, setTestType] = useState('subject_line');

  const createTest = async () => {
    const { data: test } = await supabase
      .from('digest_ab_tests')
      .insert({ name, test_type: testType, status: 'draft' })
      .select()
      .single();

    if (test) {
      await supabase.from('digest_ab_variants').insert([
        { test_id: test.id, name: 'Control', traffic_allocation: 0.5 },
        { test_id: test.id, name: 'Variant A', traffic_allocation: 0.5 }
      ]);
      
      onCreated();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Test</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
          <DialogDescription>Set up a new test to optimize your digest emails</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Test Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subject Line Test #1" />
          </div>
          <div>
            <Label>Test Type</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subject_line">Subject Line</SelectItem>
                <SelectItem value="send_time">Send Time</SelectItem>
                <SelectItem value="format">Email Format</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createTest} className="w-full">Create Test</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
