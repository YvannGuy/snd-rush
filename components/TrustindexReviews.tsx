'use client';

import { useEffect, useState, useRef } from 'react';
import SectionChevron from './SectionChevron';

interface TrustindexReviewsProps {
  language?: 'fr' | 'en';
}

export default function TrustindexReviews({ language = 'fr' }: TrustindexReviewsProps) {
  const [widgetError, setWidgetError] = useState(false);

  useEffect(() => {
    // Intercepter les erreurs du widget Elfsight
    const originalError = console.error;
    const errorHandler = (...args: any[]) => {
      const message = args[0];
      if (
        typeof message === 'string' && 
        (message.includes('APP_VIEWS_LIMIT_REACHED') || 
         message.includes('3ad63c94-f36d-4b5d-b64e-513e62c70eb6') ||
         message.includes('can\'t be initialized') ||
         message.includes('Widget'))
      ) {
        setWidgetError(true);
        // Ne pas afficher l'erreur dans la console
        return;
      }
      // Laisser passer les autres erreurs
      originalError.apply(console, args);
    };
    
    // Remplacer temporairement console.error
    console.error = errorHandler as any;

    // Gestionnaire d'erreur global pour window
    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes('APP_VIEWS_LIMIT_REACHED') ||
        event.message?.includes('3ad63c94-f36d-4b5d-b64e-513e62c70eb6') ||
        event.message?.includes('can\'t be initialized')
      ) {
        event.preventDefault();
        setWidgetError(true);
        return false;
      }
    };
    
    window.addEventListener('error', handleError);

    // Masquer le titre du widget après le chargement
    const hideTitle = () => {
      const widget = document.querySelector('.elfsight-app-3ad63c94-f36d-4b5d-b64e-513e62c70eb6');
      if (widget) {
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

    // Tableau pour stocker tous les timeouts
    const timeouts: ReturnType<typeof setTimeout>[] = [
      setTimeout(hideTitle, 2000),
      setTimeout(hideTitle, 5000),
      setTimeout(hideTitle, 8000),
      setTimeout(hideTitle, 12000),
    ];
    
    // Observer pour détecter quand le widget se charge
    let observer: MutationObserver | null = null;
    const observerInitTimeout = setTimeout(() => {
      const widgetContainer = document.querySelector('.elfsight-app-3ad63c94-f36d-4b5d-b64e-513e62c70eb6');
      if (widgetContainer) {
        observer = new MutationObserver(() => {
          hideTitle();
        });
        observer.observe(widgetContainer, {
          childList: true,
          subtree: true
        });
      }
    }, 1000);
    timeouts.push(observerInitTimeout);
    
    // Vérifier après un délai si le widget s'est chargé
    const checkWidgetLoadTimeout = setTimeout(() => {
      const widget = document.querySelector('.elfsight-app-3ad63c94-f36d-4b5d-b64e-513e62c70eb6');
      // Si le widget existe mais est vide après 10 secondes, considérer comme erreur
      if (widget && widget.children.length === 0) {
        const errorMessage = widget.getAttribute('data-error') || '';
        if (errorMessage.includes('LIMIT') || errorMessage.includes('initialized')) {
          setWidgetError(true);
        }
      }
    }, 10000);
    timeouts.push(checkWidgetLoadTimeout);

    // Nettoyer au démontage
    return () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      timeouts.forEach(timeout => clearTimeout(timeout));
      // Restaurer console.error
      console.error = originalError;
      // Retirer le gestionnaire d'erreur
      window.removeEventListener('error', handleError);
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
        
        {/* Elfsight Google Reviews | Untitled Google Reviews */}
        <div className="min-h-[400px]">
          {widgetError ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">
                {language === 'fr' 
                  ? 'Les avis clients sont temporairement indisponibles. Veuillez consulter nos avis Google directement.'
                  : 'Customer reviews are temporarily unavailable. Please check our Google reviews directly.'}
              </p>
              <a 
                href="https://www.google.com/maps/place/SoundRush+Paris" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-4 text-[#F2431E] hover:underline"
              >
                {language === 'fr' ? 'Voir les avis Google' : 'View Google Reviews'}
              </a>
            </div>
          ) : (
            <div className="elfsight-app-3ad63c94-f36d-4b5d-b64e-513e62c70eb6" data-elfsight-app-lazy></div>
          )}
        </div>
      </div>
      <SectionChevron nextSectionId="tutos" />
    </section>
  );
}

