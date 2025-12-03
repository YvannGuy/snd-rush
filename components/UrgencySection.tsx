'use client';

interface UrgencySectionProps {
  language: 'fr' | 'en';
}

export default function UrgencySection({ language }: UrgencySectionProps) {
  const texts = {
    fr: {
      title: 'Besoin d\'une sono maintenant ?',
      description: 'Livraison, installation et dépannage rapide. Disponible 24/7.',
      callNow: 'Appeler maintenant'
    },
    en: {
      title: 'Need sound equipment now?',
      description: 'Fast delivery, installation and troubleshooting. Available 24/7.',
      callNow: 'Call now'
    }
  };

  const currentTexts = texts[language];

  return (
    <section className="py-16 lg:py-24 bg-[#F2431E]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left side - Icon and text */}
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-4xl">
              🕐
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {currentTexts.title}
              </h2>
              <p className="text-xl text-white/90">
                {currentTexts.description}
              </p>
            </div>
          </div>

          {/* Right side - Button */}
          <a
            href="tel:+33651084994"
            className="bg-white text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span>📞</span>
            {currentTexts.callNow}
          </a>
        </div>
      </div>
    </section>
  );
}

