'use client';

interface UrgencySectionProps {
  language: 'fr' | 'en';
}

export default function UrgencySection({ language }: UrgencySectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'URGENCE 24/7',
      title: 'Besoin de son matériel en urgence ?',
      description: 'Une enceinte, un micro, ou une régie complète, en moins de 2 heures ?',
      description2: 'Nous intervenons en nuit, week-end & jours fériés, partout en Île-de-France.',
      callNow: 'Appeler maintenant',
      whatsapp: 'WhatsApp → réponse en 2 min',
      urgencyFee: 'Majoration urgence : +20%'
    },
    en: {
      sectionTitle: 'EMERGENCY 24/7',
      title: 'Need sound equipment urgently?',
      description: 'A speaker, a microphone, or a complete setup, in less than 2 hours?',
      description2: 'We intervene at night, weekends & holidays, throughout Île-de-France.',
      callNow: 'Call now',
      whatsapp: 'WhatsApp → response in 2 min',
      urgencyFee: 'Emergency surcharge: +20%'
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="urgency" className="py-16 lg:py-24 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Title */}
        <p className="text-xs font-bold text-white/90 uppercase tracking-[0.2em] mb-6 text-center">
          {currentTexts.sectionTitle}
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left side - Content */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {currentTexts.title}
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-2">
              {currentTexts.description}
            </p>
            <p className="text-lg md:text-xl text-white/80 mb-6">
              {currentTexts.description2}
            </p>

            {/* Encadré Majoration */}
            <div className="inline-block bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl px-6 py-3 mb-6">
              <p className="text-white font-bold text-lg">
                {currentTexts.urgencyFee}
              </p>
            </div>
          </div>

          {/* Right side - Buttons */}
          <div className="flex flex-col gap-4 w-full lg:w-auto">
            <a
              href="tel:+33651084994"
              className="bg-white text-[#F2431E] px-8 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 whitespace-nowrap"
            >
              <span>📞</span>
              {currentTexts.callNow}
            </a>
            <a
              href="https://wa.me/33651084994"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 backdrop-blur-sm border-2 border-white text-white px-8 py-5 rounded-xl font-bold text-lg hover:bg-white/30 transition-all transform hover:scale-105 flex items-center justify-center gap-3 whitespace-nowrap"
            >
              <span>💬</span>
              {currentTexts.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

