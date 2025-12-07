'use client';

import { useEffect } from 'react';

export default function TrustindexReviews() {
  useEffect(() => {
    // Masquer le titre du widget après le chargement
    const hideTitle = () => {
      const widget = document.querySelector('.elfsight-app-5061f2ae-239e-459a-be12-6e4eeaa1d4f3');
      if (widget) {
        // Chercher spécifiquement les titres h1, h2, h3 qui contiennent le texte
        const headings = widget.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading) => {
          const text = heading.textContent || '';
          if (text.includes('What Our Customers Say') || text.includes('Ce que disent nos clients')) {
            (heading as HTMLElement).style.display = 'none';
          }
        });
      }
    };

    // Essayer de masquer après plusieurs délais pour s'assurer que le widget est chargé
    setTimeout(hideTitle, 2000);
    setTimeout(hideTitle, 5000);
    setTimeout(hideTitle, 8000);
    
    // Observer pour détecter quand le widget se charge
    const observer = new MutationObserver(() => {
      hideTitle();
    });
    
    // Attendre que le conteneur soit disponible
    setTimeout(() => {
      const widgetContainer = document.querySelector('.elfsight-app-5061f2ae-239e-459a-be12-6e4eeaa1d4f3');
      if (widgetContainer) {
        observer.observe(widgetContainer, {
          childList: true,
          subtree: true
        });
      }
    }, 1000);
    
    // Nettoyer au démontage
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section id="testimonials" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            <span className="text-gray-900">Ce que disent </span>
            <span className="text-[#F2431E]">nos clients</span>
          </h2>
          <p className="text-xl text-gray-600">
            Découvrez ce que nos clients disent de nos services
          </p>
        </div>
        
        {/* Elfsight Google Reviews Widget */}
        <div className="elfsight-app-5061f2ae-239e-459a-be12-6e4eeaa1d4f3"></div>
      </div>
    </section>
  );
}
