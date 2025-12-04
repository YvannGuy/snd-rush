'use client';

import { ProductAddon } from '@/types/db';

interface ProductAddonsProps {
  addons: ProductAddon[];
  selectedAddons: ProductAddon[];
  onAddonsChange: (addons: ProductAddon[]) => void;
  language?: 'fr' | 'en';
}

export default function ProductAddons({
  addons,
  selectedAddons,
  onAddonsChange,
  language = 'fr',
}: ProductAddonsProps) {
  const texts = {
    fr: {
      title: 'Options supplémentaires',
      addTechnician: 'Ajouter un technicien',
      addMicrophone: 'Ajouter un micro',
      addDIBox: 'Ajouter une DI box',
    },
    en: {
      title: 'Additional options',
      addTechnician: 'Add a technician',
      addMicrophone: 'Add a microphone',
      addDIBox: 'Add a DI box',
    },
  };

  const currentTexts = texts[language];

  const toggleAddon = (addon: ProductAddon) => {
    const isSelected = selectedAddons.some((a) => a.id === addon.id);
    if (isSelected) {
      onAddonsChange(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      onAddonsChange([...selectedAddons, addon]);
    }
  };

  if (addons.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{currentTexts.title}</h3>
      <div className="space-y-2">
        {addons.map((addon) => {
          const isSelected = selectedAddons.some((a) => a.id === addon.id);
          return (
            <label
              key={addon.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                ${isSelected
                  ? 'border-[#F2431E] bg-[#F2431E]/5'
                  : 'border-gray-200 hover:border-[#F2431E]/50 bg-white'
                }
              `}
            >
              <div className="flex items-center gap-2.5 flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleAddon(addon)}
                  className="w-4 h-4 text-[#F2431E] border-gray-300 rounded focus:ring-[#F2431E]"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{addon.name}</span>
                  {addon.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{addon.description}</p>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-[#F2431E] ml-2">
                {addon.price > 0 ? `+${addon.price}€` : addon.description || ''}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

