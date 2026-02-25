import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IPAllowlistManagerProps {
  allowedIPs: string[];
  onChange: (ips: string[]) => void;
}

export function IPAllowlistManager({ allowedIPs, onChange }: IPAllowlistManagerProps) {
  const [newIP, setNewIP] = useState('');
  const [error, setError] = useState('');

  const validateIP = (ip: string): boolean => {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // CIDR validation
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    
    if (cidrRegex.test(ip)) {
      const [addr, mask] = ip.split('/');
      const maskNum = parseInt(mask);
      if (maskNum < 0 || maskNum > 32) return false;
      return validateIPv4(addr);
    }
    
    return validateIPv4(ip);
  };

  const validateIPv4 = (ip: string): boolean => {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  };

  const addIP = () => {
    const trimmed = newIP.trim();
    if (!trimmed) {
      setError('Please enter an IP address');
      return;
    }
    
    if (!validateIP(trimmed)) {
      setError('Invalid IP address or CIDR range format');
      return;
    }
    
    if (allowedIPs.includes(trimmed)) {
      setError('IP address already in allowlist');
      return;
    }
    
    onChange([...allowedIPs, trimmed]);
    setNewIP('');
    setError('');
  };

  const removeIP = (ip: string) => {
    onChange(allowedIPs.filter(i => i !== ip));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium mb-1">IP Allowlist</h4>
          <p className="text-sm text-muted-foreground">
            Restrict webhook deliveries to specific IP addresses or CIDR ranges. Leave empty to allow all IPs.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="192.168.1.1 or 10.0.0.0/24"
          value={newIP}
          onChange={(e) => {
            setNewIP(e.target.value);
            setError('');
          }}
          onKeyPress={(e) => e.key === 'Enter' && addIP()}
        />
        <Button onClick={addIP} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {allowedIPs.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Allowed IPs ({allowedIPs.length})</div>
          <div className="flex flex-wrap gap-2">
            {allowedIPs.map((ip) => (
              <Badge key={ip} variant="secondary" className="pl-3 pr-1">
                {ip}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeIP(ip)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {allowedIPs.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No IP restrictions configured. Webhooks can be delivered to any IP address.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
