import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { allModels } from '@/data/allModels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Twitter, Linkedin, ArrowLeft, FolderPlus, Loader2 } from 'lucide-react';
import ModelCard from '@/components/ModelCard';

export default function SharedCollection() {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  const fetchCollection = async () => {
    // Supabase removed: shared collections are disabled without a backend.
    // Keep behavior deterministic and non-crashy.
    setCollection(null);
    setLoading(false);
  };

  const collectionModels = collection
    ? allModels.filter((m) => collection.model_ids.includes(m.id))
    : [];

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const shareTwitter = () => {
    const text = `Check out this AI model collection: ${collection?.name || 'AI model collection'}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
        window.location.href
      )}`
    );
  };

  const shareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
    );
  };

  const copyToMyCollections = async () => {
    // Supabase removed: copying requires a backend.
    if (!user) return;

    setCopying(true);
    try {
      // No-op: feature disabled
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Shared Collections Unavailable</h2>
          <p className="text-muted-foreground mb-4">
            This feature was disabled because authentication/database integration was removed.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{collection.name}</h1>
              <p className="text-lg text-muted-foreground">{collection.description}</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {collectionModels.length} models
            </Badge>
          </div>

          <div className="flex gap-2 mt-6">
            {user && (
              <Button onClick={copyToMyCollections} disabled={copying}>
                {copying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FolderPlus className="mr-2 h-4 w-4" />
                )}
                Copy to My Collections
              </Button>
            )}
            <Button variant="outline" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" /> Copy Link
            </Button>
            <Button variant="outline" onClick={shareTwitter}>
              <Twitter className="mr-2 h-4 w-4" /> Twitter
            </Button>
            <Button variant="outline" onClick={shareLinkedIn}>
              <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collectionModels.map((model: any) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      </div>
    </div>
  );
}
