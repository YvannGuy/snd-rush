'use client';

import { Boxes, Lightbulb, Sparkles, Truck } from 'lucide-react';

interface ServicesSectionProps {
  language: 'fr' | 'en';
}

export default function ServicesSection({ language }: ServicesSectionProps) {
  const texts = {
    fr: {
      title: 'Services premium',
      intro: 'Une equipe experte pour produire des experiences elegantes, fluides et memorables.',
      services: [
        {
          title: 'Organisation complete',
          description: "De l'idee a la mise en oeuvre",
          icon: Lightbulb,
          image:
            'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Son et lumiere professionnels',
          description: 'Installation haut de gamme',
          icon: Sparkles,
          image:
            'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Logistique et livraison',
          description: 'Tout pris en charge',
          icon: Truck,
          image:
            'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Evenements sur mesure',
          description: 'Concerts, soirees, conferences, lancements produits',
          icon: Boxes,
          image:
            'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
        },
      ],
    },
    en: {
      title: 'Premium services',
      intro: 'An expert team crafting elegant, smooth and memorable events.',
      services: [
        {
          title: 'Full event management',
          description: 'From idea to execution',
          icon: Lightbulb,
          image:
            'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Professional sound and lighting',
          description: 'High-end installation',
          icon: Sparkles,
          image:
            'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Logistics and delivery',
          description: 'Everything handled',
          icon: Truck,
          image:
            'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Custom-made events',
          description: 'Concerts, parties, conferences, product launches',
          icon: Boxes,
          image:
            'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
        },
      ],
    },
  };

  const currentTexts = texts[language];

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-black sm:text-4xl">{currentTexts.title}</h2>
        <p className="mt-4 max-w-3xl text-base text-gray-600 sm:text-lg">{currentTexts.intro}</p>
        {/* Mobile layout — blocs numérotés inspirés de la maquette */}
        <div className="mt-10 -mx-6 flex gap-3 overflow-x-auto px-1 pb-2 md:hidden snap-x snap-mandatory">
          {currentTexts.services.map((service, idx) => {
            const number = String(idx + 1).padStart(2, '0');
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className="relative min-w-[78vw] max-w-sm snap-start overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25)), url('${service.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="flex h-full flex-col justify-between p-6 backdrop-blur-[1px]">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-semibold leading-none tracking-tight text-white">{number}</span>
                    <div className="h-px flex-1 bg-white/70" />
                    <Icon className="h-5 w-5 text-white/85" />
                  </div>
                  <div className="space-y-2 pt-12">
                    <h3 className="text-lg font-semibold uppercase tracking-[0.08em] text-white">{service.title}</h3>
                    <p className="text-sm leading-relaxed text-white/85">{service.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Desktop / tablet grid */}
        <div className="mt-12 hidden grid-cols-1 gap-6 md:grid md:grid-cols-2 xl:grid-cols-4">
          {currentTexts.services.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#C8A66A]/60 hover:shadow-xl"
              >
                <div className="inline-flex rounded-xl bg-black p-3 text-[#C8A66A] transition-colors duration-300 group-hover:bg-[#C8A66A] group-hover:text-black">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-black">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{service.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
