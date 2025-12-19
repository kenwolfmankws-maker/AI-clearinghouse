import React from 'react';
import { X } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { Badge } from './ui/badge';

const ActiveFilterBadges: React.FC = () => {
  const { filters, updateFilter, clearFilters, activeFilterCount } = useFilters();

  if (activeFilterCount === 0) return null;

  const removeBadge = (type: 'provider' | 'modelType' | 'useCase', value: string) => {
    if (type === 'provider') {
      updateFilter('providers', filters.providers.filter(p => p !== value));
    } else if (type === 'modelType') {
      updateFilter('modelTypes', filters.modelTypes.filter(m => m !== value));
    } else if (type === 'useCase') {
      updateFilter('useCases', filters.useCases.filter(u => u !== value));
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.providers.map(provider => (
        <Badge key={provider} variant="secondary" className="bg-blue-600 text-white">
          {provider}
          <button onClick={() => removeBadge('provider', provider)} className="ml-2">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {filters.modelTypes.map(type => (
        <Badge key={type} variant="secondary" className="bg-purple-600 text-white">
          {type}
          <button onClick={() => removeBadge('modelType', type)} className="ml-2">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {filters.useCases.map(useCase => (
        <Badge key={useCase} variant="secondary" className="bg-green-600 text-white">
          {useCase}
          <button onClick={() => removeBadge('useCase', useCase)} className="ml-2">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100) && (
        <Badge variant="secondary" className="bg-orange-600 text-white">
          Price: ${filters.priceRange[0]}-${filters.priceRange[1]}
          <button onClick={() => updateFilter('priceRange', [0, 100])} className="ml-2">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      {(filters.performanceRange[0] > 0 || filters.performanceRange[1] < 100) && (
        <Badge variant="secondary" className="bg-pink-600 text-white">
          Performance: {filters.performanceRange[0]}-{filters.performanceRange[1]}
          <button onClick={() => updateFilter('performanceRange', [0, 100])} className="ml-2">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      <button
        onClick={clearFilters}
        className="text-sm text-slate-400 hover:text-white underline"
      >
        Clear all filters
      </button>
    </div>
  );
};

export default ActiveFilterBadges;
