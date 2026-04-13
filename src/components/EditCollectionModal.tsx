import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collection } from '@/pages/Collections';
import { allModels } from '@/data/allModels';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditCollectionModalProps {
  collection: Collection;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditCollectionModal = ({ collection, isOpen, onClose, onUpdate }: EditCollectionModalProps) => {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(collection.model_ids);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(collection.name);
    setDescription(collection.description);
    setSelectedModelIds(collection.model_ids);
  }, [collection]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Collection name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Supabase removed: no persistence.
      toast({
        title: 'Disabled',
        description: 'Saving collections is disabled because database integration was removed.',
        variant: 'destructive',
      });

      // Keep API compatibility with caller.
      onUpdate();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModelIds((prev) => (prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]));
  };

  const removeModel = (modelId: string) => {
    setSelectedModelIds((prev) => prev.filter((id) => id !== modelId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div>
            <Label htmlFor="name">Collection Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Collection" />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your collection..."
              rows={3}
            />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Label className="mb-2">Selected Models ({selectedModelIds.length})</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedModelIds.map((modelId) => {
                const model = allModels.find((m) => m.id === modelId);
                return model ? (
                  <Badge key={modelId} variant="secondary" className="gap-1">
                    {model.name}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeModel(modelId)} />
                  </Badge>
                ) : null;
              })}
            </div>

            <Label className="mb-2">Add Models</Label>
            <ScrollArea className="flex-1 border rounded-md p-3">
              <div className="space-y-2">
                {allModels.map((model) => (
                  <div key={model.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={model.id}
                      checked={selectedModelIds.includes(model.id)}
                      onCheckedChange={() => toggleModel(model.id)}
                    />
                    <label htmlFor={model.id} className="text-sm cursor-pointer flex-1">
                      {model.name} <span className="text-muted-foreground">({model.provider})</span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
