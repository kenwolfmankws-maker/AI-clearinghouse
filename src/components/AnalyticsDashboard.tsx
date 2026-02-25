import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { generateSampleData } from '@/lib/analyticsLogger';
import { useToast } from '@/hooks/use-toast';



export function AnalyticsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingData, setGeneratingData] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [modelFilter, setModelFilter] = useState('all');


  useEffect(() => {
    if (user) fetchLogs();
  }, [user, dateRange, modelFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    const startDate = getStartDate(dateRange);
    
    let query = supabase
      .from('api_call_logs')
      .select('*')
      .eq('user_id', user?.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (modelFilter !== 'all') {
      query = query.eq('model_provider', modelFilter);
    }

    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  };

  const getStartDate = (range: string) => {
    const now = new Date();
    switch (range) {
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Model', 'Provider', 'Status', 'Response Time (ms)', 'Cost ($)'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.model_name,
      log.model_provider,
      log.status,
      log.response_time || 'N/A',
      log.cost || '0.00'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-analytics-${Date.now()}.csv`;
    a.click();
  };

  const handleGenerateSampleData = async () => {
    if (!user?.id) return;
    setGeneratingData(true);
    try {
      await generateSampleData(user.id, 50);
      toast({ title: 'Success', description: 'Sample data generated successfully' });
      await fetchLogs();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate sample data', variant: 'destructive' });
    }
    setGeneratingData(false);
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
          <p className="text-slate-400 mb-4">No analytics data yet. Generate sample data to see the dashboard in action.</p>
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
        </>

      )}

    </div>
  );
}
