import { useState, useEffect } from 'react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Share2, Copy, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Collection } from '@/pages/Collections';
import { allModels } from '@/data/allModels';
import { OrgShareToggle } from '@/components/OrgShareToggle';
import { useAuth } from '@/contexts/AuthContext';
import { logAuditEvent } from '@/lib/auditLogger';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface CollectionCardProps {
  collection: Collection;
  onEdit: (collection: Collection) => void;
  onUpdate: () => void;
}

export const CollectionCard = ({ collection, onEdit, onUpdate }: CollectionCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isOwner = collection.user_id === user?.id;
  const isSharedWithOrg = !!collection.shared_with_org;

  useEffect(() => {
    if (isSharedWithOrg && !isOwner) {
      fetchUserRole();
    }
  }, [collection.shared_with_org, user?.id]);

  const fetchUserRole = async () => {
    const { data } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', collection.shared_with_org)
      .eq('user_id', user?.id)
      .single();
    
    if (data) setUserRole(data.role);
  };

  const canEdit = isOwner || userRole === 'admin';
  const canDelete = isOwner;


  const collectionModels = allModels.filter(m => collection.model_ids.includes(m.id));
  const previewModels = collectionModels.slice(0, 4);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('custom_collections')
        .delete()
        .eq('id', collection.id);

      if (error) throw error;

      // Log audit event
      await logAuditEvent({
        actionType: 'collection.deleted',
        actionDetails: `Deleted collection: ${collection.name}`,
        resourceType: 'collection',
        resourceId: collection.id,
        metadata: { collectionName: collection.name, modelCount: collection.model_ids.length }
      });

      toast({
        title: 'Collection deleted',
        description: 'Your collection has been removed',
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete collection',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };


  const handleDuplicate = async () => {
    try {
      const { error } = await supabase
        .from('custom_collections')
        .insert({
          user_id: collection.user_id,
          name: `${collection.name} (Copy)`,
          description: collection.description,
          model_ids: collection.model_ids,
        });

      if (error) throw error;

      toast({
        title: 'Collection duplicated',
        description: 'A copy has been created',
      });
      onUpdate();
    } catch (error) {
      console.error('Error duplicating collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate collection',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      let shareToken = collection.share_token;
      
      if (!shareToken) {
        shareToken = crypto.randomUUID();
        const { error } = await supabase
          .from('custom_collections')
          .update({ share_token: shareToken, is_public: true })
          .eq('id', collection.id);

        if (error) throw error;
      }

      const shareUrl = `${window.location.origin}/collections/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
      });
      onUpdate();
    } catch (error) {
      console.error('Error sharing collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  const togglePublic = async () => {
    try {
      const { error } = await supabase
        .from('custom_collections')
        .update({ is_public: !collection.is_public })
        .eq('id', collection.id);

      if (error) throw error;

      toast({
        title: collection.is_public ? 'Collection made private' : 'Collection made public',
      });
      onUpdate();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-blue-500/50 transition-all">
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">{collection.name}</h3>
              <p className="text-sm text-slate-400 line-clamp-2">{collection.description}</p>
            </div>
            <div className="flex gap-2 ml-2">
              {collection.is_public && (
                <Badge variant="secondary">Public</Badge>
              )}
              {!isOwner && isSharedWithOrg && (
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Shared {userRole ? `(${userRole})` : ''}
                </Badge>
              )}
            </div>
          </div>


          <div className="grid grid-cols-4 gap-2 mb-4">
            {previewModels.map((model) => (
              <div key={model.id} className="aspect-square bg-slate-700/50 rounded flex items-center justify-center">
                <span className="text-xs text-slate-400 text-center px-1">{model.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {collection.model_ids.length} models
            </Badge>
            <span className="text-xs text-slate-500">
              {new Date(collection.updated_at).toLocaleDateString()}
            </span>
          </div>

          {isOwner && (
            <div className="mb-4">
              <OrgShareToggle
                itemId={collection.id}
                itemType="collection"
                currentOrgId={collection.shared_with_org}
                userId={user?.id || ''}
                onUpdate={onUpdate}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(collection)} disabled={!canEdit} className="flex-1">
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={handleShare} disabled={sharing || !canEdit}>
              <Share2 className="w-3 h-3 mr-1" />
              Share
            </Button>
            <Button size="sm" variant="outline" onClick={togglePublic} disabled={!canEdit}>
              {collection.is_public ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDuplicate}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={!canDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>


        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{collection.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
