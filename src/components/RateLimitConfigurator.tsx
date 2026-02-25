import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Zap, Clock } from 'lucide-react';

export interface RateLimit {
  window: 'minute' | 'hour' | 'day' | 'week';
  max_requests: number;
  enabled: boolean;
}

interface RateLimitConfiguratorProps {
  rateLimits: RateLimit[];
  onChange: (limits: RateLimit[]) => void;
}

const PRESETS = {
  none: { name: 'No Limits', limits: [] },
  light: { 
    name: 'Light Usage', 
    limits: [
      { window: 'minute' as const, max_requests: 10, enabled: true },
      { window: 'hour' as const, max_requests: 100, enabled: true }
    ]
  },
  moderate: { 
    name: 'Moderate Usage', 
    limits: [
      { window: 'minute' as const, max_requests: 30, enabled: true },
      { window: 'hour' as const, max_requests: 500, enabled: true },
      { window: 'day' as const, max_requests: 5000, enabled: true }
    ]
  },
  heavy: { 
    name: 'Heavy Usage', 
    limits: [
      { window: 'minute' as const, max_requests: 100, enabled: true },
      { window: 'hour' as const, max_requests: 2000, enabled: true },
      { window: 'day' as const, max_requests: 20000, enabled: true }
    ]
  },
  burst: { 
    name: 'Burst Protection', 
    limits: [
      { window: 'minute' as const, max_requests: 5, enabled: true },
      { window: 'hour' as const, max_requests: 100, enabled: true },
      { window: 'day' as const, max_requests: 1000, enabled: true },
      { window: 'week' as const, max_requests: 5000, enabled: true }
    ]
  }
};

export function RateLimitConfigurator({ rateLimits, onChange }: RateLimitConfiguratorProps) {
  const [showCustom, setShowCustom] = useState(false);

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey as keyof typeof PRESETS];
    onChange(preset.limits);
    setShowCustom(false);
  };

  const addLimit = () => {
    onChange([...rateLimits, { window: 'hour', max_requests: 100, enabled: true }]);
  };

  const updateLimit = (index: number, updates: Partial<RateLimit>) => {
    const newLimits = [...rateLimits];
    newLimits[index] = { ...newLimits[index], ...updates };
    onChange(newLimits);
  };

  const removeLimit = (index: number) => {
    onChange(rateLimits.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Rate Limiting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Presets</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(key)}
                className="justify-start"
              >
                {key === 'burst' && <Zap className="h-4 w-4 mr-2" />}
                {preset.name}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustom(!showCustom)}
              className="justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Custom
            </Button>
          </div>
        </div>

        {(rateLimits.length > 0 || showCustom) && (
          <div className="space-y-3 pt-3 border-t">
            {rateLimits.map((limit, index) => (
              <div key={index} className="flex items-end gap-2 p-3 bg-muted rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Window</Label>
                    <Select
                      value={limit.window}
                      onValueChange={(v) => updateLimit(index, { window: v as RateLimit['window'] })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minute">Per Minute</SelectItem>
                        <SelectItem value="hour">Per Hour</SelectItem>
                        <SelectItem value="day">Per Day</SelectItem>
                        <SelectItem value="week">Per Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Max Requests</Label>
                    <Input
                      type="number"
                      value={limit.max_requests}
                      onChange={(e) => updateLimit(index, { max_requests: parseInt(e.target.value) })}
                      className="h-8"
                      min="1"
                    />
                  </div>
                </div>
                <Switch
                  checked={limit.enabled}
                  onCheckedChange={(checked) => updateLimit(index, { enabled: checked })}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeLimit(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {showCustom && (
              <Button size="sm" variant="outline" onClick={addLimit} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Rate Limit
              </Button>
            )}
          </div>
        )}

        {rateLimits.length > 0 && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p className="font-medium mb-1">Active Limits:</p>
            {rateLimits.filter(l => l.enabled).map((limit, i) => (
              <Badge key={i} variant="secondary" className="mr-1 mb-1">
                {limit.max_requests}/{limit.window}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
