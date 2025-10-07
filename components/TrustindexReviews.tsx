'use client';

import { useEffect } from 'react';

export default function TrustindexReviews() {
  useEffect(() => {
    // Vérifier si le script Elfsight est déjà chargé
    if (document.querySelector('script[src*="elfsightcdn.com"]')) {
      return;
    }

    // Créer le script Elfsight
    const script = document.createElement('script');
    script.src = 'https://elfsightcdn.com/platform.js';
    script.async = true;
    
    // Ajouter le script au head
    document.head.appendChild(script);
    
    console.log('Elfsight script loaded');
    
    // Nettoyer le script au démontage du composant
    return () => {
      const existingScript = document.querySelector('script[src*="elfsightcdn.com"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <section className="py-8 lg:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Ce que disent nos clients
          </h2>
          <p className="text-xl text-gray-600">
            Découvrez ce que nos clients disent de nos services
          </p>
        </div>
        
        {/* Elfsight Google Reviews Widget */}
        <div className="elfsight-app-5061f2ae-239e-459a-be12-6e4eeaa1d4f3" data-elfsight-app-lazy></div>
      </div>
    </section>
  );
}
