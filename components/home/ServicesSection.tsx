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
        },
        {
          title: 'Son et lumiere professionnels',
          description: 'Installation haut de gamme',
          icon: Sparkles,
        },
        {
          title: 'Logistique et livraison',
          description: 'Tout pris en charge',
          icon: Truck,
        },
        {
          title: 'Evenements sur mesure',
          description: 'Concerts, soirees, conferences, lancements produits',
          icon: Boxes,
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
        },
        {
          title: 'Professional sound and lighting',
          description: 'High-end installation',
          icon: Sparkles,
        },
        {
          title: 'Logistics and delivery',
          description: 'Everything handled',
          icon: Truck,
        },
        {
          title: 'Custom-made events',
          description: 'Concerts, parties, conferences, product launches',
          icon: Boxes,
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
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
