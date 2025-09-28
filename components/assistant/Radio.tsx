// Composant Radio pour les sélections uniques
'use client';

import React from 'react';

interface RadioProps {
  value: string;
  label: string;
  icon?: string;
  price?: number;
  selected?: boolean;
  onClick: (value: string) => void;
  disabled?: boolean;
}

export default function Radio({ 
  value, 
  label, 
  icon, 
  price, 
  selected = false, 
  onClick, 
  disabled = false 
}: RadioProps) {
  return (
    <button
      onClick={() => onClick(value)}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200
        ${selected 
          ? 'border-[#e27431] bg-[#e27431]/10 text-[#e27431]' 
          : 'border-gray-200 hover:border-[#e27431] hover:bg-gray-50 text-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center
          ${selected ? 'border-[#e27431] bg-[#e27431]' : 'border-gray-300'}
        `}>
          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
        {icon && <span className="text-xl">{icon}</span>}
        <span className="font-medium">{label}</span>
      </div>
      {price !== undefined && (
        <span className="text-sm font-semibold">
          {price > 0 ? `+${price} €` : 'Inclus'}
        </span>
      )}
    </button>
  );
}
