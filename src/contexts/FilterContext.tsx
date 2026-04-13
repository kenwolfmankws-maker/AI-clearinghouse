import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
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

  // Supabase removed: presets are now local/in-memory only (per-session).
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  useEffect(() => {
    // With auth/db removed, do not attempt loading presets.
    // Keep behavior deterministic: clear presets when user changes.
    setPresets([]);
  }, [user]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(defaultFilters);

  const savePreset = async (name: string) => {
    if (!user) {
      toast.error('Please sign in to save presets');
      return;
    }

    // Auth/db removed: cannot persist. Save in-memory so UI still works during this session.
    const newPreset: FilterPreset = {
      id: `local_${crypto.randomUUID()}`,
      name,
      filters,
    };

    setPresets((prev) => [newPreset, ...prev]);
    toast.success(`Preset "${name}" saved (local only)`);
  };

  const loadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const deletePreset = async (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    toast.success('Preset deleted');
  };

  const activeFilterCount =
    filters.providers.length +
    filters.modelTypes.length +
    filters.useCases.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100 ? 1 : 0) +
    (filters.performanceRange[0] > 0 || filters.performanceRange[1] < 100 ? 1 : 0);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        presets,
        savePreset,
        loadPreset,
        deletePreset,
        activeFilterCount,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};
