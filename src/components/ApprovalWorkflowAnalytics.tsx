import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, AlertTriangle, Users, CheckCircle, XCircle, ArrowUpCircle } from 'lucide-react';

interface ApprovalTimeData {
  chain_name: string;
  level_number: number;
  level_name: string;
  total_approvals: number;
  avg_hours_to_approve: number;
  min_hours: number;
  max_hours: number;
}

interface ApproverPerformance {
  approver_email: string;
  approvals: number;
  rejections: number;
  total_decisions: number;
  approval_rate: number;
  avg_response_hours: number;
}

interface EscalationMetric {
  chain_name: string;
  total_escalations: number;
  escalated_and_approved: number;
  escalated_and_rejected: number;
  escalated_pending: number;
}

interface DelegationUsage {
  approver_email: string;
  total_delegations: number;
  total_days_delegated: number;
  active_delegations: number;
}

interface Bottleneck {
  level_name: string;
  chain_name: string;
  pending_count: number;
  avg_wait_hours: number;
  max_wait_hours: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ApprovalWorkflowAnalytics() {

  const [approvalTimes, setApprovalTimes] = useState<ApprovalTimeData[]>([]);
  const [approverPerf, setApproverPerf] = useState<ApproverPerformance[]>([]);
  const [escalations, setEscalations] = useState<EscalationMetric[]>([]);
  const [delegations, setDelegations] = useState<DelegationUsage[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [timesRes, perfRes, escRes, delRes, botRes] = await Promise.all([
        supabase.from('approval_time_by_level').select('*'),
        supabase.from('approver_performance').select('*'),
        supabase.from('escalation_metrics').select('*'),
        supabase.from('delegation_usage').select('*'),
        supabase.from('approval_bottlenecks').select('*')
      ]);

      if (timesRes.data) setApprovalTimes(timesRes.data);
      if (perfRes.data) setApproverPerf(perfRes.data);
      if (escRes.data) setEscalations(escRes.data);
      if (delRes.data) setDelegations(delRes.data);
      if (botRes.data) setBottlenecks(botRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = () => {
    const recs = [];
    
    // Check for bottlenecks
    const criticalBottlenecks = bottlenecks.filter(b => b.avg_wait_hours > 48);
    if (criticalBottlenecks.length > 0) {
      recs.push({
        type: 'warning',
        title: 'Approval Bottlenecks Detected',
        description: `${criticalBottlenecks.length} level(s) have average wait times over 48 hours. Consider adding more approvers or enabling delegation.`
      });
    }

    // Check approval rates
    const lowApprovalRates = approverPerf.filter(a => a.approval_rate < 50 && a.total_decisions > 5);
    if (lowApprovalRates.length > 0) {
      recs.push({
        type: 'info',
        title: 'Low Approval Rates',
        description: `${lowApprovalRates.length} approver(s) have approval rates below 50%. Review rejection reasons to improve template quality.`
      });
    }

    // Check escalation frequency
    const highEscalations = escalations.filter(e => e.total_escalations > 10);
    if (highEscalations.length > 0) {
      recs.push({
        type: 'warning',
        title: 'High Escalation Frequency',
        description: `${highEscalations.length} chain(s) have high escalation rates. Review approval timeouts and chain complexity.`
      });
    }

    return recs;
  };

  const recommendations = getRecommendations();

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Approval Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvalTimes.length > 0
                ? `${(approvalTimes.reduce((sum, t) => sum + t.avg_hours_to_approve, 0) / approvalTimes.length).toFixed(1)}h`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Escalations</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {escalations.reduce((sum, e) => sum + e.total_escalations, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Bottlenecks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bottlenecks.filter(b => b.avg_wait_hours > 24).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Delegations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {delegations.reduce((sum, d) => sum + d.active_delegations, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, idx) => (
              <Alert key={idx} variant={rec.type === 'warning' ? 'destructive' : 'default'}>
                <AlertDescription>
                  <strong>{rec.title}:</strong> {rec.description}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="times" className="space-y-4">
        <TabsList>
          <TabsTrigger value="times">Approval Times</TabsTrigger>
          <TabsTrigger value="performance">Approver Performance</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="escalations">Escalations</TabsTrigger>
        </TabsList>

        <TabsContent value="times" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Approval Time by Level</CardTitle>
              <CardDescription>Time taken to approve at each level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={approvalTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level_name" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_hours_to_approve" fill="#3b82f6" name="Avg Hours" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approver Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approverPerf.map((perf, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{perf.approver_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {perf.total_decisions} decisions • Avg response: {perf.avg_response_hours.toFixed(1)}h
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3" /> {perf.approvals}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="h-3 w-3" /> {perf.rejections}
                      </Badge>
                      <Badge>{perf.approval_rate}% approved</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Bottlenecks</CardTitle>
              <CardDescription>Levels with longest wait times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bottlenecks.map((bot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{bot.level_name} - {bot.chain_name}</p>
                      <p className="text-sm text-muted-foreground">{bot.pending_count} pending requests</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{bot.avg_wait_hours.toFixed(1)}h</p>
                      <p className="text-sm text-muted-foreground">avg wait</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escalation Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={escalations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="chain_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="escalated_and_approved" fill="#10b981" name="Approved" />
                  <Bar dataKey="escalated_and_rejected" fill="#ef4444" name="Rejected" />
                  <Bar dataKey="escalated_pending" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={loadAnalytics} variant="outline">Refresh Analytics</Button>
    </div>
  );
}
