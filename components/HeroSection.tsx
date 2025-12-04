
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HeroSectionProps {
  language: 'fr' | 'en';
}

export default function HeroSection({ language }: HeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const backgroundImages = [
    'https://readdy.ai/api/search-image?query=Professional%20DJ%20mixing%20console%20with%20glowing%20buttons%20and%20sliders%20in%20dark%20nightclub%20environment%2C%20emergency%20lighting%20effects%2C%20red%20and%20orange%20dramatic%20lighting%2C%20urgent%20atmosphere%2C%20high-end%20audio%20equipment%20setup%20for%20emergency%20sound%20rental%20service&width=1920&height=1080&seq=hero-bg-1&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Sound%20engineer%20running%20with%20professional%20speakers%20and%20audio%20equipment%20in%20urban%20night%20setting%2C%20motion%20blur%20effect%2C%20emergency%20response%20team%2C%20red%20emergency%20lighting%2C%20urgent%20delivery%20of%20sound%20equipment%2C%20professional%20audio%20rescue%20service&width=1920&height=1080&seq=hero-bg-2&orientation=landscape',
    'https://readdy.ai/api/search-image?query=High-end%20professional%20audio%20speakers%20and%20sound%20system%20setup%20in%20elegant%20event%20venue%2C%20emergency%20lighting%2C%20dramatic%20shadows%2C%20premium%20sound%20equipment%20ready%20for%20urgent%20deployment%2C%20red%20accent%20lighting%2C%20professional%20event%20rescue&width=1920&height=1080&seq=hero-bg-3&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Professional%20audio%20technician%20installing%20sound%20equipment%20at%20night%20with%20emergency%20lighting%2C%20urgent%20repair%20scenario%2C%20mixing%20console%20and%20speakers%2C%20red%20warning%20lights%2C%20fast%20emergency%20sound%20service%20deployment%2C%20professional%20rescue%20team&width=1920&height=1080&seq=hero-bg-4&orientation=landscape'
  ];

  const texts = {
    fr: {
      title1: 'Location de sonorisation, lumière & DJ gear',
      title2: 'en 2 minutes',
      subtitle: 'Faites appel à nos spécialistes de l\'urgence sonore ou planifiez votre événement avec Sound Rush, notre service de réservation à l\'avance. Matériel professionnel, intervention express et équipe disponible 24h/24 - 7j/7 sur Paris et région parisienne pour tous vos besoins en matière de son.',
      cta: 'Voir les packs & tarifs',
      ctaSecondary: 'Trouver mon pack',
      catalogue: 'Voir le catalogue',
      available: 'Disponible 24h/24 - 7j/7'
    },
    en: {
      title1: 'Sound system, lighting & DJ gear rental',
      title2: 'in 2 minutes',
      subtitle: 'Call on our sound emergency specialists or plan your event with Sound Rush, our advance booking service. Professional equipment, express intervention and team available 24/7 in Paris and the Paris region for all your sound needs.',
      cta: 'View packs & prices',
      ctaSecondary: 'Find my pack',
      catalogue: 'View catalogue',
      available: 'Available 24/7'
    }
  };

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(imageInterval);
  }, [backgroundImages.length]);

  return (
    <section className="relative min-h-screen bg-black pt-16 overflow-hidden">
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
                    {texts[language].title1}
                    <br />
                    <span className="text-[#F2431E]">{texts[language].title2}</span>
                  </h1>

                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
                    {texts[language].subtitle}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                  <Link
                    href="/catalogue"
                    className="bg-[#F2431E] text-white px-8 sm:px-12 py-4 sm:py-6 rounded-lg font-semibold text-base sm:text-xl hover:bg-[#E63A1A] transition-colors text-center cursor-pointer inline-block"
                  >
                    {texts[language].cta}
                  </Link>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openAssistantModal'));
                    }}
                    className="bg-transparent border-2 border-white text-white px-8 sm:px-12 py-4 sm:py-6 rounded-lg font-semibold text-base sm:text-xl hover:bg-white/10 transition-colors text-center cursor-pointer"
                  >
                    {texts[language].ctaSecondary}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
