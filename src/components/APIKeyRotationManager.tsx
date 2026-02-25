import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { apiKeyRotationService, RotationPolicy } from '@/lib/apiKeyRotationService';
import { RefreshCw, Calendar, Shield, Bell } from 'lucide-react';

interface APIKeyRotationManagerProps {
  keyName: string;
  onKeyRotated?: (newKey: string) => void;
}

export function APIKeyRotationManager({ keyName, onKeyRotated }: APIKeyRotationManagerProps) {
  const [policy, setPolicy] = useState<RotationPolicy>({
    keyName,
    rotationEnabled: false,
    rotationIntervalDays: 90,
    gracePeriodDays: 7,
    autoRotate: false,
    notifyBeforeDays: 14
  });
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    loadPolicy();
  }, [keyName]);

  const loadPolicy = async () => {
    const existing = await apiKeyRotationService.getRotationPolicy(keyName);
    if (existing) {
      setPolicy(existing);
    }
  };

  const handleSavePolicy = async () => {
    setLoading(true);
    try {
      await apiKeyRotationService.saveRotationPolicy(policy);
    } finally {
      setLoading(false);
    }
  };

  const handleRotateNow = async () => {
    setRotating(true);
    try {
      const newKey = await apiKeyRotationService.rotateKey(keyName, 'Manual rotation', 'manual');
      onKeyRotated?.(newKey);
    } finally {
      setRotating(false);
    }
  };

  const daysUntilRotation = policy.nextRotationDate 
    ? Math.floor((new Date(policy.nextRotationDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Key Rotation Policy
        </CardTitle>
        <CardDescription>Configure automatic rotation for {keyName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="rotation-enabled">Enable Rotation</Label>
          <Switch
            id="rotation-enabled"
            checked={policy.rotationEnabled}
            onCheckedChange={(checked) => setPolicy({ ...policy, rotationEnabled: checked })}
          />
        </div>

        {policy.rotationEnabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="interval">Rotation Interval (days)</Label>
              <Input
                id="interval"
                type="number"
                value={policy.rotationIntervalDays}
                onChange={(e) => setPolicy({ ...policy, rotationIntervalDays: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grace">Grace Period (days)</Label>
              <Input
                id="grace"
                type="number"
                value={policy.gracePeriodDays}
                onChange={(e) => setPolicy({ ...policy, gracePeriodDays: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notify">Notify Before (days)</Label>
              <Input
                id="notify"
                type="number"
                value={policy.notifyBeforeDays}
                onChange={(e) => setPolicy({ ...policy, notifyBeforeDays: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-rotate">Auto-Rotate</Label>
              <Switch
                id="auto-rotate"
                checked={policy.autoRotate}
                onCheckedChange={(checked) => setPolicy({ ...policy, autoRotate: checked })}
              />
            </div>

            {daysUntilRotation !== null && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Next rotation in {daysUntilRotation} days</span>
                  {daysUntilRotation <= policy.notifyBeforeDays && (
                    <Badge variant="warning">
                      <Bell className="h-3 w-3 mr-1" />
                      Expiring Soon
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSavePolicy} disabled={loading}>
            Save Policy
          </Button>
          <Button onClick={handleRotateNow} disabled={rotating} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Rotate Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
