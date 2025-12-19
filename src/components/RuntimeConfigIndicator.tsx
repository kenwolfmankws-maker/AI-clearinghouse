import { useState, useEffect } from 'react';
import { useRuntimeConfig } from '@/contexts/RuntimeConfigContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings2, Check, X, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIUsageDashboard } from '@/components/APIUsageDashboard';
import { APIUsageTracker } from '@/lib/apiUsageTracker';

export default function RuntimeConfigIndicator() {
  const { config, setAutoSync } = useRuntimeConfig();
  const [open, setOpen] = useState(false);
  const [usageStats, setUsageStats] = useState(APIUsageTracker.getUsageStats());

  useEffect(() => {
    if (open) {
      setUsageStats(APIUsageTracker.getUsageStats());
    }
  }, [open]);

  const totalVars = Object.keys(config.apiKeys).length + 
                    Object.keys(config.featureFlags).length + 
                    Object.keys(config.customVars).length;

  const totalApiCalls = usageStats.reduce((sum, stat) => sum + stat.accessCount, 0);

  if (!config.profileName && totalVars === 0) return null;


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
          <Settings2 className="w-4 h-4 mr-2" />
          Runtime Config
          {totalVars > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalVars}
            </Badge>
          )}
          {totalApiCalls > 0 && (
            <Badge variant="outline" className="ml-1">
              <BarChart3 className="w-3 h-3 mr-1" />
              {totalApiCalls}
            </Badge>
          )}
        </Button>

      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Active Runtime Configuration</DialogTitle>
          <DialogDescription>
            {config.profileName ? `Profile: ${config.profileName}` : 'Current runtime settings'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              API Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label htmlFor="auto-sync">Auto-sync on Profile Apply</Label>
              <Switch
                id="auto-sync"
                checked={config.autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {Object.keys(config.apiKeys).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">API Keys</h3>
                    <div className="space-y-2">
                      {Object.entries(config.apiKeys).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{key}</span>
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(config.featureFlags).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Feature Flags</h3>
                    <div className="space-y-2">
                      {Object.entries(config.featureFlags).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{key}</span>
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(config.customVars).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Custom Variables</h3>
                    <div className="space-y-2">
                      {Object.entries(config.customVars).map(([key, value]) => (
                        <div key={key} className="space-y-1 p-2 border rounded">
                          <span className="text-sm font-medium">{key}</span>
                          <p className="text-xs text-muted-foreground font-mono">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analytics">
            <ScrollArea className="h-[500px]">
              <APIUsageDashboard />
            </ScrollArea>
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}
