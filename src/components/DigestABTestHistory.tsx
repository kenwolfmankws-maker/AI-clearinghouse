import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TestComparisonChart from './TestComparisonChart';
import { useToast } from '@/hooks/use-toast';

interface HistoricalTest {
  id: string;
  name: string;
  description: string;
  algorithm: string;
  started_at: string;
  completed_at: string;
  completion_reason: string;
  variant_count: number;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  avg_open_rate: number;
  avg_click_rate: number;
  winner_name: string;
  winner_open_rate: number;
  final_insights: any;
}

export default function DigestABTestHistory() {
  const [tests, setTests] = useState<HistoricalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'open_rate' | 'click_rate'>('open_rate');
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('digest_test_history')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error loading test history:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const insights = analyzePatterns();
    const report = {
      generated_at: new Date().toISOString(),
      summary: insights,
      tests: tests.map(t => ({
        name: t.name,
        algorithm: t.algorithm,
        variants: t.variant_count,
        winner: t.winner_name,
        open_rate: t.avg_open_rate,
        click_rate: t.avg_click_rate,
        completed: t.completed_at
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-test-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    toast({
      title: 'Report Exported',
      description: 'Historical analytics report downloaded successfully'
    });
  };

  const analyzePatterns = () => {
    if (tests.length === 0) return null;

    const avgOpenRate = tests.reduce((sum, t) => sum + (t.avg_open_rate || 0), 0) / tests.length;
    const avgClickRate = tests.reduce((sum, t) => sum + (t.avg_click_rate || 0), 0) / tests.length;
    
    const algorithmPerformance = tests.reduce((acc, t) => {
      if (!acc[t.algorithm]) acc[t.algorithm] = { count: 0, totalOpen: 0 };
      acc[t.algorithm].count++;
      acc[t.algorithm].totalOpen += t.avg_open_rate || 0;
      return acc;
    }, {} as Record<string, { count: number; totalOpen: number }>);

    const bestAlgorithm = Object.entries(algorithmPerformance)
      .map(([alg, stats]) => ({ algorithm: alg, avgOpen: stats.totalOpen / stats.count }))
      .sort((a, b) => b.avgOpen - a.avgOpen)[0];

    return {
      totalTests: tests.length,
      avgOpenRate: avgOpenRate.toFixed(2),
      avgClickRate: avgClickRate.toFixed(2),
      bestAlgorithm: bestAlgorithm?.algorithm,
      bestAlgorithmRate: bestAlgorithm?.avgOpen.toFixed(2)
    };
  };

  const insights = analyzePatterns();

  if (loading) {
    return <div className="text-center py-8">Loading historical data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Tests</span>
            </div>
            <div className="text-2xl font-bold">{insights.totalTests}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Avg Open Rate</span>
            </div>
            <div className="text-2xl font-bold">{insights.avgOpenRate}%</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Avg Click Rate</span>
            </div>
            <div className="text-2xl font-bold">{insights.avgClickRate}%</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Best Algorithm</span>
            </div>
            <div className="text-lg font-bold">{insights.bestAlgorithm}</div>
            <div className="text-sm text-muted-foreground">{insights.bestAlgorithmRate}%</div>
          </Card>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Charts */}
      <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as any)}>
        <TabsList>
          <TabsTrigger value="open_rate">Open Rate Trends</TabsTrigger>
          <TabsTrigger value="click_rate">Click Rate Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="open_rate">
          <TestComparisonChart tests={tests} metric="open_rate" />
        </TabsContent>
        <TabsContent value="click_rate">
          <TestComparisonChart tests={tests} metric="click_rate" />
        </TabsContent>
      </Tabs>

      {/* Test List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Completed Tests</h3>
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{test.name}</h4>
                  <p className="text-sm text-muted-foreground">{test.description}</p>
                </div>
                <Badge>{test.algorithm}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Variants</div>
                  <div className="font-semibold">{test.variant_count}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Sent</div>
                  <div className="font-semibold">{test.total_sent}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Open Rate</div>
                  <div className="font-semibold">{test.avg_open_rate?.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Click Rate</div>
                  <div className="font-semibold">{test.avg_click_rate?.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Winner</div>
                  <div className="font-semibold text-green-600">{test.winner_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {test.winner_open_rate?.toFixed(2)}% open rate
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Completed: {new Date(test.completed_at).toLocaleString()} 
                ({test.completion_reason})
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
