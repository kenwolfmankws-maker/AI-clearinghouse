import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Bookmark, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FilterPreset {
  id: string;
  name: string;
  filters: {
    searchTerm: string;
    actionFilter: string;
    dateFrom: string;
    dateTo: string;
    ipFilter: string;
    userAgentFilter: string;
  };
}

interface FilterPresetManagerProps {
  currentFilters: FilterPreset['filters'];
  onLoadPreset: (filters: FilterPreset['filters']) => void;
}

export default function FilterPresetManager({ currentFilters, onLoadPreset }: FilterPresetManagerProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    const saved = localStorage.getItem('auditLogPresets');
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      toast({ title: 'Error', description: 'Please enter a preset name', variant: 'destructive' });
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: currentFilters
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('auditLogPresets', JSON.stringify(updated));
    setPresetName('');
    setIsOpen(false);
    toast({ title: 'Success', description: 'Filter preset saved' });
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('auditLogPresets', JSON.stringify(updated));
    toast({ title: 'Success', description: 'Preset deleted' });
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          Saved Filter Presets
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">Save Current</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Filter Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="presetName">Preset Name</Label>
                <Input
                  id="presetName"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., Last Week API Keys"
                />
              </div>
              <Button onClick={savePreset} className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Save Preset
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {presets.length === 0 ? (
        <p className="text-sm text-gray-500">No saved presets. Save your current filters to quickly access them later.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {presets.map(preset => (
            <Badge key={preset.id} variant="secondary" className="px-3 py-1.5 cursor-pointer hover:bg-secondary/80 flex items-center gap-2">
              <span onClick={() => onLoadPreset(preset.filters)}>{preset.name}</span>
              <Trash2 
                className="w-3 h-3 hover:text-destructive" 
                onClick={(e) => {
                  e.stopPropagation();
                  deletePreset(preset.id);
                }}
              />
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
