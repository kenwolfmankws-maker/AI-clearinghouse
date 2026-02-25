import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Clock, User, Calendar, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ApprovalChainProgress } from './ApprovalChainProgress';

interface ApprovalLevel {
  level_number: number;
  level_name: string;
  status: 'pending' | 'approved' | 'current' | 'escalated';
  approver_names?: string[];
  approved_by?: string;
  approved_at?: string;
}

interface ChangeRequest {
  id: string;
  template_id: string;
  change_type: string;
  requested_by: string;
  requested_at: string;
  status: string;
  proposed_name: string;
  proposed_description: string;
  current_approval_level: number;
  total_approval_levels: number;
  escalated: boolean;
  requester_email?: string;
  template_name?: string;
  approval_levels?: ApprovalLevel[];
}

export function TemplateApprovalQueueMultiLevel() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    loadChangeRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      checkApprovalPermission(selectedRequest.id);
    }
  }, [selectedRequest]);

  const checkApprovalPermission = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('is_approver_at_level', {
        p_change_request_id: requestId,
        p_user_id: user.id
      });

      if (error) throw error;
      setCanApprove(data || false);
    } catch (error) {
      setCanApprove(false);
    }
  };

  const loadChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('template_change_requests')
        .select(`
          *,
          requester:requested_by(email),
          template:report_templates(name)
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map((req: any) => ({
        ...req,
        requester_email: req.requester?.email,
        template_name: req.template?.name,
        current_approval_level: req.current_approval_level || 1,
        total_approval_levels: req.total_approval_levels || 1
      })) || [];

      setRequests(formatted);
    } catch (error: any) {
      toast.error('Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isLastLevel = selectedRequest.current_approval_level >= selectedRequest.total_approval_levels;

      // Update change request
      const updateData: any = {
        reviewer_comment: comment
      };

      if (isLastLevel) {
        // Final approval - mark as approved and apply changes
        updateData.status = 'approved';
        updateData.reviewed_by = user.id;
        updateData.reviewed_at = new Date().toISOString();
      } else {
        // Advance to next level
        updateData.current_approval_level = selectedRequest.current_approval_level + 1;
      }

      const { error: updateError } = await supabase
        .from('template_change_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Log approval
      await supabase.from('template_approval_history').insert({
        change_request_id: selectedRequest.id,
        template_id: selectedRequest.template_id,
        action: isLastLevel ? 'approved' : 'level_approved',
        performed_by: user.id,
        comment: comment,
        approval_level: selectedRequest.current_approval_level
      });

      // If final approval, apply changes
      if (isLastLevel && selectedRequest.change_type === 'update') {
        await supabase.from('report_templates').update({
          name: selectedRequest.proposed_name,
          description: selectedRequest.proposed_description,
          updated_at: new Date().toISOString()
        }).eq('id', selectedRequest.template_id);
      }

      toast.success(isLastLevel ? 'Template changes approved' : 'Approved - moved to next level');
      setSelectedRequest(null);
      setComment('');
      loadChangeRequests();
    } catch (error: any) {
      toast.error('Failed to approve changes');
    } finally {
      setProcessing(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const nextLevel = Math.min(selectedRequest.current_approval_level + 1, selectedRequest.total_approval_levels);

      await supabase.from('approval_escalations').insert({
        change_request_id: selectedRequest.id,
        from_level: selectedRequest.current_approval_level,
        to_level: nextLevel,
        escalation_reason: comment || 'Manual escalation',
        escalated_by: user.id
      });

      await supabase.from('template_change_requests').update({
        current_approval_level: nextLevel,
        escalated: true,
        escalation_reason: comment
      }).eq('id', selectedRequest.id);

      toast.success('Request escalated to next level');
      setSelectedRequest(null);
      setComment('');
      loadChangeRequests();
    } catch (error: any) {
      toast.error('Failed to escalate request');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No pending approvals</CardContent></Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{request.proposed_name || request.template_name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><User className="h-4 w-4" />{request.requester_email}</div>
                      <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(request.requested_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Level {request.current_approval_level}/{request.total_approval_levels}</Badge>
                    {request.escalated && <Badge variant="destructive">Escalated</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{request.proposed_description}</p>
                <Button onClick={() => setSelectedRequest(request)}>Review Changes</Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Review Template Changes</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-2 block">Comment</label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add comment..." rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                <Button variant="secondary" onClick={handleEscalate} disabled={processing || !canApprove}>
                  <ArrowUpCircle className="h-4 w-4 mr-2" />Escalate
                </Button>
                <Button variant="destructive" disabled={processing || !canApprove}><XCircle className="h-4 w-4 mr-2" />Reject</Button>
                <Button onClick={handleApprove} disabled={processing || !canApprove}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
