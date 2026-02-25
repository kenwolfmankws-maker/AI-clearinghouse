import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getInvitationByToken, acceptInvitation, declineInvitation } from '@/lib/invitationService';
import { Building2, Mail, UserCheck, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      const data = await getInvitationByToken(token!);
      
      if (data.status !== 'pending') {
        setError('This invitation is no longer valid');
      } else if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
      } else {
        setInvitation(data);
      }
    } catch (err: any) {
      setError('Invalid invitation link');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      toast({ 
        title: 'Login Required', 
        description: 'Please log in to accept this invitation',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      await acceptInvitation(token!);
      toast({ 
        title: 'Success!', 
        description: `You've joined ${invitation.organizations.name}` 
      });
      navigate('/organization');
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      await declineInvitation(token!);
      toast({ title: 'Invitation declined' });
      navigate('/');
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <Building2 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">You're Invited!</h1>
          <p className="text-gray-600">
            You've been invited to join an organization on AI Clearinghouse
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Building2 className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Organization</p>
              <p className="font-semibold">{invitation?.organizations?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <UserCheck className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-semibold capitalize">{invitation?.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Invited Email</p>
              <p className="font-semibold">{invitation?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Expires</p>
              <p className="font-semibold">
                {new Date(invitation?.expires_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {!user && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You need to be logged in to accept this invitation. Please log in or create an account.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={handleAccept} 
            disabled={processing || !user}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Accept Invitation
          </Button>
          <Button 
            onClick={handleDecline} 
            variant="outline"
            disabled={processing}
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Decline
          </Button>
        </div>
      </Card>
    </div>
  );
}
