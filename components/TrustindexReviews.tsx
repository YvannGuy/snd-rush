'use client';

import { useEffect } from 'react';

export default function TrustindexReviews() {
  useEffect(() => {
    // Fonction pour charger le script Trustindex
    const loadTrustindex = () => {
      // Vérifier si le script est déjà chargé
      if (document.querySelector('script[src*="trustindex.io"]')) {
        return;
      }

      // Créer le script
      const script = document.createElement('script');
      script.src = 'https://cdn.trustindex.io/loader.js?217fec5556801563a646e40d7b5';
      script.defer = true;
      script.async = true;
      
      // Ajouter le script au head
      document.head.appendChild(script);
      
      console.log('Trustindex script added to head');
    };

    // Charger immédiatement
    loadTrustindex();

    // Recharger après un délai pour s'assurer que le DOM est prêt
    const timeout = setTimeout(() => {
      loadTrustindex();
    }, 1000);

    return () => {
      clearTimeout(timeout);
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
        
        {/* Script Trustindex intégré directement */}
        <div 
          dangerouslySetInnerHTML={{
            __html: `<script defer async src="https://cdn.trustindex.io/loader.js?217fec5556801563a646e40d7b5"></script>`
          }}
        />
        
        {/* Container pour les avis */}
        <div className="min-h-[400px]">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Chargement des avis clients...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e27431] mx-auto"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
