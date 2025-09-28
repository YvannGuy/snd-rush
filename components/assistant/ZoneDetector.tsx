// Composant de détection de zone automatique
'use client';

import React, { useState } from 'react';
import { detectZoneFromText, getDeliveryPrice } from '@/lib/assistant-logic';
import Input from './Input';
import Radio from './Radio';
import ErrorText from './ErrorText';

interface ZoneDetectorProps {
  value: string;
  onChange: (value: string) => void;
  onZoneDetected: (zone: string, price: number) => void;
  error?: string;
}

export default function ZoneDetector({ 
  value, 
  onChange, 
  onZoneDetected, 
  error 
}: ZoneDetectorProps) {
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [manualZone, setManualZone] = useState<string>('');

  const handleDetectZone = () => {
    if (!value.trim()) return;

    const zone = detectZoneFromText(value);
    if (zone) {
      const price = getDeliveryPrice(zone);
      setDetectedZone(zone);
      onZoneDetected(zone, price);
      setShowFallback(false);
    } else {
      setShowFallback(true);
      setDetectedZone(null);
    }
  };

  const handleManualZoneChange = (zone: string) => {
    setManualZone(zone);
    const price = getDeliveryPrice(zone);
    onZoneDetected(zone, price);
  };

  const handleChangeZone = () => {
    setDetectedZone(null);
    setShowFallback(false);
    setManualZone('');
    onChange('');
  };

  const getZoneLabel = (zone: string) => {
    const labels: Record<string, string> = {
      paris: 'Paris',
      petite: 'Petite couronne',
      grande: 'Grande couronne',
      retrait: 'Retrait sur place',
    };
    return labels[zone] || zone;
  };

  const getZonePrice = (zone: string) => {
    const prices: Record<string, number> = {
      paris: 80,
      petite: 120,
      grande: 156,
      retrait: 0,
    };
    return prices[zone] || 0;
  };

  return (
    <div className="space-y-4">
      {/* Champ de saisie */}
      <div>
        <Input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Ex: 123 rue de la Paix, 75015 Paris ou 75015"
          error={error}
        />
        
        <button
          onClick={handleDetectZone}
          disabled={!value.trim()}
          className="mt-3 w-full bg-[#e27431] text-white py-3 rounded-lg font-semibold hover:bg-[#e27431]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Détecter la zone
        </button>
      </div>

      {/* Zone détectée */}
      {detectedZone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800">
                Zone détectée : {getZoneLabel(detectedZone)}
              </p>
              <p className="text-sm text-green-600">
                Livraison A/R : {getZonePrice(detectedZone)} €
              </p>
            </div>
            <button
              onClick={handleChangeZone}
              className="text-sm text-green-600 hover:text-green-800 underline"
            >
              Changer
            </button>
          </div>
        </div>
      )}

      {/* Fallback manuel */}
      {showFallback && !detectedZone && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Zone non détectée. Veuillez sélectionner manuellement :
          </p>
          
          <div className="space-y-3">
            {[
              { value: 'paris', label: 'Paris (80 € A/R)', icon: '🏙️', price: 80 },
              { value: 'petite', label: 'Petite couronne (120 € A/R)', icon: '🏘️', price: 120 },
              { value: 'grande', label: 'Grande couronne (156 € A/R)', icon: '🌆', price: 156 },
              { value: 'retrait', label: 'Retrait sur place (0 €)', icon: '🚗', price: 0 },
            ].map((option) => (
              <Radio
                key={option.value}
                value={option.value}
                label={option.label}
                icon={option.icon}
                price={option.price}
                selected={manualZone === option.value}
                onClick={handleManualZoneChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && <ErrorText message={error} />}
    </div>
  );
}
