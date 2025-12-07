'use client';

import Link from 'next/link';

interface PourQuiSectionProps {
  language: 'fr' | 'en';
}

export default function PourQuiSection({ language }: PourQuiSectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'POUR QUI ?',
      title: 'On s\'occupe de tout, pour tous vos événements',
      categories: [
        { name: 'Mariages', icon: '💒' },
        { name: 'Anniversaires', icon: '🎂' },
        { name: 'Concerts & live', icon: '🎵' },
        { name: 'Soirées privées', icon: '🎉' },
        { name: 'Corporate & séminaires', icon: '🏢' },
        { name: 'Associations & églises', icon: '⛪' },
        { name: 'Écoles & salles municipales', icon: '🏛️' }
      ],
      cta: 'Voir les packs adaptés'
    },
    en: {
      sectionTitle: 'FOR WHO?',
      title: 'We take care of everything, for all your events',
      categories: [
        { name: 'Weddings', icon: '💒' },
        { name: 'Birthdays', icon: '🎂' },
        { name: 'Concerts & live', icon: '🎵' },
        { name: 'Private parties', icon: '🎉' },
        { name: 'Corporate & seminars', icon: '🏢' },
        { name: 'Associations & churches', icon: '⛪' },
        { name: 'Schools & town halls', icon: '🏛️' }
      ],
      cta: 'View adapted packs'
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="forWho" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Title */}
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-4 text-center">
          {currentTexts.sectionTitle}
        </p>

        {/* Title */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-12 text-center">
          <span className="text-black">On s'occupe de tout, pour tous vos </span>
          <span className="text-[#F2431E]">événements</span>
        </h2>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {currentTexts.categories.map((category, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-[#F2431E] transition-all hover:shadow-lg text-center cursor-pointer transform hover:scale-105"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <p className="font-semibold text-gray-900 text-sm">{category.name}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/packs"
            className="inline-block bg-[#F2431E] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#E63A1A] transition-all transform hover:scale-105 shadow-lg"
          >
            {currentTexts.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

