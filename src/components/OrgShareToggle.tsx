import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { logAuditEvent } from '@/lib/auditLogger';


interface Organization {
  id: string;
  name: string;
}

interface OrgShareToggleProps {
  itemId: string;
  itemType: 'collection' | 'api_key';
  currentOrgId: string | null;
  userId: string;
  onUpdate: () => void;
}

export function OrgShareToggle({ itemId, itemType, currentOrgId, userId, onUpdate }: OrgShareToggleProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(currentOrgId);
  const [isShared, setIsShared] = useState(!!currentOrgId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, [userId]);

  const loadOrganizations = async () => {
    const { data } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(id, name)')
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (data) {
      const orgs = data.map((m: any) => m.organizations).filter(Boolean);
      setOrganizations(orgs);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      await updateSharing(null);
      setIsShared(false);
      setSelectedOrg(null);
    } else if (organizations.length === 1) {
      await updateSharing(organizations[0].id);
      setIsShared(true);
      setSelectedOrg(organizations[0].id);
    } else {
      setIsShared(true);
    }
  };

  const handleOrgSelect = async (orgId: string) => {
    setSelectedOrg(orgId);
    await updateSharing(orgId);
  };

  const updateSharing = async (orgId: string | null) => {
    setLoading(true);
    const table = itemType === 'collection' ? 'custom_collections' : 'api_keys';
    const { error } = await supabase
      .from(table)
      .update({ shared_with_org: orgId })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update sharing', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: orgId ? 'Shared with organization' : 'Sharing removed' });
      
      // Log audit event
      const orgName = organizations.find(o => o.id === orgId)?.name || 'organization';
      await logAuditEvent({
        actionType: itemType === 'collection' ? 'collection.shared' : 'api_key.shared',
        actionDetails: orgId 
          ? `Shared ${itemType} with ${orgName}` 
          : `Removed ${itemType} sharing`,
        resourceType: itemType,
        resourceId: itemId,
        metadata: { organizationId: orgId, organizationName: orgName }
      });
      
      onUpdate();
    }
    setLoading(false);
  };


  if (organizations.length === 0) return null;

  return (
    <div className="space-y-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <Label className="text-sm text-slate-300">Share with Organization</Label>
        </div>
        <Switch checked={isShared} onCheckedChange={handleToggle} disabled={loading} />
      </div>
      {isShared && organizations.length > 1 && (
        <Select value={selectedOrg || ''} onValueChange={handleOrgSelect}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {organizations.map(org => (
              <SelectItem key={org.id} value={org.id} className="text-white">
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
