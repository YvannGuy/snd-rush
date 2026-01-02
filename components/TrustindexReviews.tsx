'use client';

import { useEffect, useState } from 'react';
import SectionChevron from './SectionChevron';

interface TrustindexReviewsProps {
  language?: 'fr' | 'en';
}

export default function TrustindexReviews({ language = 'fr' }: TrustindexReviewsProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    // Charger le script Elfsight s'il n'est pas déjà chargé
    const loadElfsightScript = () => {
      if (document.querySelector('script[src*="apps.elfsight.com"]')) {
        setIsScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apps.elfsight.com/p/platform.js';
      script.defer = true;
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      document.body.appendChild(script);
    };

    loadElfsightScript();

    // Masquer le titre du widget après le chargement
    const hideTitle = () => {
      const widget = document.querySelector('.elfsight-app-5061f2ae-239e-459a-be12-6e4eeaa1d4f3');
      if (widget) {
        // Chercher spécifiquement les titres h1, h2, h3 qui contiennent le texte
        const headings = widget.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading) => {
          const text = heading.textContent || '';
          if (
            text.includes('What Our Customers Say') || 
            text.includes('Ce que disent nos clients') ||
            text.includes('Google Reviews') ||
            text.includes('Avis Google')
          ) {
            (heading as HTMLElement).style.display = 'none';
          }
        });
      }
    };

    // Essayer de masquer après plusieurs délais pour s'assurer que le widget est chargé
    const timeouts = [
      setTimeout(hideTitle, 2000),
      setTimeout(hideTitle, 5000),
      setTimeout(hideTitle, 8000),
      setTimeout(hideTitle, 12000),
    ];
    
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
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const texts = {
    fr: {
      title: 'Ce que disent',
      titleHighlight: 'nos clients',
      subtitle: 'Découvrez les avis Google de nos clients',
    },
    en: {
      title: 'What our',
      titleHighlight: 'customers say',
      subtitle: 'Discover our Google reviews',
    },
  };

  const currentTexts = texts[language];

  return (
    <section id="testimonials" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            <span className="text-gray-900">{currentTexts.title} </span>
            <span className="text-[#F2431E]">{currentTexts.titleHighlight}</span>
          </h2>
          <p className="text-xl text-gray-600">
            {currentTexts.subtitle}
          </p>
        </div>
        
        {/* Elfsight Google Reviews Widget */}
        <div className="elfsight-app-5061f2ae-239e-459a-be12-6e4eeaa1d4f3"></div>
        
        {/* Lien vers Google Reviews */}
        <div className="text-center mt-8">
          <a
            href="https://g.page/r/your-google-business-url/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#F2431E] hover:text-[#E63A1A] font-semibold transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>
              {language === 'fr' ? 'Voir tous les avis sur Google' : 'View all reviews on Google'}
            </span>
          </a>
        </div>
      </div>
      <SectionChevron nextSectionId="tutos" />
    </section>
  );
}
