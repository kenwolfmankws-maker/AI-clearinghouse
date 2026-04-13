import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { UsageChart } from './UsageChart';
import { ModelPopularity } from './ModelPopularity';
import { SuccessRateChart } from './SuccessRateChart';
import { CostAnalysis } from './CostAnalysis';
import { AnalyticsFilters } from './AnalyticsFilters';
import { ExportOptions } from './ExportOptions';
import { ScheduledReports } from './ScheduledReports';
import { PredictiveInsights } from './PredictiveInsights';
import { ApprovalWorkflowAnalytics } from './ApprovalWorkflowAnalytics';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Supabase removed: analytics data is disabled without backend.
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingData, setGeneratingData] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [modelFilter, setModelFilter] = useState('all');

  useEffect(() => {
    // Keep deterministic state
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLogs([]);
    setLoading(false);
  }, [user, dateRange, modelFilter]);

  const handleGenerateSampleData = async () => {
    setGeneratingData(true);
    try {
      // Backend removed: sample generation disabled.
      toast({
        title: 'Disabled',
        description: 'Analytics are disabled because database integration was removed.',
        variant: 'destructive',
      });
      setLogs([]);
    } finally {
      setGeneratingData(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Usage Analytics</h2>
        <ExportOptions logs={logs} dateRange={dateRange} modelFilter={modelFilter} />
      </div>

      <AnalyticsFilters
        dateRange={dateRange}
        modelFilter={modelFilter}
        onDateRangeChange={setDateRange}
        onModelFilterChange={setModelFilter}
      />

      {loading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : logs.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-700 p-12 text-center">
          <p className="text-slate-400 mb-4">
            Analytics are disabled because authentication/database integration was removed.
          </p>
          <Button onClick={handleGenerateSampleData} disabled={generatingData}>
            {generatingData ? 'Generating...' : 'Generate Sample Data'}
          </Button>
        </Card>
      ) : (
        <>
          <PredictiveInsights logs={logs} dateRange={dateRange} />
          <ScheduledReports />
          <div className="grid gap-6">
            <UsageChart logs={logs} dateRange={dateRange} />
            <div className="grid md:grid-cols-2 gap-6">
              <ModelPopularity logs={logs} />
              <SuccessRateChart logs={logs} />
            </div>
            <CostAnalysis logs={logs} />
          </div>
          <ApprovalWorkflowAnalytics />
        </>
      )}
    </div>
  );
}
