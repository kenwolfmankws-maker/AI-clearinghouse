import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, TrendingUp, Zap, Brain } from 'lucide-react';
import { RealTimeTestMonitor } from './RealTimeTestMonitor';
import { LiveTrafficAllocation } from './LiveTrafficAllocation';
import { AnimatedProbabilityChart } from './AnimatedProbabilityChart';
import { toast } from 'sonner';

export function MultiVariantTestDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [bayesianData, setBayesianData] = useState<any[]>([]);

  const handleSignificanceReached = (variantId: string) => {
    const variant = results.find(r => r.variant_id === variantId);
    if (variant) {
      toast.success('Statistical Significance Reached!', {
        description: `Variant "${variant.digest_ab_variants?.name}" has reached 95% probability.`,
        duration: 10000,
      });
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+3nn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBACg==');
      audio.play().catch(() => {});
    }
  };

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    const { data } = await supabase.from('digest_ab_tests').select('*, digest_ab_variants(*)').order('created_at', { ascending: false });
    setTests(data || []);
    if (data?.length && !selectedTest) {
      setSelectedTest(data[0]);
      loadResults(data[0].id);
    }
  };

  const loadResults = async (testId: string) => {
    const { data } = await supabase.from('digest_ab_results').select('*, digest_ab_variants(*)').eq('test_id', testId);
    setResults(data || []);
    const { data: bayesian } = await supabase.from('digest_bayesian_analysis').select('*').eq('test_id', testId);
    setBayesianData(bayesian || []);
  };

  const calculateProbabilityBest = (variant: any) => {
    if (bayesianData.length === 0) return 0;
    let wins = 0;
    for (let i = 0; i < 10000; i++) {
      const sample = Math.random() ** (1/variant.alpha) * (1 - Math.random() ** (1/variant.beta));
      if (bayesianData.every(o => o.variant_id === variant.variant_id || sample > Math.random() ** (1/o.alpha) * (1 - Math.random() ** (1/o.beta)))) wins++;
    }
    return wins / 10000;
  };

  const declareWinner = async (testId: string, variantId: string) => {
    await supabase.from('digest_ab_tests').update({ status: 'completed', winner_variant_id: variantId, end_date: new Date().toISOString() }).eq('id', testId);
    loadTests();
  };

  const chartData = bayesianData.map(v => ({
    name: v.variant_name,
    'Posterior Mean': (v.posterior_mean * 100).toFixed(1),
    'Probability Best': (calculateProbabilityBest(v) * 100).toFixed(1)
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Multi-Variant Testing Dashboard</h2>
        <CreateMultiVariantTestDialog onCreated={loadTests} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Active Tests', icon: TrendingUp, value: tests.filter(t => t.status === 'active').length },
          { title: 'Total Variants', icon: Zap, value: tests.reduce((s, t) => s + (t.digest_ab_variants?.length || 0), 0) },
          { title: 'Bayesian Tests', icon: Brain, value: tests.filter(t => t.allocation_algorithm !== 'equal').length },
          { title: 'Winners', icon: Trophy, value: tests.filter(t => t.winner_variant_id).length }
        ].map(({ title, icon: Icon, value }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
          </Card>
        ))}
      </div>

      {selectedTest && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealTimeTestMonitor testId={selectedTest.id} onSignificanceReached={handleSignificanceReached} />
            <LiveTrafficAllocation testId={selectedTest.id} />
          </div>
          <AnimatedProbabilityChart bayesianData={bayesianData} />
          <Card>
            <CardHeader>
              <CardTitle>{selectedTest.name}</CardTitle>
              <CardDescription>Algorithm: {selectedTest.allocation_algorithm || 'equal'} • Status: {selectedTest.status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Posterior Mean" fill="#3b82f6" />
                  <Bar dataKey="Probability Best" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {results.map((r) => {
                  const b = bayesianData.find(x => x.variant_id === r.variant_id);
                  const p = b ? calculateProbabilityBest(b) : 0;
                  return (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {p > 0.95 && <Trophy className="h-5 w-5 text-yellow-500" />}
                        <div>
                          <div className="font-medium">{r.digest_ab_variants?.name}</div>
                          <div className="text-sm text-muted-foreground">{r.digests_sent} sent • {((r.open_rate || 0) * 100).toFixed(1)}% open</div>
                          {b && <div className="text-xs text-muted-foreground mt-1">P(Best): {(p * 100).toFixed(1)}%</div>}
                        </div>
                      </div>
                      {selectedTest.status === 'active' && p > 0.95 && (
                        <Button size="sm" onClick={() => declareWinner(selectedTest.id, r.variant_id)}>Declare Winner</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function CreateMultiVariantTestDialog({ onCreated }: any) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [algorithm, setAlgorithm] = useState('thompson');
  const [numVariants, setNumVariants] = useState(3);

  const createTest = async () => {
    const { data: test } = await supabase.from('digest_ab_tests').insert({ name, test_type: 'subject_line', status: 'draft', allocation_algorithm: algorithm }).select().single();
    if (test) {
      await supabase.from('digest_ab_variants').insert(Array.from({ length: numVariants }, (_, i) => ({
        test_id: test.id, name: i === 0 ? 'Control' : `Variant ${String.fromCharCode(65 + i - 1)}`, traffic_allocation: 1 / numVariants
      })));
      onCreated();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Create Multi-Variant Test</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Multi-Variant Test</DialogTitle>
          <DialogDescription>Set up A/B/C/D testing with advanced algorithms</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Test Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <Label>Number of Variants</Label>
            <Select value={numVariants.toString()} onValueChange={(v) => setNumVariants(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n} ({['A/B', 'A/B/C', 'A/B/C/D', 'A/B/C/D/E'][n-2]})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Allocation Algorithm</Label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Equal Distribution</SelectItem>
                <SelectItem value="thompson">Thompson Sampling (Bayesian)</SelectItem>
                <SelectItem value="ucb">Upper Confidence Bound</SelectItem>
                <SelectItem value="epsilon_greedy">Epsilon-Greedy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createTest} className="w-full">Create Test</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
