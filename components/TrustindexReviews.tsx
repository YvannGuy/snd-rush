'use client';

import { useEffect } from 'react';

export default function TrustindexReviews() {
  useEffect(() => {
    // Charger le script Trustindex
    const script = document.createElement('script');
    script.src = 'https://cdn.trustindex.io/loader.js?217fec5556801563a646e40d7b5';
    script.defer = true;
    script.async = true;
    
    document.head.appendChild(script);

    // Nettoyage du script au démontage du composant
    return () => {
      const existingScript = document.querySelector('script[src*="trustindex.io"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Avis clients
          </h2>
          <p className="text-xl text-gray-600">
            Découvrez ce que nos clients disent de nos services
          </p>
        </div>
        
        {/* Le script Trustindex se chargera ici automatiquement */}
        <div id="trustindex-reviews"></div>
      </div>
    </section>
  );
}
