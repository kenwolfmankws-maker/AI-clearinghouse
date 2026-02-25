import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, DollarSign } from 'lucide-react';

interface PricingTier {
  id: string;
  country_code: string;
  country_name: string;
  region: string;
  cost_per_sms: number;
  currency: string;
  is_active: boolean;
}

const REGIONS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania', 'Other'];

export function SMSPricingTierManager() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [formData, setFormData] = useState({
    country_code: '',
    country_name: '',
    region: 'North America',
    cost_per_sms: '0.0075',
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_pricing_tiers')
        .select('*')
        .order('region', { ascending: true })
        .order('country_name', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error: any) {
      toast.error('Failed to load pricing tiers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTier) {
        const { error } = await supabase
          .from('sms_pricing_tiers')
          .update({
            country_name: formData.country_name,
            region: formData.region,
            cost_per_sms: parseFloat(formData.cost_per_sms),
          })
          .eq('id', editingTier.id);

        if (error) throw error;
        toast.success('Pricing tier updated');
      } else {
        const { error } = await supabase
          .from('sms_pricing_tiers')
          .insert({
            country_code: formData.country_code.toUpperCase(),
            country_name: formData.country_name,
            region: formData.region,
            cost_per_sms: parseFloat(formData.cost_per_sms),
          });

        if (error) throw error;
        toast.success('Pricing tier created');
      }

      setIsDialogOpen(false);
      setEditingTier(null);
      setFormData({ country_code: '', country_name: '', region: 'North America', cost_per_sms: '0.0075' });
      loadTiers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const groupedTiers = tiers.reduce((acc, tier) => {
    if (!acc[tier.region]) acc[tier.region] = [];
    acc[tier.region].push(tier);
    return acc;
  }, {} as Record<string, PricingTier[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              SMS Pricing Tiers
            </CardTitle>
            <CardDescription>Manage per-country SMS costs</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTier(null); setFormData({ country_code: '', country_name: '', region: 'North America', cost_per_sms: '0.0075' }); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTier ? 'Edit' : 'Add'} Pricing Tier</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Country Code (ISO 3166-1 alpha-3)</Label>
                  <Input value={formData.country_code} onChange={(e) => setFormData({ ...formData, country_code: e.target.value })} placeholder="USA" maxLength={3} disabled={!!editingTier} required />
                </div>
                <div>
                  <Label>Country Name</Label>
                  <Input value={formData.country_name} onChange={(e) => setFormData({ ...formData, country_name: e.target.value })} placeholder="United States" required />
                </div>
                <div>
                  <Label>Region</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cost per SMS (USD)</Label>
                  <Input type="number" step="0.000001" value={formData.cost_per_sms} onChange={(e) => setFormData({ ...formData, cost_per_sms: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full">{editingTier ? 'Update' : 'Create'} Tier</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {Object.entries(groupedTiers).map(([region, regionTiers]) => (
          <div key={region} className="mb-6">
            <h3 className="font-semibold mb-2">{region}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Cost/SMS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionTiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell><Badge variant="outline">{tier.country_code}</Badge></TableCell>
                    <TableCell>{tier.country_name}</TableCell>
                    <TableCell>${tier.cost_per_sms.toFixed(6)}</TableCell>
                    <TableCell><Badge variant={tier.is_active ? 'default' : 'secondary'}>{tier.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingTier(tier); setFormData({ country_code: tier.country_code, country_name: tier.country_name, region: tier.region, cost_per_sms: tier.cost_per_sms.toString() }); setIsDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
