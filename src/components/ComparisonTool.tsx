import React from 'react';
import { X, TrendingUp, DollarSign, Zap, CheckCircle } from 'lucide-react';
import { AIModel } from '@/data/allModels';
import { Badge } from './ui/badge';

interface ComparisonToolProps {
  models: AIModel[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const ComparisonTool: React.FC<ComparisonToolProps> = ({ models, onRemove, onClear }) => {
  if (models.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 shadow-2xl z-40 max-h-[60vh] overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold text-lg">
            Compare Models ({models.length}/4)
          </h3>
          <button
            onClick={onClear}
            className="text-slate-400 hover:text-white text-sm px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map((model) => (
            <div key={model.id} className="bg-slate-700/50 rounded-lg p-4 relative border border-slate-600">
              <button
                onClick={() => onRemove(model.id)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white bg-slate-800 rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="mb-3">
                <h4 className="text-white font-semibold text-base mb-1 pr-6">{model.name}</h4>
                <p className="text-slate-400 text-xs mb-2">{model.provider}</p>
                <Badge variant="secondary" className="text-xs">
                  {model.category}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs">Performance: {model.performance}/100</span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-300">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs">{model.pricing}</span>
                </div>

                {model.contextWindow && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-xs">Context: {model.contextWindow}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-600">
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.slice(0, 3).map((cap, idx) => (
                      <span key={idx} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {models.length > 1 && (
          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Best Performance:</span>
                <span className="text-white ml-2 font-semibold">
                  {models.reduce((best, m) => m.performance > best.performance ? m : best).name}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Most Affordable:</span>
                <span className="text-white ml-2 font-semibold">
                  {models.reduce((best, m) => {
                    const price = parseFloat(m.pricing.replace(/[^0-9.]/g, '')) || 0;
                    const bestPrice = parseFloat(best.pricing.replace(/[^0-9.]/g, '')) || 0;
                    return price < bestPrice ? m : best;
                  }).name}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Avg Performance:</span>
                <span className="text-white ml-2 font-semibold">
                  {(models.reduce((sum, m) => sum + m.performance, 0) / models.length).toFixed(1)}/100
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonTool;
