import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Recommendation {
  title: string;
  recommendation: string;
  reasoning: string;
  confidence: number;
  category: 'algorithm' | 'variants' | 'subject_lines' | 'timing';
  impact: 'high' | 'medium' | 'low';
}

export function AITestRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Fetch historical data
      const { data: algorithmPerf, error: algError } = await supabase
        .from('digest_test_performance_summary')
        .select('*');

      const { data: variantAnalysis, error: varError } = await supabase
        .from('variant_count_analysis')
        .select('*');

      const { data: recentTests, error: testError } = await supabase
        .from('digest_test_history')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (algError || varError || testError) {
        throw new Error('Failed to fetch historical data');
      }

      // Call AI recommendation function
      const { data, error } = await supabase.functions.invoke('generate-test-recommendations', {
        body: {
          historicalData: {
            algorithmPerformance: algorithmPerf,
            variantCountAnalysis: variantAnalysis,
            recentPatterns: recentTests
          },
          context: 'Optimize future A/B tests based on historical performance'
        }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      setLastUpdated(new Date());
      toast.success('AI recommendations generated successfully');
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'algorithm': return '🧮';
      case 'variants': return '🔀';
      case 'subject_lines': return '✉️';
      case 'timing': return '⏰';
      default: return '💡';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-700/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              AI-Powered Test Recommendations
            </CardTitle>
            <CardDescription className="text-slate-400">
              Data-driven insights from historical test performance
            </CardDescription>
          </div>
          <Button
            onClick={fetchRecommendations}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-purple-700/50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-slate-500 mt-2">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading && recommendations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No recommendations available yet</p>
            <p className="text-sm text-slate-500 mt-2">Complete more tests to generate insights</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-purple-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(rec.category)}</span>
                    <div>
                      <h3 className="text-white font-semibold">{rec.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getImpactColor(rec.impact)}>
                          {rec.impact.toUpperCase()} IMPACT
                        </Badge>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                          {rec.category.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-lg font-bold text-white">
                      {Math.round(rec.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 mb-3">{rec.recommendation}</p>
                <div className="p-3 bg-slate-800/50 border border-slate-700/30 rounded">
                  <p className="text-sm text-slate-400">
                    <span className="font-semibold text-purple-400">Why this works:</span> {rec.reasoning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
