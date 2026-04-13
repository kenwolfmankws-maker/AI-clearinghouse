import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

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

export function OrgShareToggle({ currentOrgId, userId }: OrgShareToggleProps) {
  // Supabase removed: org membership / sharing persistence disabled.
  // Keep component render-safe and communicate disabled state.

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(currentOrgId);
  const [isShared, setIsShared] = useState(!!currentOrgId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Without backend we can't load orgs.
    // Clear state on user change to avoid stale UI.
    setOrganizations([]);
    setSelectedOrg(null);
    setIsShared(false);
  }, [userId]);

  const handleToggle = async (_checked: boolean) => {
    setLoading(true);
    try {
      toast({
        title: 'Disabled',
        description: 'Organization sharing is disabled because database integration was removed.',
        variant: 'destructive',
      });
      setIsShared(false);
      setSelectedOrg(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSelect = async (_orgId: string) => {
    toast({
      title: 'Disabled',
      description: 'Organization sharing is disabled because database integration was removed.',
      variant: 'destructive',
    });
    setSelectedOrg(null);
  };

  // Previously returned null when no orgs. Now return a small disabled control
  // so the UI explains why it’s missing.
  return (
    <div className="space-y-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700 opacity-75">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <Label className="text-sm text-slate-300">Share with Organization</Label>
        </div>
        <Switch checked={isShared} onCheckedChange={handleToggle} disabled={loading} />
      </div>

      {isShared && organizations.length > 1 && (
        <Select value={selectedOrg || ''} onValueChange={handleOrgSelect} disabled>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id} className="text-white">
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <p className="text-xs text-slate-400">
        Disabled: organization sharing requires backend support.
      </p>
    </div>
  );
}
