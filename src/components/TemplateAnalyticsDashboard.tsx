import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, TrendingUp, Clock, CheckCircle, Target, RefreshCw, Download, FileSpreadsheet, FileText, Mail } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToExcel } from '@/lib/templateAnalyticsExport';
import { CalendarIcon } from 'lucide-react';
import { ScheduledReports } from './ScheduledReports';


interface TemplateAnalytics {
  template_id: string;
  template_name: string;
  category: string;
  times_used: number;
  acceptances: number;
  acceptance_rate: number;
  avg_time_to_accept_hours: number;
  last_used_at: string;
}

interface CategoryStats {
  category: string;
  total_uses: number;
  avg_acceptance_rate: number;
}

export function TemplateAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<TemplateAnalytics[]>([]);
  const [allAnalytics, setAllAnalytics] = useState<TemplateAnalytics[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('usage');
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const { toast } = useToast();


  useEffect(() => {
    loadAnalytics();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('template-analytics')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'invitation_template_usage' },
        () => loadAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterByDateRange();
  }, [dateFrom, dateTo, allAnalytics]);

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('invitation_template_analytics')
        .select('*')
        .order('times_used', { ascending: false });

      if (error) throw error;
      setAllAnalytics(data || []);
      setAnalytics(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading analytics',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterByDateRange = async () => {
    if (!dateFrom && !dateTo) {
      setAnalytics(allAnalytics);
      return;
    }

    try {
      let query = supabase
        .from('invitation_template_usage')
        .select('template_id, templates:invitation_templates(name, category), created_at, accepted_at, status');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate the filtered data
      const aggregated = new Map<string, any>();
      data?.forEach((usage: any) => {
        const templateId = usage.template_id;
        const existing = aggregated.get(templateId) || {
          template_id: templateId,
          template_name: usage.templates?.name || 'Unknown',
          category: usage.templates?.category || 'Unknown',
          times_used: 0,
          acceptances: 0,
          acceptance_rate: 0,
          avg_time_to_accept_hours: 0,
          total_hours: 0,
          last_used_at: usage.created_at
        };

        existing.times_used++;
        if (usage.status === 'accepted' && usage.accepted_at) {
          existing.acceptances++;
          const hours = (new Date(usage.accepted_at).getTime() - new Date(usage.created_at).getTime()) / (1000 * 60 * 60);
          existing.total_hours += hours;
        }
        if (new Date(usage.created_at) > new Date(existing.last_used_at)) {
          existing.last_used_at = usage.created_at;
        }

        aggregated.set(templateId, existing);
      });

      const result = Array.from(aggregated.values()).map(t => ({
        ...t,
        acceptance_rate: t.times_used > 0 ? (t.acceptances / t.times_used) * 100 : 0,
        avg_time_to_accept_hours: t.acceptances > 0 ? t.total_hours / t.acceptances : 0
      }));

      setAnalytics(result);
    } catch (err: any) {
      toast({
        title: 'Error filtering analytics',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredAnalytics, categoryStats, { from: dateFrom, to: dateTo });
    toast({
      title: 'Export successful',
      description: 'CSV file has been downloaded'
    });
  };

  const handleExportExcel = () => {
    exportToExcel(filteredAnalytics, categoryStats, { from: dateFrom, to: dateTo });
    toast({
      title: 'Export successful',
      description: 'Excel file has been downloaded'
    });
  };


  const getCategoryStats = (): CategoryStats[] => {
    const stats = new Map<string, { total: number; totalRate: number; count: number }>();
    
    analytics.forEach(t => {
      const existing = stats.get(t.category) || { total: 0, totalRate: 0, count: 0 };
      stats.set(t.category, {
        total: existing.total + t.times_used,
        totalRate: existing.totalRate + t.acceptance_rate,
        count: existing.count + 1
      });
    });

    return Array.from(stats.entries()).map(([category, data]) => ({
      category,
      total_uses: data.total,
      avg_acceptance_rate: data.count > 0 ? data.totalRate / data.count : 0
    })).sort((a, b) => b.total_uses - a.total_uses);
  };

  const filteredAnalytics = analytics
    .filter(t => categoryFilter === 'all' || t.category === categoryFilter)
    .sort((a, b) => {
      if (sortBy === 'usage') return b.times_used - a.times_used;
      if (sortBy === 'acceptance') return b.acceptance_rate - a.acceptance_rate;
      if (sortBy === 'speed') return a.avg_time_to_accept_hours - b.avg_time_to_accept_hours;
      return 0;
    });

  const categoryStats = getCategoryStats();
  const totalInvites = analytics.reduce((sum, t) => sum + t.times_used, 0);
  const totalAcceptances = analytics.reduce((sum, t) => sum + t.acceptances, 0);
  const overallRate = totalInvites > 0 ? (totalAcceptances / totalInvites * 100).toFixed(2) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Template Analytics</h2>
          <div className="flex gap-2">
            <Button onClick={loadAnalytics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Export Row */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Date Range:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                  </PopoverContent>
                </Popover>
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                    Clear
                  </Button>
                )}
              </div>
              <div className="ml-auto flex gap-2">
                <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={filteredAnalytics.length === 0}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={handleExportExcel} variant="outline" size="sm" disabled={filteredAnalytics.length === 0}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvites}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats[0]?.category || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      {categoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryStats.map(stat => (
                <div key={stat.category} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{stat.category}</Badge>
                    <span className="text-sm text-muted-foreground">{stat.total_uses} uses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stat.avg_acceptance_rate.toFixed(1)}% avg acceptance</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Template Performance</CardTitle>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usage">Most Used</SelectItem>
                  <SelectItem value="acceptance">Best Rate</SelectItem>
                  <SelectItem value="speed">Fastest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAnalytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No analytics data available yet. Start sending invitations with templates to see statistics.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnalytics.map(template => (
                <div key={template.template_id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{template.template_name}</h4>
                      <Badge variant="secondary">{template.category}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Last used: {template.last_used_at ? new Date(template.last_used_at).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span>{template.times_used} uses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{template.acceptance_rate.toFixed(1)}% accepted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span>{template.acceptances}/{template.times_used}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>{template.avg_time_to_accept_hours > 0 ? `${template.avg_time_to_accept_hours.toFixed(1)}h avg` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      <ScheduledReports />
    </div>
  );
}

