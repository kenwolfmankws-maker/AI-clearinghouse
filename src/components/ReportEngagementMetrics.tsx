import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye, Download, Mail } from 'lucide-react';

interface ReportEngagementMetricsProps {
  reports: any[];
  onReportClick: (report: any) => void;
}

export function ReportEngagementMetrics({ reports, onReportClick }: ReportEngagementMetricsProps) {
  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
        <p className="text-sm text-muted-foreground">
          Detailed report history with engagement metrics
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Generated</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Violations</TableHead>
              <TableHead>Expiring</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.slice(0, 10).map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">
                  {format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{report.report_format?.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{report.recipients?.length || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getComplianceColor(report.compliance_rate || 0)}`} />
                    <span>{report.compliance_rate?.toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={report.policy_violations > 0 ? 'destructive' : 'secondary'}>
                    {report.policy_violations || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={report.keys_expiring_soon > 0 ? 'default' : 'secondary'}>
                    {report.keys_expiring_soon || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onReportClick(report)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
