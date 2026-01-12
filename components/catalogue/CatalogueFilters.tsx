'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CatalogueFiltersProps {
  language: 'fr' | 'en';
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedUsageType: string;
  setSelectedUsageType: (value: string) => void;
  selectedCapacity: string;
  setSelectedCapacity: (value: string) => void;
  selectedPriceRange: string;
  setSelectedPriceRange: (value: string) => void;
  onHelpClick: () => void;
  categories: Record<string, string>;
}

export default function CatalogueFilters({
  language,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedUsageType,
  setSelectedUsageType,
  selectedCapacity,
  setSelectedCapacity,
  selectedPriceRange,
  setSelectedPriceRange,
  onHelpClick,
  categories,
}: CatalogueFiltersProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const texts = {
    fr: {
      filters: 'Filtres',
      reset: 'Réinitialiser',
      searchPlaceholder: 'Rechercher un produit...',
      usageType: 'Type d\'usage',
      capacity: 'Capacité',
      priceRange: 'Tarifs par jour',
      helpButton: 'Je ne sais pas quoi choisir → Guide rapide',
      event: 'Événement',
      dj: 'DJ',
      capacityOptions: {
        '50-150': '50-150 personnes',
        '100-300': '100-300 personnes',
        '150-500': '150-500 personnes',
      },
      priceOptions: {
        '0-50': '0-50€',
        '50-100': '50-100€',
        '100+': '100€+',
      },
    },
    en: {
      filters: 'Filters',
      reset: 'Reset',
      searchPlaceholder: 'Search for a product...',
      usageType: 'Type of use',
      capacity: 'Capacity',
      priceRange: 'Daily rates',
      helpButton: 'I don\'t know what to choose → Quick guide',
      event: 'Event',
      dj: 'DJ',
      capacityOptions: {
        '50-150': '50-150 people',
        '100-300': '100-300 people',
        '150-500': '150-500 people',
      },
      priceOptions: {
        '0-50': '0-50€',
        '50-100': '50-100€',
        '100+': '100€+',
      },
    },
  };

  const currentTexts = texts[language];

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedUsageType('all');
    setSelectedCapacity('all');
    setSelectedPriceRange('all');
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {language === 'fr' ? 'Recherche' : 'Search'}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentTexts.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          {language === 'fr' ? 'Type d\'événement' : 'Event Type'}
        </label>
        <div className="space-y-2">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key === 'all' ? 'all' : key)}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === key || (key === 'all' && selectedCategory === 'all')
                  ? 'bg-[#F2431E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Usage Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {currentTexts.usageType}
        </label>
        <select
          value={selectedUsageType}
          onChange={(e) => setSelectedUsageType(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
        >
          <option value="all">{language === 'fr' ? 'Tous' : 'All'}</option>
          <option value="event">{currentTexts.event}</option>
          <option value="dj">{currentTexts.dj}</option>
        </select>
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {currentTexts.capacity}
        </label>
        <select
          value={selectedCapacity}
          onChange={(e) => setSelectedCapacity(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
        >
          <option value="all">{language === 'fr' ? 'Tous' : 'All'}</option>
          {Object.entries(currentTexts.capacityOptions).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {currentTexts.priceRange}
        </label>
        <select
          value={selectedPriceRange}
          onChange={(e) => setSelectedPriceRange(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
        >
          <option value="all">{language === 'fr' ? 'Tous' : 'All'}</option>
          {Object.entries(currentTexts.priceOptions).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
      >
        {currentTexts.reset}
      </button>

      {/* Help Button */}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-black">{currentTexts.filters}</h3>
            <button
              onClick={handleReset}
              className="text-sm text-[#F2431E] hover:text-[#E63A1A] font-medium"
            >
              {currentTexts.reset}
            </button>
          </div>
          <FiltersContent />
        </div>
      </aside>

      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {currentTexts.filters}
          </span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer - Slide from left */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed left-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex h-full flex-col">
              <div className="border-b p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-black">{currentTexts.filters}</h3>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <FiltersContent />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
