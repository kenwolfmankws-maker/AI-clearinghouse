import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { DigestAnalyticsDashboard } from '@/components/DigestAnalyticsDashboard';
import { DigestABTestDashboard } from '@/components/DigestABTestDashboard';
import { MultiVariantTestDashboard } from '@/components/MultiVariantTestDashboard';
import DigestABTestHistory from '@/components/DigestABTestHistory';
import { AITestRecommendations } from '@/components/AITestRecommendations';
import { ScheduledTestManager } from '@/components/ScheduledTestManager';
import { RealTimeTestMonitor } from '@/components/RealTimeTestMonitor';
import { RealTimeAlertConfig } from '@/components/RealTimeAlertConfig';
import WebhookManager from '@/components/WebhookManager';
import TagAnalyticsDashboard from '@/components/TagAnalyticsDashboard';




import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';


export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const defaultTab = searchParams.get('tab') || 'overview';


  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="digests">Digest Analytics</TabsTrigger>
            <TabsTrigger value="ab-tests">A/B Tests</TabsTrigger>
            <TabsTrigger value="multivariate">Multi-Variant Tests</TabsTrigger>
            <TabsTrigger value="history">Test History</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Tests</TabsTrigger>
            <TabsTrigger value="monitoring">Live Monitor</TabsTrigger>
            <TabsTrigger value="alerts">Alert Config</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="tags">Tag Analytics</TabsTrigger>
          </TabsList>






          
          <TabsContent value="overview">
            <AnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="digests">
            <DigestAnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="ab-tests">
            <DigestABTestDashboard />
          </TabsContent>
          
          <TabsContent value="multivariate">
            <MultiVariantTestDashboard />
          </TabsContent>
          
          <TabsContent value="history">
            <DigestABTestHistory />
          </TabsContent>
          
          <TabsContent value="ai-insights">
            <AITestRecommendations />
          </TabsContent>
          
          <TabsContent value="scheduled">
            <ScheduledTestManager />
          </TabsContent>
          
          <TabsContent value="monitoring">
            <RealTimeTestMonitor />
          </TabsContent>
          
          <TabsContent value="alerts">
            <RealTimeAlertConfig />
          </TabsContent>
          
          <TabsContent value="webhooks">
            <WebhookManager />
          </TabsContent>
          
          <TabsContent value="tags">
            <TagAnalyticsDashboard />
          </TabsContent>
        </Tabs>








      </div>
      <Footer />
    </div>
  );

}
