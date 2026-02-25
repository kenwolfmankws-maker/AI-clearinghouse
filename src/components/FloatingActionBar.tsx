import React, { useState } from 'react';
import { GitCompare, Heart, Download, FolderPlus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { toast } from './ui/use-toast';
import { AIModel } from '@/data/allModels';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logAuditEvent } from '@/lib/auditLogger';



interface FloatingActionBarProps {
  selectedCount: number;
  selectedModels: AIModel[];
  onAddToComparison: () => void;
  onAddToFavorites: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onDeselectAll: () => void;
}

const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  selectedCount,
  selectedModels,
  onAddToComparison,
  onAddToFavorites,
  onExportCSV,
  onExportJSON,
  onDeselectAll,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [saving, setSaving] = useState(false);


  const handleCreateCollection = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'Please sign in to create collections', variant: 'destructive' });
      return;
    }

    if (!collectionName.trim()) {
      toast({ title: 'Error', description: 'Please enter a collection name', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('custom_collections')
        .insert({
          user_id: user.id,
          name: collectionName,
          description: collectionDescription,
          model_ids: selectedModels.map(m => m.id),
        });

      if (error) throw error;

      // Log audit event
      await logAuditEvent({
        actionType: 'collection.created',
        actionDetails: `Created collection: ${collectionName}`,
        resourceType: 'collection',
        metadata: { collectionName, modelCount: selectedCount }
      });

      toast({ title: 'Success', description: `Collection "${collectionName}" created with ${selectedCount} models` });
      setShowCollectionDialog(false);
      setCollectionName('');
      setCollectionDescription('');
      onDeselectAll();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-full shadow-2xl px-6 py-4 flex items-center gap-4 z-50 animate-in slide-in-from-bottom">
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {selectedCount}
          </span>
          <span className="text-slate-300 text-sm font-medium">selected</span>
        </div>

        <div className="h-6 w-px bg-slate-600" />

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onAddToComparison} className="text-slate-300 hover:text-white">
            <GitCompare className="w-4 h-4 mr-2" />
            Compare
          </Button>
          <Button size="sm" variant="ghost" onClick={onAddToFavorites} className="text-slate-300 hover:text-white">
            <Heart className="w-4 h-4 mr-2" />
            Favorite
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowCollectionDialog(true)} className="text-slate-300 hover:text-white">
            <FolderPlus className="w-4 h-4 mr-2" />
            Collection
          </Button>
          <Button size="sm" variant="ghost" onClick={onExportCSV} className="text-slate-300 hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={onExportJSON} className="text-slate-300 hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
        </div>

        <div className="h-6 w-px bg-slate-600" />

        <Button size="sm" variant="ghost" onClick={onDeselectAll} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Create Custom Collection</DialogTitle>
            <DialogDescription>
              Save {selectedCount} selected models to a custom collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Collection Name</label>
              <Input
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g., My Favorite Text Models"
                className="bg-slate-900 border-slate-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Description (Optional)</label>
              <Textarea
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                placeholder="Describe this collection..."
                className="bg-slate-900 border-slate-700"
                rows={3}
              />
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => navigate('/collections')} className="flex-1">
                View Collections
              </Button>
              <Button variant="outline" onClick={() => setShowCollectionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCollection} disabled={saving}>
                {saving ? 'Creating...' : 'Create Collection'}
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingActionBar;
