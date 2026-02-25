import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';

interface PredictiveInsightsProps {
  data: Array<{ date: string; calls: number; cost: number; violations: number }>;
}

export function PredictiveInsights({ data }: PredictiveInsightsProps) {
  if (data.length < 3) {
    return null;
  }

  const recentData = data.slice(-7);
  const avgCalls = recentData.reduce((sum, d) => sum + d.calls, 0) / recentData.length;
  const avgCost = recentData.reduce((sum, d) => sum + d.cost, 0) / recentData.length;
  
  const trend = recentData.length > 1 
    ? ((recentData[recentData.length - 1].calls - recentData[0].calls) / recentData[0].calls) * 100
    : 0;

  const insights = [];

  if (trend > 20) {
    insights.push({
      type: 'warning',
      title: 'Increasing Usage Trend',
      message: `API calls increased by ${trend.toFixed(1)}% recently. Monitor for potential rate limit issues.`,
    });
  }

  if (avgCost * 30 > 100) {
    insights.push({
      type: 'info',
      title: 'High Cost Projection',
      message: `Projected monthly cost: $${(avgCost * 30).toFixed(2)}. Consider optimizing API usage.`,
    });
  }

  const totalViolations = data.reduce((sum, d) => sum + d.violations, 0);
  if (totalViolations > 0) {
    insights.push({
      type: 'error',
      title: 'Rate Limit Violations Detected',
      message: `${totalViolations} violations found. Implement caching or request throttling.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'success',
      title: 'Healthy API Usage',
      message: 'No issues detected. Usage patterns are within normal ranges.',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Predictive Insights
        </CardTitle>
        <CardDescription>AI-powered recommendations based on usage patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
            {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />}
            {insight.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />}
            {insight.type === 'info' && <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />}
            {insight.type === 'success' && <Lightbulb className="h-5 w-5 text-green-500 mt-0.5" />}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{insight.title}</h4>
                <Badge variant={insight.type === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                  {insight.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{insight.message}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
