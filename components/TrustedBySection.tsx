'use client';

import SectionChevron from './SectionChevron';

interface TrustedBySectionProps {
  language: 'fr' | 'en';
}

export default function TrustedBySection({ language }: TrustedBySectionProps) {
  const texts = {
    fr: {
      title: "Ils nous ont fait confiance",
      subtitle: "Des entreprises et organisations qui nous font confiance pour leurs événements"
    },
    en: {
      title: "They trusted us",
      subtitle: "Companies and organizations who trust us for their events"
    }
  };

  const clients = [
    "Référence Studios",
    "Unikorn Events",
    "The Maptique SRL",
    "Fédération Syndicale Étudiante",
    "American School of Paris",
    "Wave in Paris",
    "Synergie productions",
    "Restaurant Leriche"
  ];

  const currentTexts = texts[language];

  return (
    <section id="trusted" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            <span className="text-black">{language === 'fr' ? 'Ils nous ont fait ' : 'They trusted '}</span>
            <span className="text-[#F2431E]">{language === 'fr' ? 'confiance' : 'us'}</span>
          </h2>
          <p className="text-xl text-gray-600">
            {currentTexts.subtitle}
          </p>
        </div>

        {/* Client Grid - All visible */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {clients.map((client, index) => (
            <div
              key={index}
              className="px-6 py-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-center justify-center"
            >
              <p className="text-base md:text-lg font-semibold text-gray-800 text-center">
                {client}
              </p>
            </div>
          ))}
        </div>
      </div>
      <SectionChevron nextSectionId="testimonials" />
    </section>
  );
}

