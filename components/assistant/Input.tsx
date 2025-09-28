// Composant Input pour les champs de saisie
'use client';

import React from 'react';

interface InputProps {
  type: 'text' | 'date' | 'email' | 'tel';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export default function Input({ 
  type, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  error, 
  disabled = false 
}: InputProps) {
  return (
    <div className="w-full">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`
          w-full p-4 rounded-xl border-2 transition-all duration-200
          ${error 
            ? 'border-red-500 bg-red-50' 
            : 'border-gray-200 focus:border-[#e27431] focus:bg-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
          focus:outline-none
        `}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
