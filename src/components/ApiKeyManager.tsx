import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sendApiKeyAlert } from '@/lib/emailService';
import { OrgShareToggle } from '@/components/OrgShareToggle';
import { logAuditEvent } from '@/lib/auditLogger';
import { notifyApiKeyRevoked } from '@/lib/notificationService';




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
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadApiKeys();
  }, [userId]);

  const loadApiKeys = async () => {
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setApiKeys(data);
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: 'Error', description: 'Please enter a key name', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('generate-api-key', {
      body: { name: newKeyName }
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          name: data.name,
          key_hash: data.keyHash,
          key_prefix: data.keyPrefix
        });
      if (insertError) {
        toast({ title: 'Error', description: insertError.message, variant: 'destructive' });
      } else {
        setGeneratedKey(data.apiKey);
        setNewKeyName('');
        loadApiKeys();
        toast({ title: 'Success', description: 'API key generated successfully' });
        
        // Send email notification
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('email, tier')
          .eq('id', userId)
          .single();
        
        if (user?.email && profile) {
          sendApiKeyAlert(user.email, data.name, profile.tier || 'free');
        }

        // Create notification
        await supabase.functions.invoke('create-notification', {
          body: {
            userId,
            type: 'api_key',
            title: 'New API Key Created',
            message: `API key "${data.name}" has been generated successfully. Keep it secure!`,
            data: { keyName: data.name, keyPrefix: data.keyPrefix }
          }
        });

        // Log audit event
        await logAuditEvent({
          actionType: 'api_key.created',
          actionDetails: `Created API key: ${data.name}`,
          resourceType: 'api_key',
          resourceId: data.keyPrefix,
          metadata: { keyName: data.name }
        });
      }
    }
    setLoading(false);
  };





  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'API key copied to clipboard' });
  };

  const revokeKey = async (id: string, keyName: string) => {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'API key revoked' });
      
      // Send notification about revoked key
      await notifyApiKeyRevoked(userId, keyName);
      
      // Log audit event
      await logAuditEvent({
        actionType: 'api_key.revoked',
        actionDetails: `Revoked API key: ${keyName}`,
        resourceType: 'api_key',
        resourceId: id,
        metadata: { keyName }
      });
      
      loadApiKeys();
    }
  };



  return (
    <Card className="bg-slate-900/50 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">API Keys</h2>
        <Button onClick={() => setShowNewKeyDialog(true)} size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          New Key
        </Button>
      </div>

      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <p className="text-slate-400">No API keys yet. Create one to get started.</p>
        ) : (
          apiKeys.map(key => (
            <div key={key.id} className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-4 h-4 text-blue-400" />
                    <p className="text-white font-semibold">{key.name}</p>
                  </div>
                  <p className="text-slate-400 text-sm font-mono">{key.key_prefix}...</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => revokeKey(key.id, key.name)} className="text-red-400 hover:text-red-300">

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
                <Input value={showKey ? generatedKey : '••••••••••••••••••••••••••••••••'} readOnly className="bg-slate-800 border-slate-700 text-white font-mono" />
                <Button size="icon" variant="outline" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button size="icon" onClick={() => copyToClipboard(generatedKey)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={() => { setGeneratedKey(''); setShowNewKeyDialog(false); }} className="w-full">Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Key Name</Label>
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Production API" className="bg-slate-800 border-slate-700 text-white" />
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
