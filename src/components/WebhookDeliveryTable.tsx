import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { RefreshCw, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Delivery {
  id: string;
  event_type: string;
  endpoint_url: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  http_status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  next_retry_at: string | null;
}

export function WebhookDeliveryTable() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const loadDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (deliveryId: string) => {
    setRetrying(deliveryId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('retry_webhook_delivery', {
        p_delivery_id: deliveryId,
        p_user_id: user.id
      });

      if (error) throw error;
      if (data) {
        toast.success('Webhook queued for retry');
        loadDeliveries();
      } else {
        toast.error('Failed to retry webhook');
      }
    } catch (error) {
      toast.error('Error retrying webhook');
    } finally {
      setRetrying(null);
    }
  };

  const handleCancel = async (deliveryId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('cancel_webhook_delivery', {
        p_delivery_id: deliveryId,
        p_user_id: user.id
      });

      if (error) throw error;
      if (data) {
        toast.success('Webhook delivery cancelled');
        loadDeliveries();
      }
    } catch (error) {
      toast.error('Error cancelling webhook');
    }
  };

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary',
      cancelled: 'outline'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (loading) return <div className="text-center py-8">Loading deliveries...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Response</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((delivery) => (
            <TableRow key={delivery.id}>
              <TableCell className="font-medium">{delivery.event_type}</TableCell>
              <TableCell className="max-w-xs truncate">{delivery.endpoint_url}</TableCell>
              <TableCell>{getStatusBadge(delivery.status)}</TableCell>
              <TableCell>
                {delivery.attempt_count}/{delivery.max_attempts}
              </TableCell>
              <TableCell>
                {delivery.http_status_code && (
                  <span className="text-sm">
                    {delivery.http_status_code} ({delivery.response_time_ms}ms)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {delivery.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetry(delivery.id)}
                      disabled={retrying === delivery.id}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                  {delivery.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(delivery.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}