import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface FilterState {
  providers: string[];
  modelTypes: string[];
  priceRange: [number, number];
  performanceRange: [number, number];
  useCases: string[];
  contextWindow?: string;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: any) => void;
  clearFilters: () => void;
  presets: FilterPreset[];
  savePreset: (name: string) => Promise<void>;
  loadPreset: (preset: FilterPreset) => void;
  deletePreset: (id: string) => Promise<void>;
  activeFilterCount: number;
}

const defaultFilters: FilterState = {
  providers: [],
  modelTypes: [],
  priceRange: [0, 100],
  performanceRange: [0, 100],
  useCases: [],
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within FilterProvider');
  return context;
};

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  useEffect(() => {
    if (user) loadPresets();
  }, [user]);

  const loadPresets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('filter_presets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setPresets(data.map(p => ({ id: p.id, name: p.name, filters: p.filters })));
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(defaultFilters);

  const savePreset = async (name: string) => {
    if (!user) {
      toast.error('Please sign in to save presets');
      return;
    }
    const { data, error } = await supabase
      .from('filter_presets')
      .insert({ user_id: user.id, name, filters })
      .select()
      .single();
    if (error) {
      toast.error('Failed to save preset');
    } else {
      setPresets(prev => [{ id: data.id, name: data.name, filters: data.filters }, ...prev]);
      toast.success(`Preset "${name}" saved`);
    }
  };

  const loadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const deletePreset = async (id: string) => {
    const { error } = await supabase.from('filter_presets').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete preset');
    } else {
      setPresets(prev => prev.filter(p => p.id !== id));
      toast.success('Preset deleted');
    }
  };

  const activeFilterCount = 
    filters.providers.length +
    filters.modelTypes.length +
    filters.useCases.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100 ? 1 : 0) +
    (filters.performanceRange[0] > 0 || filters.performanceRange[1] < 100 ? 1 : 0);

  return (
    <FilterContext.Provider value={{
      filters,
      setFilters,
      updateFilter,
      clearFilters,
      presets,
      savePreset,
      loadPreset,
      deletePreset,
      activeFilterCount,
    }}>
      {children}
    </FilterContext.Provider>
  );
};
