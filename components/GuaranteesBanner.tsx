'use client';

import Link from 'next/link';
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
          description: 'Équipements haut de gamme',
          slug: 'materiel-professionnel'
        },
        {
          icon: MapPin,
          title: 'Paris & Île-de-France',
          description: 'Intervention rapide',
          slug: 'paris-ile-de-france'
        },
        {
          icon: Zap,
          title: 'Urgence 24/7',
          description: 'Intervention en 30-60 min',
          slug: 'urgence-24-7'
        },
        {
          icon: Users,
          title: 'Équipe dédiée',
          description: 'Disponible 24h/24 - 7j/7',
          slug: 'equipe-dediee'
        },
        {
          icon: Wrench,
          title: 'Service clé en main',
          description: 'Installation disponible',
          slug: 'service-cle-en-main'
        }
      ]
    },
    en: {
      items: [
        {
          icon: Music,
          title: 'Professional equipment',
          description: 'High-end gear',
          slug: 'materiel-professionnel'
        },
        {
          icon: MapPin,
          title: 'Paris & Île-de-France',
          description: 'Fast intervention',
          slug: 'paris-ile-de-france'
        },
        {
          icon: Zap,
          title: 'Emergency 24/7',
          description: '30-60 min response',
          slug: 'urgence-24-7'
        },
        {
          icon: Users,
          title: 'Dedicated team',
          description: 'Available 24/7',
          slug: 'equipe-dediee'
        },
        {
          icon: Wrench,
          title: 'Turnkey service',
          description: 'Installation available',
          slug: 'service-cle-en-main'
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
                <Link
                  key={index}
                  href={`/${item.slug}`}
                  className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 hover:opacity-80 transition-all cursor-pointer group"
                >
                  {/* Hexagon Icon */}
                  <div className="relative flex-shrink-0">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 48 48"
                      className="text-gray-700 sm:w-9 sm:h-9 group-hover:text-[#F2431E] transition-colors"
                      fill="currentColor"
                    >
                      <path d="M24 2L42 12V36L24 46L6 36V12L24 2Z" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:text-[#F2431E] transition-colors" />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="text-white whitespace-nowrap">
                    <p className="font-semibold text-[9px] sm:text-[10px] leading-tight group-hover:text-[#F2431E] transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-gray-300 leading-tight group-hover:text-orange-200 transition-colors">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Version desktop sans défilement */}
        <div className="hidden md:flex items-center justify-center gap-3 lg:gap-4">
          {currentTexts.items.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={`/${item.slug}`}
                className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-all cursor-pointer group"
              >
                {/* Hexagon Icon */}
                <div className="relative flex-shrink-0">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 48 48"
                    className="text-gray-700 md:w-10 md:h-10 group-hover:text-[#F2431E] transition-colors"
                    fill="currentColor"
                  >
                    <path d="M24 2L42 12V36L24 46L6 36V12L24 2Z" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white group-hover:text-[#F2431E] transition-colors" />
                  </div>
                </div>

                {/* Text */}
                <div className="text-white whitespace-nowrap">
                  <p className="font-semibold text-xs lg:text-sm leading-tight group-hover:text-[#F2431E] transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[10px] lg:text-xs text-gray-300 leading-tight group-hover:text-orange-200 transition-colors">
                    {item.description}
                  </p>
                </div>
              </Link>
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
