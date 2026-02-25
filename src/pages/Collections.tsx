import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CollectionCard } from '@/components/CollectionCard';
import { EditCollectionModal } from '@/components/EditCollectionModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string;
  model_ids: string[];
  share_token: string | null;
  is_public: boolean;
  shared_with_org: string | null;
  created_at: string;
  updated_at: string;
}


export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCollections();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCollections = async () => {
    try {
      // Fetch user's own collections
      const { data: ownCollections, error: ownError } = await supabase
        .from('custom_collections')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (ownError) throw ownError;

      // Fetch user's organizations
      const { data: orgMemberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user?.id);

      const orgIds = orgMemberships?.map(m => m.organization_id) || [];

      // Fetch collections shared with user's organizations
      let sharedCollections: Collection[] = [];
      if (orgIds.length > 0) {
        const { data: shared, error: sharedError } = await supabase
          .from('custom_collections')
          .select('*')
          .in('shared_with_org', orgIds)
          .neq('user_id', user?.id)
          .order('updated_at', { ascending: false });

        if (!sharedError && shared) {
          sharedCollections = shared;
        }
      }

      // Combine and deduplicate
      const allCollections = [...(ownCollections || []), ...sharedCollections];
      setCollections(allCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h2 className="text-2xl font-bold text-white mb-4">Sign in to view collections</h2>
            <p className="text-slate-400">Create an account to save and manage your model collections</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Collections</h1>
              <p className="text-slate-400">Organize and manage your AI model collections</p>
            </div>
            <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-white mb-2">No collections yet</h3>
              <p className="text-slate-400 mb-4">Start by selecting models and creating your first collection</p>
              <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-blue-500 to-purple-600">
                Browse Models
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onEdit={setEditingCollection}
                  onUpdate={fetchCollections}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
      {editingCollection && (
        <EditCollectionModal
          collection={editingCollection}
          isOpen={!!editingCollection}
          onClose={() => setEditingCollection(null)}
          onUpdate={fetchCollections}
        />
      )}
    </div>
  );
}
