import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Download, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BackupCodesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codes?: string[];
}

export function BackupCodesModal({ open, onOpenChange, codes: providedCodes }: BackupCodesModalProps) {
  const [codes, setCodes] = useState<string[]>(providedCodes || []);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && !providedCodes) {
      generateCodes();
    }
  }, [open, providedCodes]);

  const generateCodes = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate 10 backup codes
      const newCodes = Array.from({ length: 10 }, () => 
        Array.from({ length: 8 }, () => 
          Math.floor(Math.random() * 10)
        ).join('')
      );

      // Hash codes before storing
      const codeHashes = await Promise.all(
        newCodes.map(async (code) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(code);
          const hash = await crypto.subtle.digest('SHA-256', data);
          return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        })
      );

      // Store hashed codes
      const { error } = await supabase.rpc('generate_backup_codes', {
        p_user_id: user.id,
        p_code_hashes: codeHashes
      });

      if (error) throw error;
      setCodes(newCodes);
    } catch (err) {
      console.error('Failed to generate backup codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyAllCodes = () => {
    const codesText = codes.map((code, i) => `${i + 1}. ${code}`).join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCodes = () => {
    const codesText = codes.map((code, i) => `${i + 1}. ${code}`).join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Backup Recovery Codes</DialogTitle>
          <DialogDescription>
            Save these codes in a secure location. Each code can only be used once.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Store these codes securely. You'll need them to access your account if you lose your authenticator device.
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Generating codes...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {codes.map((code, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>{code}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copyAllCodes} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy All'}
              </Button>
              <Button variant="outline" onClick={downloadCodes} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}