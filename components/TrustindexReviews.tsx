'use client';

import { useEffect, useState, useRef } from 'react';
import SectionChevron from './SectionChevron';

interface TrustindexReviewsProps {
  language?: 'fr' | 'en';
}

export default function TrustindexReviews({ language = 'fr' }: TrustindexReviewsProps) {
  useEffect(() => {
    // Masquer le titre du widget après le chargement
    const hideTitle = () => {
      const widget = document.querySelector('.elfsight-app-eceb54fb-9632-4eda-b210-eb64d51178f4');
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
      const widgetContainer = document.querySelector('.elfsight-app-eceb54fb-9632-4eda-b210-eb64d51178f4');
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
    
    // Nettoyer au démontage
    return () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
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
        <div className="min-h-[400px]">
          <div className="elfsight-app-eceb54fb-9632-4eda-b210-eb64d51178f4" data-elfsight-app-lazy></div>
        </div>
      </div>
      <SectionChevron nextSectionId="tutos" />
    </section>
  );
}

