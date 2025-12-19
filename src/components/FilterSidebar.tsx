import React from 'react';

interface FilterSidebarProps {
  selectedCategory: string;
  selectedPricing: string;
  onCategoryChange: (category: string) => void;
  onPricingChange: (pricing: string) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selectedCategory,
  selectedPricing,
  onCategoryChange,
  onPricingChange,
}) => {
  const categories = ['All', 'LLM', 'Vision', 'Audio', 'Code', 'Multimodal'];
  const pricingTiers = ['All', 'free', 'low', 'medium', 'high'];

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Category</h3>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`block w-full text-left px-3 py-2 rounded mb-1 transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      
      <div>
        <h3 className="text-white font-semibold mb-3">Pricing</h3>
        {pricingTiers.map((tier) => (
          <button
            key={tier}
            onClick={() => onPricingChange(tier)}
            className={`block w-full text-left px-3 py-2 rounded mb-1 transition-all capitalize ${
              selectedPricing === tier
                ? 'bg-purple-600 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tier}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterSidebar;
