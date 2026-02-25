import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface EditConfigLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  currentLabel?: string;
  configUrl: string;
}

const PRESET_LABELS = ['Production', 'Staging', 'Development', 'Testing', 'Local'];

export default function EditConfigLabelModal({
  isOpen,
  onClose,
  onSave,
  currentLabel = '',
  configUrl,
}: EditConfigLabelModalProps) {
  const [label, setLabel] = useState(currentLabel);

  useEffect(() => {
    setLabel(currentLabel);
  }, [currentLabel, isOpen]);

  const handleSave = () => {
    onSave(label.trim());
    onClose();
  };

  const handlePresetClick = (preset: string) => {
    setLabel(preset);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Configuration Label</DialogTitle>
          <DialogDescription>
            Add a custom label to identify this configuration (e.g., Production, Staging, Development)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="configUrl">Configuration URL</Label>
            <div className="text-sm font-mono text-muted-foreground truncate p-2 bg-muted rounded">
              {configUrl}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Custom Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter a label (e.g., Production)"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_LABELS.map((preset) => (
                <Badge
                  key={preset}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
