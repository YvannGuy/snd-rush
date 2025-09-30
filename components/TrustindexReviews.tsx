'use client';

import { useEffect } from 'react';

export default function TrustindexReviews() {
  useEffect(() => {
    // Vérifier si le script est déjà chargé
    if (document.querySelector('script[src*="trustindex.io"]')) {
      return;
    }

    // Créer le script Trustindex
    const script = document.createElement('script');
    script.src = 'https://cdn.trustindex.io/loader.js?217fec5556801563a646e40d7b5';
    script.defer = true;
    script.async = true;
    
    // Ajouter le script au head
    document.head.appendChild(script);
    
    console.log('Trustindex script loaded');
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
        
        {/* Container pour les avis Trustindex */}
        <div className="min-h-[400px]">
          {/* Trustindex va s'afficher ici automatiquement */}
        </div>
      </div>
    </section>
  );
}
