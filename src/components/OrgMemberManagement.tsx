import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, UserMinus, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  granted_at: string;
  revoked_at: string | null;
  is_active: boolean;
  notes: string | null;
}

export function OrgMemberManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('granted_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGrantAccess(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('grant_admin_access', {
        target_email: newAdminEmail,
        admin_notes: notes || null,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        });
        setNewAdminEmail('');
        setNotes('');
        loadAdmins();
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevokeAccess() {
    if (!revokeTarget) return;

    try {
      const { data, error } = await supabase.rpc('revoke_admin_access', {
        target_user_id: revokeTarget.user_id,
        revocation_reason: 'Revoked by admin',
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        });
        loadAdmins();
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRevokeTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Grant Admin Access
          </CardTitle>
          <CardDescription>
            Add a new administrator by entering their email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGrantAccess} className="space-y-4">
            <div>
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for granting admin access..."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Granting...' : 'Grant Admin Access'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Users ({admins.filter(a => a.is_active).length})
          </CardTitle>
          <CardDescription>
            Manage administrator access and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : admins.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No admin users found</p>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{admin.email}</p>
                      {admin.is_active ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          Revoked
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Granted {new Date(admin.granted_at).toLocaleDateString()}
                      </span>
                      {admin.revoked_at && (
                        <span>Revoked {new Date(admin.revoked_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    {admin.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{admin.notes}</p>
                    )}
                  </div>
                  {admin.is_active && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRevokeTarget(admin)}
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke admin access for {revokeTarget?.email}? This action
              will immediately remove their administrative privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeAccess}>Revoke Access</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
