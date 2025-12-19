import React, { createContext, useContext, useState } from 'react';
import { AIModel } from '@/data/allModels';

interface BulkSelectionContextType {
  selectedModels: Set<string>;
  toggleModel: (modelId: string) => void;
  selectAll: (modelIds: string[]) => void;
  deselectAll: () => void;
  isSelected: (modelId: string) => boolean;
  getSelectedCount: () => number;
  getSelectedModelObjects: (allModels: AIModel[]) => AIModel[];
}

const BulkSelectionContext = createContext<BulkSelectionContextType | undefined>(undefined);

export const useBulkSelection = () => {
  const context = useContext(BulkSelectionContext);
  if (!context) {
    throw new Error('useBulkSelection must be used within BulkSelectionProvider');
  }
  return context;
};

export const BulkSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return newSet;
    });
  };

  const selectAll = (modelIds: string[]) => {
    setSelectedModels(new Set(modelIds));
  };

  const deselectAll = () => {
    setSelectedModels(new Set());
  };

  const isSelected = (modelId: string) => {
    return selectedModels.has(modelId);
  };

  const getSelectedCount = () => {
    return selectedModels.size;
  };

  const getSelectedModelObjects = (allModels: AIModel[]) => {
    return allModels.filter(model => selectedModels.has(model.id));
  };

  return (
    <BulkSelectionContext.Provider
      value={{
        selectedModels,
        toggleModel,
        selectAll,
        deselectAll,
        isSelected,
        getSelectedCount,
        getSelectedModelObjects,
      }}
    >
      {children}
    </BulkSelectionContext.Provider>
  );
};
