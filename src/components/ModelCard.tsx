import React from 'react';
import { Heart, ExternalLink, GitCompare } from 'lucide-react';
import { AIModel } from '@/data/allModels';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';

interface ModelCardProps {
  model: AIModel;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onViewDetails: (model: AIModel) => void;
  onAddToCompare?: (model: AIModel) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}


const ModelCard: React.FC<ModelCardProps> = ({ 
  model, 
  isFavorite, 
  onToggleFavorite,
  onViewDetails,
  onAddToCompare,
  isSelected = false,
  onToggleSelect
}) => {

  const tierColors = {
    free: 'bg-green-500/20 text-green-300 border-green-500/30',
    low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-lg border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-700'} overflow-hidden hover:border-blue-500/50 transition-all group relative`}>
      {onToggleSelect && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(model.id)}
            className="bg-slate-900/80 backdrop-blur-sm border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>
      )}
      <div className="h-48 overflow-hidden relative">
        <img 
          src={model.imageUrl} 
          alt={model.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={() => onToggleFavorite(model.id)}
            className="bg-slate-900/80 backdrop-blur-sm p-2 rounded-full text-slate-400 hover:text-red-400 transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
          </button>
          {onAddToCompare && (
            <button
              onClick={() => onAddToCompare(model)}
              className="bg-slate-900/80 backdrop-blur-sm p-2 rounded-full text-slate-400 hover:text-blue-400 transition-colors"
              title="Add to compare"
            >
              <GitCompare className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-white">{model.name}</h3>
            <p className="text-sm text-slate-400">{model.provider}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {model.category}
          </Badge>
        </div>
        
        <p className="text-slate-300 text-sm mb-3 line-clamp-2">{model.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {model.capabilities.slice(0, 3).map((cap) => (
            <span key={cap} className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">
              {cap}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded text-xs border ${tierColors[model.pricingTier]}`}>
            {model.pricing}
          </span>
          <span className="text-xs text-slate-400">
            Performance: <span className="text-white font-semibold">{model.performance}</span>
          </span>
        </div>
        
        <button
          onClick={() => onViewDetails(model)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          View Details <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ModelCard;
