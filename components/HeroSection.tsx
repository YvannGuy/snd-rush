
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface HeroSectionProps {
  language: 'fr' | 'en';
  onReservationClick?: () => void;
  onPackSelected?: (packId: number) => void;
}

export default function HeroSection({ language, onReservationClick, onPackSelected }: HeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const backgroundImages = [
    'https://readdy.ai/api/search-image?query=Professional%20DJ%20mixing%20console%20with%20glowing%20buttons%20and%20sliders%20in%20dark%20nightclub%20environment%2C%20emergency%20lighting%20effects%2C%20red%20and%20orange%20dramatic%20lighting%2C%20urgent%20atmosphere%2C%20high-end%20audio%20equipment%20setup%20for%20emergency%20sound%20rental%20service&width=1920&height=1080&seq=hero-bg-1&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Sound%20engineer%20running%20with%20professional%20speakers%20and%20audio%20equipment%20in%20urban%20night%20setting%2C%20motion%20blur%20effect%2C%20emergency%20response%20team%2C%20red%20emergency%20lighting%2C%20urgent%20delivery%20of%20sound%20equipment%2C%20professional%20audio%20rescue%20service&width=1920&height=1080&seq=hero-bg-2&orientation=landscape',
    'https://readdy.ai/api/search-image?query=High-end%20professional%20audio%20speakers%20and%20sound%20system%20setup%20in%20elegant%20event%20venue%2C%20emergency%20lighting%2C%20dramatic%20shadows%2C%20premium%20sound%20equipment%20ready%20for%20urgent%20deployment%2C%20red%20accent%20lighting%2C%20professional%20event%20rescue&width=1920&height=1080&seq=hero-bg-3&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Professional%20audio%20technician%20installing%20sound%20equipment%20at%20night%20with%20emergency%20lighting%2C%20urgent%20repair%20scenario%2C%20mixing%20console%20and%20speakers%2C%20red%20warning%20lights%2C%20fast%20emergency%20sound%20service%20deployment%2C%20professional%20rescue%20team&width=1920&height=1080&seq=hero-bg-4&orientation=landscape'
  ];

  const texts = {
    fr: {
      title1: 'Votre solution sono',
      title2: 'clé en main de dernière minute',
      subtitle: 'Faites appel à nos spécialistes de l\'urgence sonore ou planifiez votre événement avec Sound Rush, notre service de réservation à l\'avance. Matériel professionnel, intervention express et équipe disponible 24h/24 - 7j/7 sur Paris et région parisienne pour tous vos besoins en matière de son.',
      cta: 'Réserver à l\'avance',
      emergency: 'Urgence ? Appelez maintenant',
      available: 'Disponible 24h/24 - 7j/7'
    },
    en: {
      title1: 'Emergency sound',
      title2: 'equipment specialists.',
      subtitle: 'Sound failure during your event? Emergency sound specialists, our team intervenes express with professional equipment to save your evening. Intervention service available 24/7 in Paris and Paris region for all your sound needs.',
      cta: 'Book in advance',
      emergency: 'Emergency? Call now',
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
  }, []);

  const handleReserveNow = () => {
    const element = document.getElementById('packs');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen bg-cover bg-center bg-no-repeat pt-16 overflow-hidden">
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

      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 w-full h-full min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
            <div className="text-center w-full flex flex-col justify-center">
              <div className="space-y-8 sm:space-y-12">
                <div className="space-y-6 sm:space-y-8">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold text-white leading-tight">
                    <span className="text-[#F2431E]">{texts[language].title1}</span>,
                    <br />
                    <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white/90">
                      {texts[language].title2}
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
                    {texts[language].subtitle}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                  <a
                    href="tel:+33651084994"
                    className="bg-[#F2431E] text-white px-6 sm:px-12 py-4 sm:py-6 rounded-full font-semibold text-base sm:text-xl hover:bg-[#E63A1A] transition-colors text-center cursor-pointer"
                  >
                    <i className="ri-phone-line mr-2 sm:mr-3 text-lg sm:text-2xl"></i>
                    {texts[language].emergency}
                  </a>
                  <button
                    onClick={onReservationClick ? onReservationClick : handleReserveNow}
                    className="bg-white/10 backdrop-blur-sm text-white px-6 sm:px-12 py-4 sm:py-6 rounded-full font-semibold text-base sm:text-xl hover:bg-white hover:text-black transition-colors text-center cursor-pointer"
                  >
                    <i className="ri-calendar-line mr-2 sm:mr-3 text-lg sm:text-2xl"></i>
                    {texts[language].cta}
                  </button>
                </div>


                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 text-white/80 text-sm sm:text-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                      <i className="ri-time-line text-lg sm:text-xl"></i>
                    </div>
                    <span>{texts[language].available}</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                      <i className="ri-map-pin-line text-lg sm:text-xl"></i>
                    </div>
                    <span>Paris & Île-de-France</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                      <i className="ri-flashlight-line text-lg sm:text-xl"></i>
                    </div>
                    <span>Intervention Express</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multilingual Support Banner */}
        <div className="relative z-20 bg-gradient-to-r from-[#F2431E] to-[#E63A1A] py-3 sm:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-white text-center sm:text-left">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                  <i className="ri-translate-2 text-lg sm:text-2xl"></i>
                </div>
                <div>
                  <span className="font-semibold text-sm sm:text-lg">English-speaking advisors</span>
                  <span className="block sm:inline sm:ml-4 text-white/90 text-xs sm:text-base">Foreign company or don't speak French? Our advisors assist you in English.</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-lg sm:text-2xl">🇬🇧</span>
                  <span className="font-medium text-sm sm:text-base">EN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
