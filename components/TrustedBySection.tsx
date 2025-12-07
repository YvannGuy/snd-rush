'use client';

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
    "Wave in Paris"
  ];

  const currentTexts = texts[language];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
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

        {/* Client Banner - Infinite Scrolling */}
        <div className="relative overflow-hidden">
          <div className="flex gap-8 md:gap-12 lg:gap-16 animate-scroll">
            {/* Duplicate items for seamless infinite loop */}
            {[...clients, ...clients, ...clients].map((client, index) => (
              <div
                key={`${client}-${index}`}
                className="flex-shrink-0"
              >
                <div className="px-8 py-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <p className="text-lg md:text-xl font-semibold text-gray-800 whitespace-nowrap">
                    {client}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-scroll {
          display: flex;
          animation: scroll 40s linear infinite;
          will-change: transform;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

