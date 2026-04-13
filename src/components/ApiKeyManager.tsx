import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrgShareToggle } from '@/components/OrgShareToggle';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
  shared_with_org: string | null;
}

export function ApiKeyManager({ userId }: { userId: string }) {
  // Supabase removed: API keys are disabled without backend support.
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Without backend we cannot load keys; keep deterministic.
    setApiKeys([]);
  }, [userId]);

  const disabledToast = (feature: string) => {
    toast({
      title: 'Disabled',
      description: `${feature} is disabled because database integration was removed.`,
      variant: 'destructive',
    });
  };

  const loadApiKeys = async () => {
    // no-op
    setApiKeys([]);
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: 'Error', description: 'Please enter a key name', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      disabledToast('API key generation');
      // no-op; keep UX: do not generate any secrets client-side
      setGeneratedKey('');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Copied to clipboard' });
  };

  const revokeKey = async (_id: string, _keyName: string) => {
    disabledToast('API key revocation');
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-white">API Keys</h2>
        <Button
          onClick={() => {
            disabledToast('API keys');
            setShowNewKeyDialog(true);
          }}
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Key
        </Button>
      </div>

      <p className="text-slate-400 text-sm mb-4">
        Disabled: API key management requires backend support.
      </p>

      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <p className="text-slate-400">No API keys available.</p>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-4 h-4 text-blue-400" />
                    <p className="text-white font-semibold">{key.name}</p>
                  </div>
                  <p className="text-slate-400 text-sm font-mono">{key.key_prefix}...</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => revokeKey(key.id, key.name)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-4 text-xs text-slate-400">
                <span>Usage: {key.usage_count}</span>
                <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                {key.last_used_at && <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>}
              </div>

              <OrgShareToggle
                itemId={key.id}
                itemType="api_key"
                currentOrgId={key.shared_with_org}
                userId={userId}
                onUpdate={loadApiKeys}
              />
            </div>
          ))
        )}
      </div>

      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Generate New API Key</DialogTitle>
          </DialogHeader>

          {generatedKey ? (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">Save this key - you won't see it again!</p>
              <div className="flex gap-2">
                <Input
                  value={showKey ? generatedKey : '••••••••••••••••••••••••••••••••'}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                />
                <Button size="icon" variant="outline" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button size="icon" onClick={() => copyToClipboard(generatedKey)} disabled={!generatedKey}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={() => {
                  setGeneratedKey('');
                  setShowNewKeyDialog(false);
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Key Name</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Production API"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button onClick={generateKey} disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-purple-600">
                {loading ? 'Generating...' : 'Generate Key'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
