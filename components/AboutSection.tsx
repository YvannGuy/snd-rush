
'use client';

import SectionChevron from './SectionChevron';

interface AboutSectionProps {
  language: 'fr' | 'en' | 'it' | 'es' | 'zh';
}

export default function AboutSection({ language }: AboutSectionProps) {

  const texts = {
    fr: {
      sectionTitle: 'POURQUOI SOUNDRUSH PARIS',
      features: [
        {
          icon: '⚡',
          title: 'Intervention rapide à Paris'
        },
        {
          icon: '🔑',
          title: 'Solutions clé en main, sans bricolage'
        },
        {
          icon: '⭐',
          title: 'Clients professionnels et particuliers exigeants'
        }
      ]
    },
    en: {
      sectionTitle: 'WHY SOUNDRUSH PARIS',
      features: [
        {
          icon: '⚡',
          title: 'Rapid intervention in Paris'
        },
        {
          icon: '🔑',
          title: 'Turnkey solutions, no DIY'
        },
        {
          icon: '⭐',
          title: 'Professional and demanding private clients'
        }
      ]
    },
    it: {
      sectionTitle: 'PERCHE SOUNDRUSH PARIS',
      features: [
        { icon: '⚡', title: 'Intervento rapido a Parigi' },
        { icon: '🔑', title: 'Soluzioni chiavi in mano, senza improvvisazioni' },
        { icon: '⭐', title: 'Clienti professionali e privati esigenti' }
      ]
    },
    es: {
      sectionTitle: 'POR QUE SOUNDRUSH PARIS',
      features: [
        { icon: '⚡', title: 'Intervencion rapida en Paris' },
        { icon: '🔑', title: 'Soluciones llave en mano, sin improvisar' },
        { icon: '⭐', title: 'Clientes profesionales y particulares exigentes' }
      ]
    },
    zh: {
      sectionTitle: '为什么选择 SOUNDRUSH PARIS',
      features: [
        { icon: '⚡', title: '巴黎地区快速响应' },
        { icon: '🔑', title: '一站式交付方案，省心无忧' },
        { icon: '⭐', title: '服务高标准企业与个人客户' }
      ]
    },
  };

  const currentTexts = texts[language];

  return (
    <section id="about" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Title */}
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-12 text-center">
          {currentTexts.sectionTitle}
        </p>

        {/* Features Cards Grid - Maximum 3 cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {currentTexts.features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 lg:p-8 border-2 border-gray-200 hover:border-[#F2431E] transition-all hover:shadow-lg text-center"
            >
              {/* Icon */}
              <div className="text-5xl mb-4">{feature.icon}</div>
              
              {/* Title */}
              <h3 className="text-lg lg:text-xl font-bold text-black">
                {feature.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
      <SectionChevron nextSectionId="gallery" />
    </section>
  );
}
