import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save, Trash2, Filter } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

const providers = ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Cohere', 'Mistral', 'Stability AI'];
const modelTypes = ['Text', 'Image', 'Audio', 'Video', 'Code', 'Multimodal'];
const useCases = ['Chat', 'Analysis', 'Generation', 'Translation', 'Summarization', 'Research'];

const AdvancedFilterSidebar: React.FC = () => {
  const { filters, updateFilter, clearFilters, presets, savePreset, loadPreset, deletePreset, activeFilterCount } = useFilters();
  const [openSections, setOpenSections] = useState({
    providers: true, types: true, pricing: true,
    performance: false, useCases: false, presets: false,
  });
  const [presetName, setPresetName] = useState('');

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleProvider = (provider: string) => {
    const newProviders = filters.providers.includes(provider)
      ? filters.providers.filter(p => p !== provider) : [...filters.providers, provider];
    updateFilter('providers', newProviders);
  };

  const toggleModelType = (type: string) => {
    const newTypes = filters.modelTypes.includes(type)
      ? filters.modelTypes.filter(t => t !== type) : [...filters.modelTypes, type];
    updateFilter('modelTypes', newTypes);
  };

  const toggleUseCase = (useCase: string) => {
    const newUseCases = filters.useCases.includes(useCase)
      ? filters.useCases.filter(u => u !== useCase) : [...filters.useCases, useCase];
    updateFilter('useCases', newUseCases);
  };

  const handleSavePreset = async () => {
    if (presetName.trim()) {
      await savePreset(presetName);
      setPresetName('');
    }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-4 border border-slate-700 space-y-3 sticky top-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold text-lg">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-blue-600 text-white">{activeFilterCount}</Badge>
          )}
        </div>
        <Button onClick={clearFilters} variant="ghost" size="sm" className="text-xs hover:bg-slate-700">
          Clear All
        </Button>
      </div>

      <Collapsible open={openSections.providers} onOpenChange={() => toggleSection('providers')}>
        <CollapsibleTrigger className="flex justify-between items-center w-full text-white font-medium py-2">
          <span>Providers</span>
          {openSections.providers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {providers.map(provider => (
            <div key={provider} className="flex items-center space-x-2">
              <Checkbox id={provider} checked={filters.providers.includes(provider)}
                onCheckedChange={() => toggleProvider(provider)} />
              <label htmlFor={provider} className="text-sm text-slate-300 cursor-pointer">{provider}</label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSections.types} onOpenChange={() => toggleSection('types')}>
        <CollapsibleTrigger className="flex justify-between items-center w-full text-white font-medium py-2">
          <span>Model Types</span>
          {openSections.types ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {modelTypes.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox id={type} checked={filters.modelTypes.includes(type)}
                onCheckedChange={() => toggleModelType(type)} />
              <label htmlFor={type} className="text-sm text-slate-300 cursor-pointer">{type}</label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSections.pricing} onOpenChange={() => toggleSection('pricing')}>
        <CollapsibleTrigger className="flex justify-between items-center w-full text-white font-medium py-2">
          <span>Price Range</span>
          {openSections.pricing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-2">
            <div className="text-sm text-slate-300">${filters.priceRange[0]} - ${filters.priceRange[1]}</div>
            <Slider value={filters.priceRange} onValueChange={(value) => updateFilter('priceRange', value)}
              min={0} max={100} step={5} className="w-full" />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSections.performance} onOpenChange={() => toggleSection('performance')}>
        <CollapsibleTrigger className="flex justify-between items-center w-full text-white font-medium py-2">
          <span>Performance</span>
          {openSections.performance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-2">
            <div className="text-sm text-slate-300">{filters.performanceRange[0]} - {filters.performanceRange[1]}</div>
            <Slider value={filters.performanceRange} onValueChange={(value) => updateFilter('performanceRange', value)}
              min={0} max={100} step={5} className="w-full" />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSections.useCases} onOpenChange={() => toggleSection('useCases')}>
        <CollapsibleTrigger className="flex justify-between items-center w-full text-white font-medium py-2">
          <span>Use Cases</span>
          {openSections.useCases ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {useCases.map(useCase => (
            <div key={useCase} className="flex items-center space-x-2">
              <Checkbox id={useCase} checked={filters.useCases.includes(useCase)}
                onCheckedChange={() => toggleUseCase(useCase)} />
              <label htmlFor={useCase} className="text-sm text-slate-300 cursor-pointer">{useCase}</label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <div className="pt-2 border-t border-slate-700">
        <div className="flex gap-2">
          <Input placeholder="Preset name" value={presetName} onChange={(e) => setPresetName(e.target.value)}
            className="flex-1 bg-slate-700 border-slate-600 text-white" />
          <Button onClick={handleSavePreset} size="sm" disabled={!presetName.trim()}>
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {presets.length > 0 && (
        <Collapsible open={openSections.presets} onOpenChange={() => toggleSection('presets')}>
          <CollapsibleTrigger className="flex justify-between items-center w-full text-white font-medium py-2">
            <span>Saved Presets</span>
            {openSections.presets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {presets.map(preset => (
              <div key={preset.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
                <button onClick={() => loadPreset(preset)} className="text-sm text-slate-300 hover:text-white flex-1 text-left">
                  {preset.name}
                </button>
                <button onClick={() => deletePreset(preset.id)} className="text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default AdvancedFilterSidebar;
