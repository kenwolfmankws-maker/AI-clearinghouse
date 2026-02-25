import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/contexts/FilterContext';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Hero from './Hero';
import SearchBar from './SearchBar';
import AdvancedFilterSidebar from './AdvancedFilterSidebar';
import ActiveFilterBadges from './ActiveFilterBadges';
import ModelCard from './ModelCard';
import ModelModal from './ModelModal';
import StatsSection from './StatsSection';
import ComparisonTool from './ComparisonTool';
import FloatingActionBar from './FloatingActionBar';
import Footer from './Footer';
import { Header } from './Header';
import { AIChatAssistant } from './AIChatAssistant';
import { AudioGreetingPlayer } from './AudioGreetingPlayer';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { allAIModels, AIModel } from '@/data/allModels';
import { toast as sonnerToast } from 'sonner';
import { Button } from './ui/button';
import { CheckSquare, Square } from 'lucide-react';



const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { filters, updateFilter } = useFilters();
  const bulkSelection = useBulkSelection();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [compareModels, setCompareModels] = useState<AIModel[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const modelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadFavorites();
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
    if (data) setUserProfile(data);
  };

  const loadFavorites = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_favorites').select('model_id').eq('user_id', user.id);
    if (data) setFavorites(data.map(f => f.model_id));
  };


  const filteredModels = useMemo(() => {
    return allAIModels.filter((model) => {
      const matchesSearch = 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesProvider = filters.providers.length === 0 || filters.providers.includes(model.provider);
      const matchesType = filters.modelTypes.length === 0 || 
        filters.modelTypes.some(type => model.capabilities.includes(type) || model.category.includes(type));
      
      const priceValue = parseFloat(model.pricing.replace(/[^0-9.]/g, '')) || 0;
      const matchesPrice = priceValue >= filters.priceRange[0] && priceValue <= filters.priceRange[1];
      
      const matchesPerformance = model.performance >= filters.performanceRange[0] && 
        model.performance <= filters.performanceRange[1];
      
      const matchesUseCase = filters.useCases.length === 0 ||
        filters.useCases.some(useCase => 
          model.capabilities.some(cap => cap.toLowerCase().includes(useCase.toLowerCase())) ||
          model.description.toLowerCase().includes(useCase.toLowerCase())
        );
      
      return matchesSearch && matchesProvider && matchesType && matchesPrice && 
        matchesPerformance && matchesUseCase;
    });
  }, [searchQuery, filters]);

  const toggleFavorite = async (id: string) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to save favorites', variant: 'destructive' });
      return;
    }

    const isFavorite = favorites.includes(id);
    
    if (isFavorite) {
      await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('model_id', id);
      setFavorites(prev => prev.filter(fav => fav !== id));
      toast({ title: 'Removed from favorites' });
    } else {
      await supabase.from('user_favorites').insert({ user_id: user.id, model_id: id });
      setFavorites(prev => [...prev, id]);
      toast({ title: 'Added to favorites' });
    }
  };

  const handleExplore = () => {
    modelsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addToCompare = (model: AIModel) => {
    if (compareModels.length >= 4) {
      sonnerToast.error('Maximum 4 models can be compared');
      return;
    }
    if (compareModels.find(m => m.id === model.id)) {
      sonnerToast.info('Model already in comparison');
      return;
    }
    setCompareModels([...compareModels, model]);
    sonnerToast.success(`${model.name} added to comparison`);
  };

  // Bulk action handlers
  const handleBulkAddToComparison = () => {
    const selected = bulkSelection.getSelectedModelObjects(allAIModels);
    if (selected.length === 0) return;
    
    if (selected.length > 4) {
      sonnerToast.error('Maximum 4 models can be compared at once');
      return;
    }
    
    setCompareModels(selected.slice(0, 4));
    bulkSelection.deselectAll();
    sonnerToast.success(`${selected.length} models added to comparison`);
  };

  const handleBulkAddToFavorites = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to save favorites', variant: 'destructive' });
      return;
    }

    const selected = bulkSelection.getSelectedModelObjects(allAIModels);
    if (selected.length === 0) return;

    const newFavorites = selected.filter(m => !favorites.includes(m.id));
    
    for (const model of newFavorites) {
      await supabase.from('user_favorites').insert({ user_id: user.id, model_id: model.id });
    }
    
    setFavorites(prev => [...prev, ...newFavorites.map(m => m.id)]);
    bulkSelection.deselectAll();
    sonnerToast.success(`${newFavorites.length} models added to favorites`);
  };

  const handleBulkExportCSV = () => {
    const selected = bulkSelection.getSelectedModelObjects(allAIModels);
    if (selected.length === 0) return;

    const headers = ['Name', 'Provider', 'Category', 'Pricing', 'Performance', 'Description'];
    const rows = selected.map(m => [
      m.name,
      m.provider,
      m.category,
      m.pricing,
      m.performance.toString(),
      m.description
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-models-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    sonnerToast.success('CSV exported successfully');
  };

  const handleBulkExportJSON = () => {
    const selected = bulkSelection.getSelectedModelObjects(allAIModels);
    if (selected.length === 0) return;

    const json = JSON.stringify(selected, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-models-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    sonnerToast.success('JSON exported successfully');
  };

  // Audio URLs - NOTE: OneDrive links need to be converted to direct download URLs
  // To convert OneDrive share link to direct download:
  // 1. Get the share link ID from the URL
  // 2. Use format: https://api.onedrive.com/v1.0/shares/u!{base64_encoded_url}/root/content
  // Or use OneDrive's "Embed" feature to get a direct link
  const rachelGreetingUrl = "https://1drv.ms/u/c/cdee4f8d416221bb/EaE6JmpBn0hKpGvvk-tDK4EBG9QPxxbrEymsd5HOwPc9OQ?e=gF0fmT";
  const backgroundMusicUrl = "https://1drv.ms/u/c/cdee4f8d416221bb/EaE6JmpBn0hKpGvvk-tDK4EBG9QPxxbrEymsd5HOwPc9OQ?e=gF0fmT";



  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <Hero onExplore={handleExplore} />
      <StatsSection />
      
      {/* Email Verification Banner - Show when user is logged in but not verified */}
      {user && userProfile && !userProfile.email_verified && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <EmailVerificationBanner 
            isVerified={userProfile.email_verified || false}
            userEmail={user.email || ''}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12" ref={modelsRef}>
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            Explore AI Models
          </h2>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        
        <div className="flex gap-8">
          <div className="w-80 flex-shrink-0">
            <AdvancedFilterSidebar />
          </div>
          
          <div className="flex-1">
            <ActiveFilterBadges />
            <div className="flex items-center justify-between mb-4">
              <div className="text-slate-400">
                Found {filteredModels.length} models
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkSelection.selectAll(filteredModels.map(m => m.id))}
                  className="text-slate-300 border-slate-600 hover:bg-slate-700"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkSelection.deselectAll()}
                  className="text-slate-300 border-slate-600 hover:bg-slate-700"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isFavorite={favorites.includes(model.id)}
                  onToggleFavorite={toggleFavorite}
                  onViewDetails={setSelectedModel}
                  onAddToCompare={addToCompare}
                  isSelected={bulkSelection.isSelected(model.id)}
                  onToggleSelect={bulkSelection.toggleModel}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <FloatingActionBar
        selectedCount={bulkSelection.getSelectedCount()}
        selectedModels={bulkSelection.getSelectedModelObjects(allAIModels)}
        onAddToComparison={handleBulkAddToComparison}
        onAddToFavorites={handleBulkAddToFavorites}
        onExportCSV={handleBulkExportCSV}
        onExportJSON={handleBulkExportJSON}
        onDeselectAll={bulkSelection.deselectAll}
      />
      
      <ModelModal model={selectedModel} onClose={() => setSelectedModel(null)} />
      <ComparisonTool 
        models={compareModels}
        onRemove={(id) => setCompareModels(compareModels.filter(m => m.id !== id))}
        onClear={() => setCompareModels([])}
      />
      <AIChatAssistant onFilterApply={(aiFilters) => {
        // Apply AI-suggested filters to the filter context
        if (aiFilters.provider) {
          updateFilter('providers', [aiFilters.provider]);
          sonnerToast.success(`Filtering by ${aiFilters.provider} models`);
        }
        if (aiFilters.category) {
          updateFilter('modelTypes', [aiFilters.category]);
          sonnerToast.success(`Showing ${aiFilters.category} models`);
        }
        if (aiFilters.pricingTier) {
          // Map pricing tier to price range
          const priceRanges: Record<string, [number, number]> = {
            free: [0, 0],
            low: [0, 0.01],
            medium: [0.01, 0.05],
            high: [0.05, 100]
          };
          const range = priceRanges[aiFilters.pricingTier] || [0, 100];
          updateFilter('priceRange', range);
          sonnerToast.success(`Filtering by ${aiFilters.pricingTier} pricing tier`);
        }
        // Scroll to models section
        modelsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }} />

      {/* Audio Greeting Player */}
      <AudioGreetingPlayer 
        greetingUrl={rachelGreetingUrl}
        backgroundMusicUrl={backgroundMusicUrl}
      />

      <Footer />
    </div>
  );
};

export default AppLayout;
