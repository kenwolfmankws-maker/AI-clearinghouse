import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building2, BarChart } from 'lucide-react';
import { TeamAnalytics } from '@/components/TeamAnalytics';
import OrgTwoFactorPolicy from '@/components/OrgTwoFactorPolicy';
import TwoFactorComplianceDashboard from '@/components/TwoFactorComplianceDashboard';
import TwoFactorExemptionManager from '@/components/TwoFactorExemptionManager';
import { OrgMemberManagement } from '@/components/OrgMemberManagement';
import { TwoFactorReminderConfig } from '@/components/TwoFactorReminderConfig';
import { InvitationTemplateManager } from '@/components/InvitationTemplateManager';
import { TemplateAnalyticsDashboard } from '@/components/TemplateAnalyticsDashboard';
import { CronJobDashboard } from '@/components/CronJobDashboard';




export default function Organization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    const { data } = await supabase.from('organizations').select('*');
    setOrganizations(data || []);
    if (data && data.length > 0) {
      setSelectedOrg(data[0]);
      fetchMembers(data[0].id);
    }
    setLoading(false);
  };

  const fetchMembers = async (orgId: string) => {
    const { data } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', orgId);
    setMembers(data || []);
  };

  const createOrganization = async () => {
    const { data, error } = await supabase.functions.invoke('create-organization', {
      body: { name: newOrgName, description: newOrgDesc }
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Organization created' });
      fetchOrganizations();
      setNewOrgName('');
      setNewOrgDesc('');
    }
  };


  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="w-8 h-8" />
          Organizations
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Create Organization</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={newOrgDesc} onChange={(e) => setNewOrgDesc(e.target.value)} />
              </div>
              <Button onClick={createOrganization}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedOrg?.id} onValueChange={(id) => {
        const org = organizations.find(o => o.id === id);
        setSelectedOrg(org);
        fetchMembers(id);
      }}>
        <TabsList>
          {organizations.map(org => (
            <TabsTrigger key={org.id} value={org.id}>{org.name}</TabsTrigger>
          ))}
        </TabsList>

        {organizations.map(org => (
          <TabsContent key={org.id} value={org.id}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="templates">Invitation Templates</TabsTrigger>
                <TabsTrigger value="template-analytics">Template Analytics</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>


              <TabsContent value="members">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">{org.name}</h2>
                  <p className="text-gray-600 mb-6">{org.description}</p>
                  
                  <OrgMemberManagement
                    organizationId={org.id}
                    organizationName={org.name}
                    userRole={members.find(m => m.user_id === user?.id)?.role || 'viewer'}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="templates">
                <InvitationTemplateManager organizationId={org.id} />
              </TabsContent>


              <TabsContent value="template-analytics">
                <Card className="p-6">
                  <TemplateAnalyticsDashboard />
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <div className="space-y-6">
                  <OrgTwoFactorPolicy />
                  
                  <TwoFactorReminderConfig orgId={org.id} />
                  
                  <CronJobDashboard />
                  
                  <TwoFactorComplianceDashboard />
                  
                  <TwoFactorExemptionManager />
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <TeamAnalytics members={members} usageData={usageData} />
              </TabsContent>


            </Tabs>

          </TabsContent>
        ))}
      </Tabs>

    </div>
  );
}
