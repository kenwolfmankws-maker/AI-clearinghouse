import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Clock, User, Calendar, ArrowUpCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ApprovalChainProgress } from './ApprovalChainProgress';

interface ChangeRequest {
  id: string;
  template_id: string;
  change_type: string;
  requested_by: string;
  requested_at: string;
  status: string;
  proposed_name: string;
  proposed_description: string;
  proposed_metrics: any;
  proposed_date_range: string;
  proposed_filters: any;
  proposed_format: string;
  original_data: any;
  requester_email?: string;
  template_name?: string;
}

export function TemplateApprovalQueue() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadChangeRequests();
  }, []);

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
        template_name: req.template?.name
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

      // Update the change request status
      const { error: updateError } = await supabase
        .from('template_change_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_comment: comment
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Apply the changes to the template
      if (selectedRequest.change_type === 'update') {
        const { error: templateError } = await supabase
          .from('report_templates')
          .update({
            name: selectedRequest.proposed_name,
            description: selectedRequest.proposed_description,
            metrics: selectedRequest.proposed_metrics,
            date_range: selectedRequest.proposed_date_range,
            filters: selectedRequest.proposed_filters,
            format: selectedRequest.proposed_format,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRequest.template_id);

        if (templateError) throw templateError;
      }

      // Log approval in history
      await supabase.from('template_approval_history').insert({
        change_request_id: selectedRequest.id,
        template_id: selectedRequest.template_id,
        action: 'approved',
        performed_by: user.id,
        comment: comment
      });

      toast.success('Template changes approved');
      setSelectedRequest(null);
      setComment('');
      loadChangeRequests();
    } catch (error: any) {
      toast.error('Failed to approve changes');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('template_change_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_comment: comment
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await supabase.from('template_approval_history').insert({
        change_request_id: selectedRequest.id,
        template_id: selectedRequest.template_id,
        action: 'rejected',
        performed_by: user.id,
        comment: comment
      });

      toast.success('Template changes rejected');
      setSelectedRequest(null);
      setComment('');
      loadChangeRequests();
    } catch (error: any) {
      toast.error('Failed to reject changes');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading pending approvals...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No pending approvals
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{request.proposed_name || request.template_name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {request.requester_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.requested_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{request.proposed_description}</p>
                <Button onClick={() => setSelectedRequest(request)}>
                  Review Changes
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Template Changes</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Original</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p><strong>Name:</strong> {selectedRequest.original_data?.name || 'N/A'}</p>
                    <p><strong>Date Range:</strong> {selectedRequest.original_data?.date_range || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Proposed</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {selectedRequest.proposed_name}</p>
                    <p><strong>Date Range:</strong> {selectedRequest.proposed_date_range}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment about this decision..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
