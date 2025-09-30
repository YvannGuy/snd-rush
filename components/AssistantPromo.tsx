'use client';

import React from 'react';

interface AssistantPromoProps {
  onOpenAssistant: () => void;
}

export default function AssistantPromo({ onOpenAssistant }: AssistantPromoProps) {
  const examples = [
    'Mariage, 120 personnes, Paris',
    'Anniversaire, 80 invités, salle privée',
    'Événement corporate, 200 personnes, hôtel',
    'Gala, 400 invités, extérieur'
  ];

  return (
    <section 
      className="py-16 lg:py-24 bg-white"
      role="region"
      aria-labelledby="assistant-promo-title"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Titre */}
          <h2 
            id="assistant-promo-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Trouvez votre pack idéal en quelques clics
          </h2>

          {/* Sous-texte */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Vous hésitez sur le matériel à choisir ? Pas besoin d'être expert en sonorisation. 
            Répondez à quelques questions simples (type d'événement, nombre d'invités, lieu, besoins spécifiques) 
            et notre <span className="font-semibold text-[#e27431]">Assistant IA SND Rush</span> vous proposera 
            le pack le plus adapté avec son prix total TTC.
          </p>

          {/* Exemples */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Exemples de configurations :
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {examples.map((example, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-[#e27431] mr-2">•</span>
                  <span className="text-gray-700 font-medium">{example}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onOpenAssistant}
            className="inline-flex items-center justify-center px-8 py-4 bg-[#e27431] text-white font-semibold text-lg rounded-lg hover:bg-[#e27431]/90 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#e27431]/30 focus:ring-offset-2"
            aria-label="Ouvrir l'assistant IA SND Rush"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
            Composer mon pack maintenant
          </button>

          {/* Indicateur de confiance */}
          <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Recommandation personnalisée</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Prix transparent</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Réservation en 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
