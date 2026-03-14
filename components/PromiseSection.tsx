'use client';

import { Sparkles, Truck, Headphones } from 'lucide-react';
import SectionChevron from './SectionChevron';

interface PromiseSectionProps {
  language: 'fr' | 'en' | 'it' | 'es' | 'zh';
}

export default function PromiseSection({ language }: PromiseSectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'NOTRE PROMESSE',
      statement:
        'Avec SoundRush Paris, chaque événement est une expérience parfaite, pensée et exécutée par des professionnels.',
      badges: [
        { label: 'Événements sur mesure', icon: Sparkles },
        { label: 'Livraison & Installation', icon: Truck },
        { label: 'Support 24h / Urgence', icon: Headphones },
      ],
    },
    en: {
      sectionTitle: 'OUR PROMISE',
      statement:
        'With SoundRush Paris, every event is a perfect experience, designed and executed by professionals.',
      badges: [
        { label: 'Custom events', icon: Sparkles },
        { label: 'Delivery & Installation', icon: Truck },
        { label: '24h / Emergency Support', icon: Headphones },
      ],
    },
    it: {
      sectionTitle: 'LA NOSTRA PROMESSA',
      statement:
        'Con SoundRush Paris, ogni evento è un\'esperienza perfetta, progettata e realizzata da professionisti.',
      badges: [
        { label: 'Eventi su misura', icon: Sparkles },
        { label: 'Consegna e installazione', icon: Truck },
        { label: 'Supporto 24h / Emergenze', icon: Headphones },
      ],
    },
    es: {
      sectionTitle: 'NUESTRA PROMESA',
      statement:
        'Con SoundRush Paris, cada evento es una experiencia perfecta, diseñada y ejecutada por profesionales.',
      badges: [
        { label: 'Eventos a medida', icon: Sparkles },
        { label: 'Entrega e instalación', icon: Truck },
        { label: 'Soporte 24h / Emergencias', icon: Headphones },
      ],
    },
    zh: {
      sectionTitle: '我们的承诺',
      statement:
        'SoundRush Paris 为每位客户打造完美活动体验，由专业团队全程设计与执行。',
      badges: [
        { label: '定制活动', icon: Sparkles },
        { label: '配送与安装', icon: Truck },
        { label: '24小时支持 / 紧急救援', icon: Headphones },
      ],
    },
  };

  const currentTexts = texts[language];

  return (
    <section id="promesse" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Title */}
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-4 text-center">
          {currentTexts.sectionTitle}
        </p>

        {/* Brand Statement */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-14 text-center max-w-4xl mx-auto leading-tight">
          {currentTexts.statement}
        </h2>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {currentTexts.badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 rounded-2xl border-2 border-gray-200 hover:border-[#F2431E] transition-all hover:shadow-lg bg-gray-50/50 hover:bg-white"
              >
                <div className="w-14 h-14 rounded-full bg-[#F2431E]/10 flex items-center justify-center mb-4 text-[#F2431E]">
                  <Icon className="w-7 h-7" />
                </div>
                <p className="font-bold text-black text-lg">{badge.label}</p>
              </div>
            );
          })}
        </div>
      </div>
      <SectionChevron nextSectionId="trusted" />
    </section>
  );
}
