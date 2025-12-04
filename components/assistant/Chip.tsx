// Composant Chip pour les options
'use client';

import React from 'react';

interface ChipProps {
  value: string;
  label: string;
  icon?: string;
  price?: number;
  selected?: boolean;
  onClick: (value: string) => void;
  disabled?: boolean;
}

export default function Chip({ 
  value, 
  label, 
  icon, 
  price, 
  selected = false, 
  onClick, 
  disabled = false 
}: ChipProps) {
  return (
    <button
      onClick={() => onClick(value)}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300
        ${selected 
          ? 'border-[#F2431E] bg-gradient-to-r from-[#F2431E]/10 to-[#e27431]/10 text-[#F2431E] shadow-lg scale-[1.02]' 
          : 'border-gray-200 hover:border-[#F2431E]/50 hover:bg-gray-50 text-gray-700 hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-[1.01]'}
      `}
    >
      <div className="flex items-center gap-4">
        {selected && (
          <div className="w-6 h-6 rounded-full bg-[#F2431E] flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
        {!selected && icon && <span className="text-2xl">{icon}</span>}
        {selected && !icon && <div className="w-6 h-6" />}
        <span className="font-semibold text-lg">{label}</span>
      </div>
      {price !== undefined && (
        <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
          selected ? 'bg-[#F2431E] text-white' : 'bg-gray-100 text-gray-700'
        }`}>
          {price > 0 ? `+${price} €` : 'Inclus'}
        </span>
      )}
    </button>
  );
}
