import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ban, Unlock, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface BlockedIP {
  ip_address: string;
  reason: string;
  created_at: string;
  expires_at: string;
}

interface Props {
  blockedIPs: BlockedIP[];
  onUpdate: () => void;
}

export function IPBlocklistManager({ blockedIPs, onUpdate }: Props) {
  const [newIP, setNewIP] = useState("");
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState("24");
  const { toast } = useToast();

  const handleBlock = async () => {
    if (!newIP) return;
    
    const { data, error } = await supabase.rpc('manage_ip_block', {
      p_ip_address: newIP,
      p_action: 'block',
      p_reason: reason || 'Manually blocked',
      p_duration_hours: parseInt(hours)
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "IP blocked successfully" });
      setNewIP("");
      setReason("");
      onUpdate();
    }
  };

  const handleUnblock = async (ip: string) => {
    const { error } = await supabase.rpc('manage_ip_block', {
      p_ip_address: ip,
      p_action: 'unblock'
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "IP unblocked" });
      onUpdate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>IP Blocklist Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>IP Address</Label>
              <Input value={newIP} onChange={(e) => setNewIP(e.target.value)} placeholder="192.168.1.1" />
            </div>
            <div>
              <Label>Duration (hours)</Label>
              <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Suspicious activity" />
          </div>
          <Button onClick={handleBlock} className="w-full"><Plus className="mr-2 h-4 w-4" />Block IP</Button>
        </div>

        <div className="space-y-2">
          {blockedIPs.map((ip) => (
            <div key={ip.ip_address} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-mono font-bold">{ip.ip_address}</div>
                <div className="text-sm text-muted-foreground">{ip.reason}</div>
                <div className="text-xs text-muted-foreground">Expires: {new Date(ip.expires_at).toLocaleString()}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleUnblock(ip.ip_address)}>
                <Unlock className="mr-2 h-4 w-4" />Unblock
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}