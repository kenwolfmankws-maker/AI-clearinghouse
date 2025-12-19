import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap } from 'lucide-react';

interface LiveTrafficAllocationProps {
  testId: string;
}

export function LiveTrafficAllocation({ testId }: LiveTrafficAllocationProps) {
  const [variants, setVariants] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`traffic-${testId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'digest_ab_variants', filter: `test_id=eq.${testId}` },
        () => loadData()
      )
      .subscribe();

    const interval = setInterval(loadData, 5000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [testId]);

  const loadData = async () => {
    const { data } = await supabase
      .from('digest_ab_variants')
      .select('*')
      .eq('test_id', testId)
      .order('traffic_allocation', { ascending: false });

    setVariants(data || []);

    // Load actual allocation from results
    const { data: results } = await supabase
      .from('digest_ab_results')
      .select('variant_id, digests_sent')
      .eq('test_id', testId);

    const total = results?.reduce((sum, r) => sum + (r.digests_sent || 0), 0) || 0;
    const allocs = results?.map(r => ({
      variantId: r.variant_id,
      actual: total > 0 ? (r.digests_sent || 0) / total : 0
    })) || [];

    setAllocations(allocs);
  };

  const getActualAllocation = (variantId: string) => {
    return allocations.find(a => a.variantId === variantId)?.actual || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Live Traffic Allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.map((variant) => {
          const targetAllocation = variant.traffic_allocation || 0;
          const actualAllocation = getActualAllocation(variant.id);
          const diff = actualAllocation - targetAllocation;

          return (
            <div key={variant.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{variant.name}</span>
                  {Math.abs(diff) > 0.05 && (
                    <Badge variant="outline" className="text-xs">
                      {diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: {(targetAllocation * 100).toFixed(1)}% | 
                  Actual: {(actualAllocation * 100).toFixed(1)}%
                </div>
              </div>
              <div className="relative">
                <Progress value={targetAllocation * 100} className="h-2 bg-muted" />
                <div 
                  className="absolute top-0 h-2 bg-green-500/50 rounded-full transition-all duration-500"
                  style={{ width: `${actualAllocation * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
