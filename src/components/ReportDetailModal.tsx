import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { AlertCircle, Clock, CheckCircle, Mail } from 'lucide-react';

interface ReportDetailModalProps {
  report: any;
  onClose: () => void;
}

export function ReportDetailModal({ report, onClose }: ReportDetailModalProps) {
  const violations = report.report_data?.violations || [];
  const expiringKeys = report.report_data?.expiring_keys || [];
  const compliantKeys = report.report_data?.compliant_keys || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Generated</p>
                    <p className="font-medium">{format(new Date(report.generated_at), 'PPpp')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <Badge>{report.report_format?.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Compliance Rate</p>
                    <p className="font-medium text-lg">{report.compliance_rate?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recipients</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{report.recipients?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Policy Violations ({violations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {violations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No violations found</p>
                ) : (
                  <div className="space-y-2">
                    {violations.map((v: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{v.key_name}</p>
                            <p className="text-sm text-muted-foreground">{v.violation_type}</p>
                          </div>
                          <Badge variant="destructive">{v.severity}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Expiring Keys ({expiringKeys.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No keys expiring soon</p>
                ) : (
                  <div className="space-y-2">
                    {expiringKeys.map((k: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{k.key_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Expires: {format(new Date(k.expires_at), 'PPP')}
                            </p>
                          </div>
                          <Badge variant="outline">{k.days_until_expiry} days</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Compliant Keys ({compliantKeys.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {compliantKeys.length} keys are fully compliant with rotation policies
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
