import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Delegation {
  id: string;
  delegate_email: string;
  start_date: string;
  end_date: string;
  reason: string;
  is_active: boolean;
}

export function ApprovalDelegation() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [delegateEmail, setDelegateEmail] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDelegations();
  }, []);

  const loadDelegations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('approval_delegations')
        .select('*, delegate:delegate_id(email)')
        .eq('delegator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDelegations(data?.map((d: any) => ({
        ...d,
        delegate_email: d.delegate?.email
      })) || []);
    } catch (error: any) {
      toast.error('Failed to load delegations');
    }
  };

  const createDelegation = async () => {
    if (!delegateEmail || !startDate || !endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: delegate } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', delegateEmail)
        .single();

      if (!delegate) {
        toast.error('User not found');
        return;
      }

      const { error } = await supabase.from('approval_delegations').insert({
        delegator_id: user.id,
        delegate_id: delegate.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reason,
        is_active: true
      });

      if (error) throw error;

      toast.success('Delegation created');
      setDelegateEmail('');
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      loadDelegations();
    } catch (error: any) {
      toast.error('Failed to create delegation');
    } finally {
      setLoading(false);
    }
  };

  const removeDelegation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('approval_delegations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Delegation removed');
      loadDelegations();
    } catch (error: any) {
      toast.error('Failed to remove delegation');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Delegation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Delegate To (Email)</label>
            <Input
              value={delegateEmail}
              onChange={(e) => setDelegateEmail(e.target.value)}
              placeholder="colleague@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Reason</label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Vacation, out of office, etc." />
          </div>

          <Button onClick={createDelegation} disabled={loading} className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            Create Delegation
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Active Delegations</h4>
          {delegations.filter(d => d.is_active).map((delegation) => (
            <div key={delegation.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">{delegation.delegate_email}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(delegation.start_date), 'PP')} - {format(new Date(delegation.end_date), 'PP')}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeDelegation(delegation.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
