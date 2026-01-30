
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import HeroAIInput from './HeroAIInput';
import SectionChevron from './SectionChevron';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  language: 'fr' | 'en';
}

const animatedWords = {
  fr: ['Sono', 'Lumière', 'DJ gear'],
  en: ['Sound', 'Lighting', 'DJ gear']
};

export default function HeroSection({ language }: HeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const imageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  const backgroundImages = [
    'https://readdy.ai/api/search-image?query=Professional%20DJ%20mixing%20console%20with%20glowing%20buttons%20and%20sliders%20in%20dark%20nightclub%20environment%2C%20emergency%20lighting%20effects%2C%20red%20and%20orange%20dramatic%20lighting%2C%20urgent%20atmosphere%2C%20high-end%20audio%20equipment%20setup%20for%20emergency%20sound%20rental%20service&width=1920&height=1080&seq=hero-bg-1&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Sound%20engineer%20running%20with%20professional%20speakers%20and%20audio%20equipment%20in%20urban%20night%20setting%2C%20motion%20blur%20effect%2C%20emergency%20response%20team%2C%20red%20emergency%20lighting%2C%20urgent%20delivery%20of%20sound%20equipment%2C%20professional%20audio%20rescue%20service&width=1920&height=1080&seq=hero-bg-2&orientation=landscape',
    'https://readdy.ai/api/search-image?query=High-end%20professional%20audio%20speakers%20and%20sound%20system%20setup%20in%20elegant%20event%20venue%2C%20emergency%20lighting%2C%20dramatic%20shadows%2C%20premium%20sound%20equipment%20ready%20for%20urgent%20deployment%2C%20red%20accent%20lighting%2C%20professional%20event%20rescue&width=1920&height=1080&seq=hero-bg-3&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Professional%20audio%20technician%20installing%20sound%20equipment%20at%20night%20with%20emergency%20lighting%2C%20urgent%20repair%20scenario%2C%20mixing%20console%20and%20speakers%2C%20red%20warning%20lights%2C%20fast%20emergency%20sound%20service%20deployment%2C%20professional%20rescue%20team&width=1920&height=1080&seq=hero-bg-4&orientation=landscape'
  ];

  const texts = {
    fr: {
      title1Prefix: 'Location',
      title1Suffix: 'clé en main à paris',
      title2: 'Disponible 24/7 • Réservation en 2 clics',
      subtitle: 'Besoin d\'une sono maintenant ? Mariages, événements, soirées. Livraison 24/7, installation par nos experts, matériel professionnel. Service clé en main.',
      cta: 'Préparer mon événement',
      ctaSecondary: 'Intervention urgente',
      catalogue: 'Voir le catalogue',
      available: 'Disponible 24h/24 - 7j/7'
    },
    en: {
      title1Prefix: 'Turnkey',
      title1Suffix: 'solutions in Paris',
      title2: 'Rapid intervention and simplified booking',
      subtitle: 'Conferences, events, parties, weddings. We deliver, install and set up a solution adapted to your event, stress-free',
      cta: 'Prepare my event',
      ctaSecondary: 'Urgent intervention',
      catalogue: 'View catalogue',
      available: 'Available 24/7'
    }
  };

  useEffect(() => {
    const startIntervals = () => {
      // Nettoyer les intervalles existants avant d'en créer de nouveaux
      if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);

      imageIntervalRef.current = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);

      wordIntervalRef.current = setInterval(() => {
        setCurrentWordIndex((prevIndex) =>
          prevIndex === animatedWords[language].length - 1 ? 0 : prevIndex + 1
        );
      }, 2000);
    };

    const stopIntervals = () => {
      if (imageIntervalRef.current) {
        clearInterval(imageIntervalRef.current);
        imageIntervalRef.current = null;
      }
      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current);
        wordIntervalRef.current = null;
      }
    };

    // Utiliser IntersectionObserver pour arrêter les intervals quand hors vue
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0].isIntersecting;
        if (isVisible) {
          startIntervals();
        } else {
          stopIntervals();
        }
      },
      { threshold: 0.1 }
    );

    // Attacher l'observer au conteneur de la section
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Démarrer les intervals initialement
    startIntervals();

    return () => {
      observer.disconnect();
      stopIntervals();
    };
  }, [language, backgroundImages.length]);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen bg-black overflow-hidden" 
      style={{ paddingTop: '64px' }}
    >
      {/* Background Images with Smooth Transition */}
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${image})`
          }}
        />
      ))}

      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative z-10 w-full h-full min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
            <div className="text-center w-full flex flex-col justify-center">
              <div className="space-y-8 sm:space-y-12">
                <div className="space-y-6 sm:space-y-8">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight">
                    {texts[language].title1Prefix}{' '}
                    <span className="text-[#F2431E] transition-all duration-500 inline-block">
                      {animatedWords[language][currentWordIndex]}
                    </span>
                    {' '}{texts[language].title1Suffix}
                  </h1>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/95 font-semibold leading-tight">
                    {texts[language].title2}
                  </h2>

                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
                    {texts[language].subtitle}
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-12">
                  <a
                    href="#solutions"
                    onClick={(e) => {
                      e.preventDefault();
                      const solutionsSection = document.getElementById('solutions');
                      if (solutionsSection) {
                        solutionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="bg-[#F2431E] hover:bg-[#E63A1A] text-white font-semibold px-8 py-4 rounded-full text-lg sm:text-xl transition-colors shadow-lg hover:shadow-xl inline-flex items-center justify-center"
                  >
                    {texts[language].cta}
                  </a>
                  
                  <a
                    href="tel:+33744782754"
                    className="bg-white hover:bg-gray-100 text-[#F2431E] font-semibold px-8 py-4 rounded-full text-lg sm:text-xl transition-colors shadow-lg hover:shadow-xl"
                  >
                    {texts[language].ctaSecondary}
                  </a>
                </div>

                {/* Simulator CTA */}
                <div className="mt-6 text-center">
                  <a
                    href="#pack-wizard"
                    onClick={(e) => {
                      e.preventDefault();
                      const wizardSection = document.getElementById('pack-wizard');
                      if (wizardSection) {
                        wizardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="text-white/90 hover:text-white text-base sm:text-lg underline transition-colors inline-flex items-center gap-2"
                  >
                    {language === 'fr' ? 'Pas sûr de votre besoin ? Laissez notre simulateur vous guider' : 'Not sure what you need? Let our simulator guide you'}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SectionChevron nextSectionId="about-soundrush" />
    </section>
  );
}
