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
  language?: 'fr' | 'en';
}

export default function ZoneDetector({ 
  value, 
  onChange, 
  onZoneDetected, 
  error,
  language = 'fr'
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
    const labels: Record<string, Record<string, string>> = {
      paris: { fr: 'Paris', en: 'Paris' },
      petite: { fr: 'Petite couronne', en: 'Small crown' },
      grande: { fr: 'Grande couronne', en: 'Large crown' },
      retrait: { fr: 'Retrait sur place', en: 'Pickup on site' },
    };
    return labels[zone]?.[language] || zone;
  };

  const texts = {
    fr: {
      detectZone: 'Détecter la zone',
      zoneDetected: 'Zone détectée :',
      deliveryAR: 'Livraison A/R :',
      change: 'Changer',
      zoneNotDetected: 'Zone non détectée. Veuillez sélectionner manuellement :',
      placeholder: 'Ex: 123 rue de la Paix, 75015 Paris ou 75015'
    },
    en: {
      detectZone: 'Detect zone',
      zoneDetected: 'Zone detected:',
      deliveryAR: 'Delivery R/T:',
      change: 'Change',
      zoneNotDetected: 'Zone not detected. Please select manually:',
      placeholder: 'Ex: 123 Peace Street, 75015 Paris or 75015'
    }
  };

  const currentTexts = texts[language];

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
          placeholder={currentTexts.placeholder}
          error={error}
        />
        
        <button
          onClick={handleDetectZone}
          disabled={!value.trim()}
          className="mt-3 w-full bg-[#e27431] text-white py-3 rounded-lg font-semibold hover:bg-[#e27431]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentTexts.detectZone}
        </button>
      </div>

      {/* Zone détectée */}
      {detectedZone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800">
                {currentTexts.zoneDetected} {getZoneLabel(detectedZone)}
              </p>
              <p className="text-sm text-green-600">
                {currentTexts.deliveryAR} {getZonePrice(detectedZone)} €
              </p>
            </div>
            <button
              onClick={handleChangeZone}
              className="text-sm text-green-600 hover:text-green-800 underline"
            >
              {currentTexts.change}
            </button>
          </div>
        </div>
      )}

      {/* Fallback manuel */}
      {showFallback && !detectedZone && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {currentTexts.zoneNotDetected}
          </p>
          
          <div className="space-y-3">
            {[
              { value: 'paris', labelFr: 'Paris (80 € A/R)', labelEn: 'Paris (80 € R/T)', icon: '🏙️', price: 80 },
              { value: 'petite', labelFr: 'Petite couronne (120 € A/R)', labelEn: 'Small crown (120 € R/T)', icon: '🏘️', price: 120 },
              { value: 'grande', labelFr: 'Grande couronne (156 € A/R)', labelEn: 'Large crown (156 € R/T)', icon: '🌆', price: 156 },
              { value: 'retrait', labelFr: 'Retrait sur place (0 €)', labelEn: 'Pickup on site (0 €)', icon: '🚗', price: 0 },
            ].map((option) => (
              <Radio
                key={option.value}
                value={option.value}
                label={language === 'fr' ? option.labelFr : option.labelEn}
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
