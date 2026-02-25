import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIUsageTracker, APIUsageRecord } from '@/lib/apiUsageTracker';
import { Activity, DollarSign, Clock, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { ExportOptions } from './ExportOptions';
import { ScheduledReports } from './ScheduledReports';
import { AnalyticsFilters } from './AnalyticsFilters';
import { APIAnalyticsExporter, ExportFilters } from '@/lib/apiAnalyticsExport';
import { UsageChart } from './UsageChart';
import { CostAnalysis } from './CostAnalysis';
import { SuccessRateChart } from './SuccessRateChart';
import { PredictiveInsights } from './PredictiveInsights';
import { RealTimeAlertConfig } from './RealTimeAlertConfig';
import { AlertHistory } from './AlertHistory';



export function APIUsageDashboard() {
  const [usageStats, setUsageStats] = useState<APIUsageRecord[]>([]);
  const [filteredStats, setFilteredStats] = useState<APIUsageRecord[]>([]);
  const [activeFilters, setActiveFilters] = useState<ExportFilters>({});
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');


  useEffect(() => {
    loadUsageStats();
    const interval = setInterval(loadUsageStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Object.keys(activeFilters).length === 0) {
      setFilteredStats(usageStats);
    } else {
      setFilteredStats(APIAnalyticsExporter.filterRecords(usageStats, activeFilters));
    }
  }, [usageStats, activeFilters]);

  const loadUsageStats = () => {
    setUsageStats(APIUsageTracker.getUsageStats());
  };

  const handleFilterChange = (filters: ExportFilters) => {
    setActiveFilters(filters);
  };

  const availableKeys = usageStats.map(s => s.keyName);
  const availableComponents = Array.from(
    new Set(usageStats.flatMap(s => Object.keys(s.componentUsage)))
  );


  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatDate = (date: string) => new Date(date).toLocaleString();

  const totalCost = usageStats.reduce((sum, stat) => sum + stat.estimatedCost, 0);
  const totalCalls = usageStats.reduce((sum, stat) => sum + stat.accessCount, 0);

  const getAlertLevel = (record: APIUsageRecord) => {
    if (!record.rateLimit) return null;
    const usage = (record.accessCount / record.rateLimit) * 100;
    if (usage > 90) return 'critical';
    if (usage > 80) return 'warning';
    return null;
  };

  // Generate aggregated data for charts
  const aggregatedData = APIUsageTracker.getAggregatedData(filteredStats, timePeriod);



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">API Usage Analytics</h2>
        <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(totalCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.length}</div>
          </CardContent>
        </Card>
      </div>

      {aggregatedData.length > 0 && (
        <>
          <UsageChart data={aggregatedData} />
          <div className="grid gap-6 md:grid-cols-2">
            <CostAnalysis data={aggregatedData} />
            <SuccessRateChart data={aggregatedData} />
          </div>
        </>
      )}


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                API Key Usage Details
              </CardTitle>
              <CardDescription>Track usage, costs, and rate limits for each API key</CardDescription>
            </div>
            <ExportOptions />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {usageStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No API usage tracked yet</p>
          ) : (
            usageStats.map((stat) => {
              const alertLevel = getAlertLevel(stat);
              const usagePercent = stat.rateLimit ? (stat.accessCount / stat.rateLimit) * 100 : 0;

              return (
                <Card key={stat.keyName} className={alertLevel === 'critical' ? 'border-red-500' : ''}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {stat.keyName}
                          {alertLevel && (
                            <Badge variant={alertLevel === 'critical' ? 'destructive' : 'secondary'}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {alertLevel === 'critical' ? 'Critical' : 'Warning'}
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Last used: {formatDate(stat.lastAccessed)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stat.accessCount}</div>
                        <p className="text-xs text-muted-foreground">calls</p>
                      </div>
                    </div>

                    {stat.rateLimit && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Rate Limit Usage</span>
                          <span>{stat.accessCount} / {stat.rateLimit}</span>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatCost(stat.estimatedCost)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          APIUsageTracker.resetUsage(stat.keyName);
                          loadUsageStats();
                        }}
                      >
                        Reset
                      </Button>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium mb-2">Component Usage:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(stat.componentUsage).map(([component, count]) => (
                          <Badge key={component} variant="outline" className="text-xs">
                            {component}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>


      <ScheduledReports />
        </div>

        <div className="space-y-6">
          <AnalyticsFilters
            onFilterChange={handleFilterChange}
            availableKeys={availableKeys}
            availableComponents={availableComponents}
          />
          
          <RealTimeAlertConfig />
          
          <AlertHistory />
          
          {aggregatedData.length > 0 && (
            <PredictiveInsights data={aggregatedData} />
          )}
        </div>


      </div>
    </div>
  );
}

