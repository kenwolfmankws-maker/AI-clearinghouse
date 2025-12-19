import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface WebhookSecretKeyProps {
  webhookId: string;
  secretKey: string;
  onRegenerate: () => void;
}

export default function WebhookSecretKey({ webhookId, secretKey, onRegenerate }: WebhookSecretKeyProps) {
  const [showKey, setShowKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secretKey);
    toast.success('Secret key copied to clipboard');
  };

  const regenerateKey = async () => {
    setRegenerating(true);
    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const { error } = await supabase
      .from('webhook_configs')
      .update({ secret_key: newKey })
      .eq('id', webhookId);

    if (error) {
      toast.error('Failed to regenerate secret key');
    } else {
      toast.success('Secret key regenerated successfully');
      onRegenerate();
    }
    setRegenerating(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Signing Secret</Label>
      <div className="flex gap-2">
        <Input
          type={showKey ? 'text' : 'password'}
          value={secretKey}
          readOnly
          className="font-mono text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={copyToClipboard}
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={regenerateKey}
          disabled={regenerating}
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Use this secret to verify webhook signatures (HMAC-SHA256)
      </p>
    </div>
  );
}
