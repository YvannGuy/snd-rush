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
      className="relative py-20 lg:py-32 bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden"
      role="region"
      aria-labelledby="assistant-promo-title"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#e27431]/5 via-transparent to-[#e27431]/5"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-[#e27431]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#e27431]/5 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-[#e27431]/10 border border-[#e27431]/20 rounded-full text-[#e27431] font-medium text-sm mb-8">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Assistant IA SND Rush
          </div>

          {/* Titre */}
          <h2 
            id="assistant-promo-title"
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
          >
            Trouvez votre pack idéal en{' '}
            <span className="bg-gradient-to-r from-[#e27431] to-[#d6341a] bg-clip-text text-transparent">
              quelques clics
            </span>
          </h2>

          {/* Sous-texte */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto">
            Vous hésitez sur le matériel à choisir ? Pas besoin d'être expert en sonorisation. 
            Répondez à quelques questions simples et notre{' '}
            <span className="font-bold text-[#e27431]">Assistant IA SND Rush</span> vous proposera 
            le pack le plus adapté avec son prix total TTC.
          </p>

          {/* Exemples avec design amélioré */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-8">
              Exemples de configurations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {examples.map((example, index) => (
                <div 
                  key={index}
                  className="group relative p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#e27431]/30"
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-[#e27431] to-[#d6341a] rounded-full mr-4 group-hover:scale-125 transition-transform duration-300"></div>
                    <span className="text-gray-700 font-semibold text-lg">{example}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e27431]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA avec design premium */}
          <div className="mb-12">
            <button
              onClick={onOpenAssistant}
              className="group relative inline-flex items-center justify-center px-12 py-6 bg-gradient-to-r from-[#e27431] to-[#d6341a] text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#e27431]/30 focus:ring-offset-4"
              aria-label="Ouvrir l'assistant IA SND Rush"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#e27431] to-[#d6341a] rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                <svg 
                  className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" 
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
                <svg 
                  className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 8l4 4m0 0l-4 4m4-4H3" 
                  />
                </svg>
              </div>
            </button>
          </div>

          {/* Indicateurs de confiance avec design amélioré */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: "🎯", text: "Recommandation personnalisée" },
              { icon: "💰", text: "Prix transparent" },
              { icon: "⚡", text: "Réservation en 2 minutes" }
            ].map((item, index) => (
              <div 
                key={index}
                className="flex flex-col items-center p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <span className="text-gray-700 font-semibold text-center">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
