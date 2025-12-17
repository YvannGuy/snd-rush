'use client';

interface UrgencySectionProps {
  language: 'fr' | 'en';
}

export default function UrgencySection({ language }: UrgencySectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'SECTION URGENCE',
      title: 'Intervention événementielle en urgence Paris',
      description: 'Un problème technique de dernière minute ?',
      description2: 'Absence de son, micro défaillant, équipement manquant ?',
      description3: 'Nous intervenons rapidement sous réserve de disponibilité.',
      description4: 'Service premium réservé aux situations urgentes.',
      cta: 'Demande urgente'
    },
    en: {
      sectionTitle: 'URGENCY SECTION',
      title: 'Emergency event intervention Paris',
      description: 'A last-minute technical problem?',
      description2: 'No sound, faulty microphone, missing equipment?',
      description3: 'We intervene quickly subject to availability.',
      description4: 'Premium service reserved for urgent situations.',
      cta: 'Urgent request'
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="urgency" className="py-16 lg:py-24 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left side - Illustration */}
          <div className="flex-shrink-0 w-full lg:w-1/2 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-md flex items-center justify-center">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Cercle d'alarme animé */}
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                <div className="absolute inset-4 rounded-full bg-white/30 animate-pulse"></div>
                {/* Icône centrale */}
                <div className="relative z-10 w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <svg className="w-32 h-32 text-[#F2431E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                {/* Texte "URGENCE" */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <span className="text-white font-bold text-2xl tracking-wider">URGENCE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="flex-1 w-full lg:w-1/2">
            {/* Section Title */}
            <p className="text-xs font-bold text-white/90 uppercase tracking-[0.2em] mb-4">
              {currentTexts.sectionTitle}
            </p>

            {/* Main Title */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {currentTexts.title}
            </h2>

            {/* Description */}
            <div className="space-y-3 mb-8">
              <p className="text-lg md:text-xl text-white/95">
                {currentTexts.description}
              </p>
              <p className="text-lg md:text-xl text-white/95">
                {currentTexts.description2}
              </p>
              <p className="text-base md:text-lg text-white/90">
                {currentTexts.description3}
              </p>
              <p className="text-base md:text-lg text-white/90">
                {currentTexts.description4}
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
              }}
              className="bg-white text-[#F2431E] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              <span>🔴</span>
              {currentTexts.cta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

