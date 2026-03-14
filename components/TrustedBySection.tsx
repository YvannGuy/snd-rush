'use client';

import SectionChevron from './SectionChevron';

interface TrustedBySectionProps {
  language: 'fr' | 'en' | 'it' | 'es' | 'zh';
}

export default function TrustedBySection({ language }: TrustedBySectionProps) {
  const texts = {
    fr: {
      title: "Ils nous ont fait confiance",
      subtitle: "Des entreprises et organisations françaises et internationales qui nous font confiance pour leurs événements"
    },
    en: {
      title: "They trusted us",
      subtitle: "Companies and organizations who trust us for their events"
    },
    it: {
      title: 'Si fidano di noi',
      subtitle: 'Aziende e organizzazioni che ci affidano i loro eventi'
    },
    es: {
      title: 'Confian en nosotros',
      subtitle: 'Empresas y organizaciones que confian en nosotros para sus eventos'
    },
    zh: {
      title: '他们选择了我们',
      subtitle: '众多企业与机构将活动交给我们执行'
    },
  };

  const clients = [
    { name: "Référence Studios", flag: "🇫🇷" },
    { name: "Unikorn Events", flag: "🇫🇷" },
    { name: "The Maptique SRL", flag: "🇮🇹" },
    { name: "Fédération Syndicale Étudiante", flag: "🇫🇷" },
    { name: "American School of Paris", flag: "🇺🇸" },
    { name: "Wave in Paris", flag: "🇫🇷" },
    { name: "Synergie productions", flag: "🇫🇷" },
    { name: "Restaurant Leriche", flag: "🇲🇶" },
    { name: "Poltrona Fau", flag: "🇮🇹" },
    { name: "Nude Project", flag: "🇪🇸" },
    { name: "La Bourse de Paris", flag: "🇫🇷" }
  ];

  const currentTexts = texts[language];

  return (
    <section id="trusted" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            <span className="text-black">
              {language === 'fr'
                ? 'Ils nous ont fait '
                : language === 'it'
                  ? 'Si fidano di '
                  : language === 'es'
                    ? 'Confian en '
                    : language === 'zh'
                      ? '他们'
                      : 'They trusted '}
            </span>
            <span className="text-[#F2431E]">
              {language === 'fr'
                ? 'confiance'
                : language === 'it'
                  ? 'noi'
                  : language === 'es'
                    ? 'nosotros'
                    : language === 'zh'
                      ? '选择了我们'
                      : 'us'}
            </span>
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
              className="px-6 py-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-center justify-center gap-2"
            >
              {client.flag && (
                <span className="text-2xl">{client.flag}</span>
              )}
              <p className="text-base md:text-lg font-semibold text-gray-800 text-center">
                {client.name}
              </p>
            </div>
          ))}
        </div>
      </div>
      <SectionChevron nextSectionId="testimonials" />
    </section>
  );
}

