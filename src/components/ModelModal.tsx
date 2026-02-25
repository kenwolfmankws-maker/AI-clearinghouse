import React, { useEffect } from 'react';
import { X, Star, Zap, DollarSign } from 'lucide-react';
import { AIModel } from '@/data/allModels';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ModelModalProps {
  model: AIModel | null;
  onClose: () => void;
}

const ModelModal: React.FC<ModelModalProps> = ({ model, onClose }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (model && user) {
      // Increment API usage when viewing model details
      incrementApiUsage();
    }
  }, [model, user]);

  const incrementApiUsage = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('api_calls_count')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      await supabase
        .from('user_profiles')
        .update({ api_calls_count: profile.api_calls_count + 1 })
        .eq('id', user.id);
    }
  };

  if (!model) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{model.name}</h2>
            <p className="text-slate-400">{model.provider}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <img 
            src={model.imageUrl} 
            alt={model.name}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <Star className="w-5 h-5 text-yellow-400 mb-2" />
              <div className="text-2xl font-bold text-white">{model.performance}</div>
              <div className="text-sm text-slate-400">Performance</div>
            </div>
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400 mb-2" />
              <div className="text-lg font-bold text-white">{model.pricing}</div>
              <div className="text-sm text-slate-400">Pricing</div>
            </div>
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <Zap className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-lg font-bold text-white">{model.category}</div>
              <div className="text-sm text-slate-400">Category</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">Description</h3>
            <p className="text-slate-300">{model.description}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {model.capabilities.map((cap) => (
                <span key={cap} className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30">
                  {cap}
                </span>
              ))}
            </div>
          </div>
          
          {model.contextWindow && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Context Window</h3>
              <p className="text-slate-300 font-mono">{model.contextWindow}</p>
            </div>
          )}
          
          <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all">
            Start Integration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelModal;
