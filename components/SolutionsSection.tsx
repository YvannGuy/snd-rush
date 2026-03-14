'use client';

import { Boxes, Lightbulb, Sparkles, Truck } from 'lucide-react';
import SectionChevron from './SectionChevron';

interface SolutionsSectionProps {
  language: 'fr' | 'en' | 'it' | 'es' | 'zh';
}

const SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=900&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&h=600&fit=crop&q=80',
];

export default function SolutionsSection({ language }: SolutionsSectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'NOS SOLUTIONS',
      title: 'Des solutions clé en main pour votre événement',
      intro: "Une offre premium, pensée pour livrer des événements fluides, élégants et parfaitement exécutés.",
      services: [
        {
          title: 'Organisation complète',
          description: "De l’idée à la mise en œuvre",
          icon: Lightbulb,
        },
        {
          title: 'Son et lumière professionnels',
          description: 'Installation haut de gamme',
          icon: Sparkles,
        },
        {
          title: 'Logistique et livraison',
          description: 'Tout pris en charge',
          icon: Truck,
        },
        {
          title: 'Événements sur mesure',
          description: 'Concerts, soirées, conférences, lancements produits',
          icon: Boxes,
        },
      ],
    },
    en: {
      sectionTitle: 'OUR SOLUTIONS',
      title: 'Turnkey solutions for your event',
      intro: 'A premium offer designed to deliver smooth, elegant and perfectly executed events.',
      services: [
        {
          title: 'Full event management',
          description: 'From concept to execution',
          icon: Lightbulb,
        },
        {
          title: 'Professional sound and lighting',
          description: 'High-end setup',
          icon: Sparkles,
        },
        {
          title: 'Logistics and delivery',
          description: 'Everything handled',
          icon: Truck,
        },
        {
          title: 'Tailor-made events',
          description: 'Concerts, parties, conferences, product launches',
          icon: Boxes,
        },
      ],
    },
    it: {
      sectionTitle: 'LE NOSTRE SOLUZIONI',
      title: "Soluzioni chiavi in mano per il tuo evento",
      intro: 'Un’offerta premium pensata per eventi fluidi, eleganti e perfettamente eseguiti.',
      services: [
        { title: 'Organizzazione completa', description: 'Dall’idea alla realizzazione', icon: Lightbulb },
        { title: 'Audio e luci professionali', description: 'Installazione di alto livello', icon: Sparkles },
        { title: 'Logistica e consegna', description: 'Tutto incluso', icon: Truck },
        { title: 'Eventi su misura', description: 'Concerti, feste, conferenze, lanci prodotto', icon: Boxes },
      ],
    },
    es: {
      sectionTitle: 'NUESTRAS SOLUCIONES',
      title: 'Soluciones llave en mano para tu evento',
      intro: 'Una oferta premium para eventos fluidos, elegantes y perfectamente ejecutados.',
      services: [
        { title: 'Organizacion completa', description: 'De la idea a la ejecucion', icon: Lightbulb },
        { title: 'Sonido e iluminacion profesional', description: 'Instalacion de alto nivel', icon: Sparkles },
        { title: 'Logistica y entrega', description: 'Todo incluido', icon: Truck },
        { title: 'Eventos a medida', description: 'Conciertos, fiestas, conferencias, lanzamientos', icon: Boxes },
      ],
    },
    zh: {
      sectionTitle: '我们的解决方案',
      title: '为您的活动提供一站式服务',
      intro: '高端执行标准，确保每一场活动都流畅、优雅且精准落地。',
      services: [
        { title: '全流程统筹', description: '从创意到落地执行', icon: Lightbulb },
        { title: '专业音响与灯光', description: '高标准安装交付', icon: Sparkles },
        { title: '物流与配送', description: '全程托管无忧', icon: Truck },
        { title: '定制化活动', description: '演出、派对、会议、产品发布', icon: Boxes },
      ],
    },
  };

  const currentTexts = texts[language];

  return (
    <section id="solutions" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-4">
          <p className="text-sm font-bold text-[#F2431E] uppercase tracking-wider mb-6">
            {currentTexts.sectionTitle}
          </p>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            {currentTexts.title}
          </h2>
        </div>

        {/* Intro */}
        <div className="text-center mb-16">
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {currentTexts.intro}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {currentTexts.services.map((service, index) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-7 shadow-sm hover:shadow-lg hover:border-[#F2431E]/50 transition-all duration-300"
              >
                <div className="mb-4 overflow-hidden rounded-xl">
                  <img
                    src={SERVICE_IMAGES[index]}
                    alt={service.title}
                    className="h-40 w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="inline-flex rounded-xl bg-[#F2431E]/10 p-3 text-[#F2431E]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900 leading-tight">
                  {service.title}
                </h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
      <SectionChevron nextSectionId="urgency" />
    </section>
  );
}

