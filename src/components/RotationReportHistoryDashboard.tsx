import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { ComplianceTrendChart } from './ComplianceTrendChart';
import { ViolationBreakdownChart } from './ViolationBreakdownChart';
import { ExpirationPatternChart } from './ExpirationPatternChart';
import { ReportEngagementMetrics } from './ReportEngagementMetrics';
import { ReportHistoryFilters } from './ReportHistoryFilters';
import { ReportDetailModal } from './ReportDetailModal';
import { AlertCircle, TrendingUp, FileText, Users } from 'lucide-react';

export function RotationReportHistoryDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportHistory();
  }, []);

  const loadReportHistory = async () => {
    const { data, error } = await supabase
      .from('api_key_rotation_report_history')
      .select('*')
      .order('generated_at', { ascending: false });

    if (!error && data) {
      setReports(data);
      setFilteredReports(data);
    }
    setLoading(false);
  };

  const avgCompliance = filteredReports.length > 0
    ? (filteredReports.reduce((sum, r) => sum + (r.compliance_rate || 0), 0) / filteredReports.length).toFixed(1)
    : 0;

  const totalViolations = filteredReports.reduce((sum, r) => sum + (r.policy_violations || 0), 0);
  const totalExpiring = filteredReports.reduce((sum, r) => sum + (r.keys_expiring_soon || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Report History & Analytics</h2>
      </div>

      <ReportHistoryFilters 
        reports={reports}
        onFilterChange={setFilteredReports}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompliance}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredReports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViolations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Keys Expiring</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpiring}</div>
          </CardContent>
        </Card>
      </div>

      <ComplianceTrendChart reports={filteredReports} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ViolationBreakdownChart reports={filteredReports} />
        <ExpirationPatternChart reports={filteredReports} />
      </div>

      <ReportEngagementMetrics 
        reports={filteredReports}
        onReportClick={setSelectedReport}
      />

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
