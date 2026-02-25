import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, Shield, Clock, TrendingUp, AlertTriangle, CheckCircle2, Download, FileText, BarChart3 } from 'lucide-react';
import { RotationCalendar } from './RotationCalendar';
import { GracePeriodStats } from './GracePeriodStats';
import { RotationAuditChart } from './RotationAuditChart';
import { ReportScheduleManager } from './ReportScheduleManager';
import { RotationReportHistoryDashboard } from './RotationReportHistoryDashboard';
import { generateCSVReport, downloadCSV, generateComplianceReport } from '@/lib/apiKeyRotationReportService';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';



export function APIKeyRotationAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [policiesRes, historyRes, auditRes] = await Promise.all([
      supabase.from('api_key_rotation_policies').select('*').eq('user_id', user?.id),
      supabase.from('api_key_rotation_history').select('*').eq('user_id', user?.id).order('rotated_at', { ascending: false }),
      supabase.from('api_key_rotation_audit').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(100)
    ]);
    
    setPolicies(policiesRes.data || []);
    setHistory(historyRes.data || []);
    setAuditLogs(auditRes.data || []);
    setLoading(false);
  };

  const complianceRate = policies.length > 0 
    ? (policies.filter(p => p.rotation_enabled).length / policies.length * 100).toFixed(1)
    : 0;

  const handleExportCSV = () => {
    const csv = generateCSVReport(policies);
    downloadCSV(csv, `api-key-rotation-report-${new Date().toISOString().split('T')[0]}.csv`);
    toast({ title: 'Report exported successfully' });
  };

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">API Key Rotation Analytics</h2>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview & Analytics</TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="w-4 h-4 mr-2" />
            Report History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{policies.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceRate}%</div>
              </CardContent>
            </Card>
          </div>

          <ReportScheduleManager />
          <RotationCalendar policies={policies} />
          <GracePeriodStats history={history} />
          <RotationAuditChart auditLogs={auditLogs} />
        </TabsContent>

        <TabsContent value="reports">
          <RotationReportHistoryDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );

}

