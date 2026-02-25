import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShieldOff, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Exemption {
  id: string;
  user_id: string;
  reason: string;
  granted_by: string;
  expires_at: string | null;
  created_at: string;
  user_email?: string;
}

export default function TwoFactorExemptionManager() {
  const [exemptions, setExemptions] = useState<Exemption[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [reason, setReason] = useState('');
  const [expiresIn, setExpiresIn] = useState('never');
  const { toast } = useToast();

  const organizationId = 'default-org';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load exemptions
      const { data: exemptionsData, error: exemptionsError } = await supabase
        .from('two_factor_exemptions')
        .select('*')
        .eq('organization_id', organizationId);

      if (exemptionsError) throw exemptionsError;

      // Load user emails
      const userIds = exemptionsData?.map(e => e.user_id) || [];
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('admin_users')
          .select('user_id')
          .in('user_id', userIds);

        const enrichedExemptions = exemptionsData?.map(e => ({
          ...e,
          user_email: 'user@example.com', // Would fetch from auth.users
        }));
        setExemptions(enrichedExemptions || []);
      }

      // Load all users for dropdown
      const { data: allUsers, error: usersError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('is_active', true);

      if (usersError) throw usersError;
      setUsers(allUsers || []);
    } catch (error) {
      console.error('Error loading exemptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exemptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const grantExemption = async () => {
    if (!selectedUser || !reason) {
      toast({
        title: 'Error',
        description: 'Please select a user and provide a reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      let expiresAt = null;
      if (expiresIn !== 'never') {
        const days = parseInt(expiresIn);
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase.rpc('grant_2fa_exemption', {
        p_organization_id: organizationId,
        p_user_id: selectedUser,
        p_reason: reason,
        p_expires_at: expiresAt,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Exemption granted successfully',
      });

      setOpen(false);
      setSelectedUser('');
      setReason('');
      setExpiresIn('never');
      loadData();
    } catch (error) {
      console.error('Error granting exemption:', error);
      toast({
        title: 'Error',
        description: 'Failed to grant exemption',
        variant: 'destructive',
      });
    }
  };

  const revokeExemption = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('revoke_2fa_exemption', {
        p_organization_id: organizationId,
        p_user_id: userId,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Exemption revoked successfully',
      });

      loadData();
    } catch (error) {
      console.error('Error revoking exemption:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke exemption',
        variant: 'destructive',
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5" />
              2FA Exemptions
            </CardTitle>
            <CardDescription>Manage users exempt from 2FA requirements</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Grant Exemption
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant 2FA Exemption</DialogTitle>
                <DialogDescription>
                  Exempt a user from 2FA requirements
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          {u.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this user exempt from 2FA?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expires In</Label>
                  <Select value={expiresIn} onValueChange={setExpiresIn}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={grantExemption} className="w-full">
                  Grant Exemption
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {exemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No exemptions granted
            </p>
          ) : (
            exemptions.map((exemption) => (
              <div key={exemption.id} className="flex items-start justify-between border-b pb-3">
                <div className="space-y-1">
                  <p className="font-medium">{exemption.user_email}</p>
                  <p className="text-sm text-muted-foreground">{exemption.reason}</p>
                  <div className="flex gap-2">
                    {exemption.expires_at ? (
                      <Badge variant="outline">
                        Expires: {new Date(exemption.expires_at).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Permanent</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeExemption(exemption.user_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}