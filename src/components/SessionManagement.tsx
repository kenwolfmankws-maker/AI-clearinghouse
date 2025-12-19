import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, MapPin, Clock, Shield, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Session {
  id: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  location: string;
  is_current: boolean;
  last_activity: string;
  created_at: string;
  expires_at: string;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.functions.invoke('revoke-session', {
        body: { sessionId, userId: user.id, revokeAll: false }
      });

      if (error) throw error;

      toast({
        title: 'Session revoked',
        description: 'The session has been terminated successfully.'
      });

      loadSessions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke session',
        variant: 'destructive'
      });
    }
  };

  const revokeAllSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentSession = sessions.find(s => s.is_current);

      const { error } = await supabase.functions.invoke('revoke-session', {
        body: { 
          userId: user.id, 
          revokeAll: true,
          currentSessionToken: currentSession?.id
        }
      });

      if (error) throw error;

      toast({
        title: 'All sessions revoked',
        description: 'All other sessions have been terminated.'
      });

      loadSessions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke sessions',
        variant: 'destructive'
      });
    }
  };

  const getDeviceIcon = (os: string) => {
    if (os.includes('Android') || os.includes('iOS')) return Smartphone;
    if (os.includes('iPad')) return Tablet;
    return Monitor;
  };

  if (loading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage your active login sessions across devices</CardDescription>
          </div>
          {sessions.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Revoke All Other Sessions
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke all other sessions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out from all devices except this one. You'll need to sign in again on those devices.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={revokeAllSessions}>Revoke All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => {
          const DeviceIcon = getDeviceIcon(session.os);
          return (
            <div key={session.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DeviceIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.browser} on {session.os}</p>
                    {session.is_current && (
                      <Badge variant="secondary" className="text-xs">Current Session</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {session.ip_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.ip_address}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last active: {new Date(session.last_activity).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(session.expires_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {!session.is_current && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeSession(session.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
