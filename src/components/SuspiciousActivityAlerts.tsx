import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Activity } from "lucide-react";

interface SuspiciousPattern {
  pattern_type: string;
  identifier: string;
  attempt_count: number;
  first_attempt: string;
  last_attempt: string;
  risk_level: string;
}

interface Props {
  patterns: SuspiciousPattern[];
}

export function SuspiciousActivityAlerts({ patterns }: Props) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getIcon = (level: string) => {
    return level === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Suspicious Activity Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {patterns.length === 0 ? (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>All Clear</AlertTitle>
            <AlertDescription>No suspicious patterns detected in the last 24 hours.</AlertDescription>
          </Alert>
        ) : (
          patterns.map((pattern, idx) => (
            <Alert key={idx} variant={getRiskColor(pattern.risk_level) as any}>
              {getIcon(pattern.risk_level)}
              <AlertTitle className="flex items-center gap-2">
                {pattern.pattern_type === 'high_frequency_email' ? 'High Frequency Email' : 'High Frequency IP'}
                <Badge variant={getRiskColor(pattern.risk_level) as any}>{pattern.risk_level.toUpperCase()}</Badge>
              </AlertTitle>
              <AlertDescription>
                <div className="font-mono text-sm">{pattern.identifier}</div>
                <div className="text-xs mt-1">
                  {pattern.attempt_count} attempts | Last: {new Date(pattern.last_attempt).toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  );
}