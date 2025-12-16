'use client';

import { Music, MapPin, Zap, Users, Wrench } from 'lucide-react';

interface GuaranteesBannerProps {
  language: 'fr' | 'en';
}

export default function GuaranteesBanner({ language }: GuaranteesBannerProps) {
  const texts = {
    fr: {
      items: [
        {
          icon: Music,
          title: 'Matériel professionnel',
          description: 'Équipements haut de gamme'
        },
        {
          icon: MapPin,
          title: 'Paris & Île-de-France',
          description: 'Intervention rapide'
        },
        {
          icon: Zap,
          title: 'Urgence 24/7',
          description: 'Intervention en 30-60 min'
        },
        {
          icon: Users,
          title: 'Équipe dédiée',
          description: 'Disponible 24h/24 - 7j/7'
        },
        {
          icon: Wrench,
          title: 'Service clé en main',
          description: 'Installation disponible'
        }
      ]
    },
    en: {
      items: [
        {
          icon: Music,
          title: 'Professional equipment',
          description: 'High-end gear'
        },
        {
          icon: MapPin,
          title: 'Paris & Île-de-France',
          description: 'Fast intervention'
        },
        {
          icon: Zap,
          title: 'Emergency 24/7',
          description: '30-60 min response'
        },
        {
          icon: Users,
          title: 'Dedicated team',
          description: 'Available 24/7'
        },
        {
          icon: Wrench,
          title: 'Turnkey service',
          description: 'Installation available'
        }
      ]
    }
  };

  const currentTexts = texts[language];

  // Dupliquer les éléments pour l'animation infinie
  const duplicatedItems = [...currentTexts.items, ...currentTexts.items];

  return (
    <section className="bg-black py-3 sm:py-4">
      <div className="w-full px-2 sm:px-4 lg:px-8">
        {/* Version mobile avec défilement automatique */}
        <div className="flex md:hidden items-center gap-1 sm:gap-2 overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-1.5 animate-scroll-mobile">
            {duplicatedItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0"
                >
                  {/* Hexagon Icon */}
                  <div className="relative flex-shrink-0">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 48 48"
                      className="text-gray-700 sm:w-9 sm:h-9"
                      fill="currentColor"
                    >
                      <path d="M24 2L42 12V36L24 46L6 36V12L24 2Z" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="text-white whitespace-nowrap">
                    <p className="font-semibold text-[9px] sm:text-[10px] leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-gray-300 leading-tight">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Version desktop sans défilement */}
        <div className="hidden md:flex items-center justify-center gap-3 lg:gap-4">
          {currentTexts.items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-2 flex-shrink-0"
              >
                {/* Hexagon Icon */}
                <div className="relative flex-shrink-0">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 48 48"
                    className="text-gray-700 md:w-10 md:h-10"
                    fill="currentColor"
                  >
                    <path d="M24 2L42 12V36L24 46L6 36V12L24 2Z" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Text */}
                <div className="text-white whitespace-nowrap">
                  <p className="font-semibold text-xs lg:text-sm leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[10px] lg:text-xs text-gray-300 leading-tight">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <style jsx>{`
          @keyframes scroll-mobile {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          .animate-scroll-mobile {
            animation: scroll-mobile 30s linear infinite;
          }

          .animate-scroll-mobile:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    </section>
  );
}
