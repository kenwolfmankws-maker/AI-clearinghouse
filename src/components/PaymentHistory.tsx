import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, Download, ExternalLink, Loader2 } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  tier: string;
  status: string;
  invoice_url: string | null;
  receipt_url: string | null;
  created_at: string;
}

export function PaymentHistory({ userId }: { userId: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, [userId]);

  const loadPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setPayments(data);
    setLoading(false);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Receipt className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Payment History</h2>
      </div>

      {payments.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No payment history yet</p>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {payment.tier.toUpperCase()} Tier Upgrade
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {new Date(payment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {formatAmount(payment.amount, payment.currency)}
                  </p>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              </div>

              {payment.status === 'completed' && (
                <div className="flex gap-2 mt-4">
                  {payment.receipt_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => window.open(payment.receipt_url!, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Receipt
                    </Button>
                  )}
                  {payment.invoice_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => window.open(payment.invoice_url!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Invoice
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
