import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, AlertCircle, CheckCircle, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComplianceStats {
  total_members: number;
  members_with_2fa: number;
  members_without_2fa: number;
  members_with_exemption: number;
  compliance_rate: number;
  in_grace_period: number;
}

interface UserCompliance {
  user_id: string;
  email: string;
  has_2fa: boolean;
  has_exemption: boolean;
  in_grace_period: boolean;
  created_at: string;
}

export default function TwoFactorComplianceDashboard() {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [users, setUsers] = useState<UserCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const { toast } = useToast();

  const organizationId = 'default-org';

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_org_2fa_compliance_stats', { org_id: organizationId });

      if (statsError) throw statsError;
      setStats(statsData[0]);

      const { data: usersData, error: usersError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('is_active', true);

      if (usersError) throw usersError;

      const userPromises = usersData.map(async (u: any) => {
        const { data: twoFactorData } = await supabase
          .from('user_two_factor')
          .select('is_enabled')
          .eq('user_id', u.user_id)
          .single();

        const { data: exemptionData } = await supabase
          .from('two_factor_exemptions')
          .select('id')
          .eq('user_id', u.user_id)
          .eq('organization_id', organizationId)
          .single();

        return {
          user_id: u.user_id,
          email: 'user@example.com',
          has_2fa: twoFactorData?.is_enabled || false,
          has_exemption: !!exemptionData,
          in_grace_period: false,
          created_at: '',
        };
      });

      const resolvedUsers = await Promise.all(userPromises);
      setUsers(resolvedUsers);
    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReminders = async () => {
    setSendingReminders(true);
    try {
      const usersWithout2FA = users.filter(u => !u.has_2fa && !u.has_exemption);
      
      for (const user of usersWithout2FA) {
        await supabase.from('two_factor_compliance_log').insert({
          organization_id: organizationId,
          user_id: user.user_id,
          event_type: 'reminder_sent',
          details: { sent_by: (await supabase.auth.getUser()).data.user?.id },
        });
      }

      toast({
        title: 'Success',
        description: `Sent reminders to ${usersWithout2FA.length} users`,
      });
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reminders',
        variant: 'destructive',
      });
    } finally {
      setSendingReminders(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_members || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.compliance_rate || 0}%</div>
            <Progress value={stats?.compliance_rate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Without 2FA</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.members_without_2fa || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grace Period</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.in_grace_period || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Compliance Status</CardTitle>
              <CardDescription>Overview of 2FA status for all members</CardDescription>
            </div>
            <Button onClick={sendReminders} disabled={sendingReminders}>
              <Send className="mr-2 h-4 w-4" />
              Send Reminders
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  {user.has_2fa ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.has_2fa ? '2FA Enabled' : 'No 2FA'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.has_exemption && <Badge variant="secondary">Exempt</Badge>}
                  {user.in_grace_period && <Badge variant="outline">Grace Period</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}