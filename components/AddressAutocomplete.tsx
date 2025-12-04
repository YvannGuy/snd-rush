'use client';

import { useState, useEffect, useRef } from 'react';

interface AddressSuggestion {
  label: string;
  value: string;
  city: string;
  postcode: string;
  street: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Commencez à taper une adresse...',
  className = '',
  id,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Rechercher des adresses avec l'API BAN
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&type=housenumber&autocomplete=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const formattedSuggestions: AddressSuggestion[] = data.features.map((feature: any) => {
          const properties = feature.properties;
          return {
            label: properties.label,
            value: properties.label,
            city: properties.city,
            postcode: properties.postcode,
            street: properties.street || '',
          };
        });
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer le changement de texte
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchAddresses(newValue);
  };

  // Sélectionner une suggestion
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.value);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="p-3 text-center text-gray-500 text-sm">
              Recherche en cours...
            </div>
          )}
          {!isLoading && suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{suggestion.street || suggestion.label}</div>
              <div className="text-sm text-gray-600">
                {suggestion.postcode} {suggestion.city}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

