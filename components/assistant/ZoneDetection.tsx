// Composant de détection de zone avec fallback manuel
'use client';

import React, { useState } from 'react';
import { detectZoneFromText, DELIVERY_AR } from '@/lib/zone-detection';
import Input from './Input';
import Radio from './Radio';

interface ZoneDetectionProps {
  value: string;
  onChange: (zone: string, deliveryPrice: number) => void;
  error?: string;
}

export default function ZoneDetection({ value, onChange, error }: ZoneDetectionProps) {
  const [addressInput, setAddressInput] = useState('');
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  const handleDetectZone = () => {
    const zone = detectZoneFromText(addressInput);
    
    if (zone) {
      setDetectedZone(zone);
      setShowFallback(false);
      const price = DELIVERY_AR[zone];
      onChange(zone, price);
    } else {
      setDetectedZone(null);
      setShowFallback(true);
    }
  };

  const handleManualZone = (zone: string) => {
    setDetectedZone(zone);
    setShowFallback(false);
    const price = DELIVERY_AR[zone as keyof typeof DELIVERY_AR];
    onChange(zone, price);
  };

  const handleChangeZone = () => {
    setDetectedZone(null);
    setShowFallback(false);
    setAddressInput('');
    onChange('', 0);
  };

  return (
    <div className="space-y-4">
      {!detectedZone && !showFallback && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse ou code postal
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={addressInput}
                onChange={setAddressInput}
                placeholder="Ex: 123 rue de la Paix, 75015 Paris"
              />
              <button
                onClick={handleDetectZone}
                disabled={!addressInput.trim()}
                className="px-4 py-2 bg-[#e27431] text-white rounded-lg font-medium hover:bg-[#e27431]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Détecter la zone
              </button>
            </div>
          </div>
        </div>
      )}

      {detectedZone && (
        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-green-800">
                Zone détectée : {detectedZone === 'paris' ? 'Paris' : 
                                detectedZone === 'petite' ? 'Petite couronne' : 
                                detectedZone === 'grande' ? 'Grande couronne' : 'Retrait'}
              </div>
              <div className="text-sm text-green-600">
                Livraison A/R : {DELIVERY_AR[detectedZone as keyof typeof DELIVERY_AR]} €
              </div>
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

      {showFallback && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Zone non détectée automatiquement. Veuillez sélectionner manuellement :
          </div>
          <div className="space-y-2">
            <Radio
              value="paris"
              label="Paris (80 € A/R)"
              icon="🏙️"
              price={80}
              selected={value === 'paris'}
              onClick={() => handleManualZone('paris')}
            />
            <Radio
              value="petite"
              label="Petite couronne (120 € A/R)"
              icon="🏘️"
              price={120}
              selected={value === 'petite'}
              onClick={() => handleManualZone('petite')}
            />
            <Radio
              value="grande"
              label="Grande couronne (156 € A/R)"
              icon="🌆"
              price={156}
              selected={value === 'grande'}
              onClick={() => handleManualZone('grande')}
            />
            <Radio
              value="retrait"
              label="Retrait sur place (0 €)"
              icon="🚗"
              price={0}
              selected={value === 'retrait'}
              onClick={() => handleManualZone('retrait')}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}

