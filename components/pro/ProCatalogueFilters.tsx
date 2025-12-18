'use client';

import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProCatalogueFiltersProps {
  language: 'fr' | 'en';
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedSubCategories: string[];
  setSelectedSubCategories: (categories: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onReset: () => void;
  productCount: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

// Catégories principales et leurs sous-catégories
const CATEGORIES = {
  sonorisation: {
    label: { fr: 'Sonorisation', en: 'Sound System' },
    subCategories: {
      enceintes_actives: { fr: 'Enceintes actives', en: 'Active speakers' },
      enceintes_passives: { fr: 'Enceintes passives', en: 'Passive speakers' },
      caissons: { fr: 'Caissons de basses', en: 'Subwoofers' },
      consoles_mixage: { fr: 'Consoles de mixage', en: 'Mixing consoles' },
    },
  },
  dj: {
    label: { fr: 'DJ', en: 'DJ' },
    subCategories: {
      platines: { fr: 'Platines DJ', en: 'DJ turntables' },
      controleurs: { fr: 'Contrôleurs DJ', en: 'DJ controllers' },
      mixeurs_dj: { fr: 'Mixeurs DJ', en: 'DJ mixers' },
      accessoires_dj: { fr: 'Accessoires DJ', en: 'DJ accessories' },
    },
  },
  lumieres: {
    label: { fr: 'Lumières', en: 'Lights' },
    subCategories: {
      led: { fr: 'Éclairage LED', en: 'LED lighting' },
      projecteurs: { fr: 'Projecteurs', en: 'Projectors' },
      effets: { fr: 'Effets lumineux', en: 'Light effects' },
    },
  },
  micros: {
    label: { fr: 'Micros', en: 'Microphones' },
    subCategories: {
      filaire: { fr: 'Micros filaires', en: 'Wired microphones' },
      sans_fil: { fr: 'Micros sans fil', en: 'Wireless microphones' },
      cravate: { fr: 'Micros cravate', en: 'Lavalier microphones' },
    },
  },
  accessoires: {
    label: { fr: 'Accessoires', en: 'Accessories' },
    subCategories: {
      cables: { fr: 'Câbles', en: 'Cables' },
      pieds: { fr: 'Pieds et supports', en: 'Stands and supports' },
      adaptateurs: { fr: 'Adaptateurs', en: 'Adapters' },
    },
  },
};

// Plages de prix prédéfinies
const PRICE_RANGES = [
  { id: '0-50', label: { fr: '0€ - 50€', en: '€0 - €50' }, min: 0, max: 50 },
  { id: '50-100', label: { fr: '50€ - 100€', en: '€50 - €100' }, min: 50, max: 100 },
  { id: '100-200', label: { fr: '100€ - 200€', en: '€100 - €200' }, min: 100, max: 200 },
  { id: '200-500', label: { fr: '200€ - 500€', en: '€200 - €500' }, min: 200, max: 500 },
  { id: '500+', label: { fr: '500€ et plus', en: '€500+' }, min: 500, max: Infinity },
];

export default function ProCatalogueFilters({
  language,
  selectedCategories,
  setSelectedCategories,
  selectedSubCategories,
  setSelectedSubCategories,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  onReset,
  productCount,
  isMobileOpen,
  setIsMobileOpen,
}: ProCatalogueFiltersProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
      // Retirer aussi les sous-catégories de cette catégorie
      const categoryData = CATEGORIES[category as keyof typeof CATEGORIES];
      if (categoryData) {
        const subCatKeys = Object.keys(categoryData.subCategories);
        setSelectedSubCategories(
          selectedSubCategories.filter((sc) => !subCatKeys.includes(sc))
        );
      }
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleSubCategory = (subCategory: string) => {
    if (selectedSubCategories.includes(subCategory)) {
      setSelectedSubCategories(selectedSubCategories.filter((sc) => sc !== subCategory));
    } else {
      setSelectedSubCategories([...selectedSubCategories, subCategory]);
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

  const handlePriceRangeChange = (rangeId: string) => {
    const range = PRICE_RANGES.find((r) => r.id === rangeId);
    if (range) {
      // Pour la plage "500+", utiliser une valeur très élevée pour le max
      const maxValue = range.max === Infinity ? 10000 : range.max;
      setPriceRange([range.min, maxValue]);
    }
  };

  const texts = {
    fr: {
      filters: 'Filtres',
      categories: 'Catégories',
      subCategories: 'Sous-catégories',
      price: 'Prix',
      priceRange: 'Plage de prix',
      customPrice: 'Prix personnalisé',
      sortBy: 'Trier par',
      sortPriceAsc: 'Prix croissant',
      sortPriceDesc: 'Prix décroissant',
      sortNameAsc: 'Nom A-Z',
      sortNameDesc: 'Nom Z-A',
      reset: 'Réinitialiser',
      results: 'produits trouvés',
      min: 'Min',
      max: 'Max',
      apply: 'Appliquer',
    },
    en: {
      filters: 'Filters',
      categories: 'Categories',
      subCategories: 'Sub-categories',
      price: 'Price',
      priceRange: 'Price range',
      customPrice: 'Custom price',
      sortBy: 'Sort by',
      sortPriceAsc: 'Price ascending',
      sortPriceDesc: 'Price descending',
      sortNameAsc: 'Name A-Z',
      sortNameDesc: 'Name Z-A',
      reset: 'Reset',
      results: 'products found',
      min: 'Min',
      max: 'Max',
      apply: 'Apply',
    },
  };

  const currentTexts = texts[language];

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">{currentTexts.filters}</h2>
        <button
          onClick={onReset}
          className="text-sm text-[#F2431E] hover:text-[#E63A1A] font-medium"
        >
          {currentTexts.reset}
        </button>
      </div>

      {/* Product Count */}
      <div className="text-sm text-gray-600">
        <span className="font-semibold">{productCount}</span> {currentTexts.results}
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{currentTexts.categories}</h3>
        <div className="space-y-2">
          {Object.entries(CATEGORIES).map(([key, categoryData]) => {
            const isSelected = selectedCategories.includes(key);
            const isExpanded = expandedCategories[key];

            return (
              <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleCategory(key)}
                    className={`flex-1 text-left px-4 py-3 transition-colors ${
                      isSelected
                        ? 'bg-[#F2431E] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{categoryData.label[language]}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategoryExpansion(key);
                    }}
                    className={`px-3 py-3 transition-colors ${
                      isSelected
                        ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Sub-categories */}
                {isExpanded && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-1">
                      {Object.entries(categoryData.subCategories).map(([subKey, subLabel]) => {
                        const isSubSelected = selectedSubCategories.includes(subKey);
                        return (
                          <button
                            key={subKey}
                            onClick={() => toggleSubCategory(subKey)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              isSubSelected
                                ? 'bg-[#F2431E] text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {subLabel[language]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{currentTexts.priceRange}</h3>
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => {
            // Vérifier si la plage est sélectionnée
            let isSelected = false;
            if (range.id === '500+') {
              // Pour "500+", vérifier que le min est >= 500 et le max est >= 10000 (valeur Infinity)
              isSelected = priceRange[0] >= 500 && priceRange[1] >= 10000;
            } else {
              // Pour les autres plages, vérifier que min et max correspondent exactement
              isSelected = priceRange[0] === range.min && priceRange[1] === range.max;
            }

            return (
              <button
                key={range.id}
                onClick={() => handlePriceRangeChange(range.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-[#F2431E] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {range.label[language]}
              </button>
            );
          })}
        </div>

        {/* Custom Price Range */}
        <div className="mt-4 space-y-2">
          <label className="text-xs text-gray-600">{currentTexts.customPrice}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              placeholder={currentTexts.min}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min={priceRange[0]}
              value={priceRange[1] === 10000 ? '' : priceRange[1]}
              onChange={(e) =>
                setPriceRange([priceRange[0], e.target.value ? Number(e.target.value) : 10000])
              }
              placeholder={currentTexts.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{currentTexts.sortBy}</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
        >
          <option value="name_asc">{currentTexts.sortNameAsc}</option>
          <option value="name_desc">{currentTexts.sortNameDesc}</option>
          <option value="price_asc">{currentTexts.sortPriceAsc}</option>
          <option value="price_desc">{currentTexts.sortPriceDesc}</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {currentTexts.filters}
          {productCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-[#F2431E] text-white text-xs rounded-full">
              {productCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Filter Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{currentTexts.filters}</h2>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FiltersContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-lg border border-gray-200 p-6">
          <FiltersContent />
        </div>
      </div>
    </>
  );
}
