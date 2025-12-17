'use client';

interface IASectionProps {
  language: 'fr' | 'en';
}

export default function IASection({ language }: IASectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'SECTION IA – POSITIONNEMENT FORT',
      title: 'Un assistant intelligent pour éviter les erreurs techniques',
      description: 'Choisir le bon équipement dépend du lieu, du nombre de personnes et du type d\'événement.',
      description2: 'Notre assistant SoundRush vous guide en quelques questions pour identifier la solution la plus fiable, sans jargon technique.',
      point1: 'Vous décrivez votre événement.',
      point2: 'Nous nous chargeons du reste.',
      cta: 'Lancer l\'assistant'
    },
    en: {
      sectionTitle: 'AI SECTION – STRONG POSITIONING',
      title: 'An intelligent assistant to avoid technical errors',
      description: 'Choosing the right equipment depends on the venue, number of people, and type of event.',
      description2: 'Our SoundRush assistant guides you through a few questions to identify the most reliable solution, without technical jargon.',
      point1: 'You describe your event.',
      point2: 'We take care of the rest.',
      cta: 'Launch the assistant'
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="aiSection" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Title */}
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-4 text-center">
          {currentTexts.sectionTitle}
        </p>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left side - Content */}
          <div className="flex-1 w-full lg:w-1/2">
            {/* Main Title */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
              {currentTexts.title}
            </h2>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <p className="text-lg md:text-xl text-gray-700">
                {currentTexts.description}
              </p>
              <p className="text-lg md:text-xl text-gray-700">
                {currentTexts.description2}
              </p>
            </div>

            {/* Points */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👉</span>
                <p className="text-lg md:text-xl text-gray-800 font-medium">
                  {currentTexts.point1}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">👉</span>
                <p className="text-lg md:text-xl text-gray-800 font-medium">
                  {currentTexts.point2}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
              }}
              className="bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#E63A1A] transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              <span>👉</span>
              {currentTexts.cta}
            </button>
          </div>

          {/* Right side - Phone Image with Chat */}
          <div className="flex-1 w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
              {/* Phone Frame - Black Modern Style */}
              <div className="relative bg-black rounded-[3.5rem] p-3 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                
                {/* Phone Screen */}
                <div className="bg-white rounded-[3rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="bg-white px-6 py-3 flex items-center justify-between text-xs border-b border-gray-100">
                    <span className="font-semibold text-black">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-3 border border-gray-600 rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* App Header */}
                  <div className="bg-gradient-to-r from-[#F2431E] to-[#E63A1A] px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#F2431E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">SoundRush Assistant</p>
                        <p className="text-xs text-white/90">{language === 'fr' ? 'Support client professionnel' : 'Professional Customer Support'}</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center">
                      <span className="text-white text-xs">i</span>
                    </div>
                  </div>
                  
                  {/* Chat Interface - Dark Background */}
                  <div className="bg-[#1a1a1a] p-4 min-h-[500px] flex flex-col">
                    {/* Chat Messages */}
                    <div className="space-y-4 flex-1">
                      {/* Bot Message 1 */}
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 bg-[#F2431E] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">SR</span>
                        </div>
                        <div className="bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                          <p className="text-sm text-white">
                            {language === 'fr' ? 'Bonjour ! Décrivez-moi votre événement et je vous propose la meilleure solution sonore.' : 'Hello! Describe your event and I\'ll suggest the best sound solution.'}
                          </p>
                        </div>
                      </div>

                      {/* User Message */}
                      <div className="flex items-start gap-2 justify-end">
                        <div className="bg-[#F2431E] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                          <p className="text-sm text-white">
                            {language === 'fr' ? 'Mariage pour 100 personnes en extérieur' : 'Wedding for 100 people outdoors'}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-300 text-xs">👤</span>
                        </div>
                      </div>

                      {/* Bot Response */}
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 bg-[#F2431E] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">SR</span>
                        </div>
                        <div className="bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                          <p className="text-sm text-white">
                            {language === 'fr' ? 'Parfait ! Je vous recommande notre Pack Mariage avec système extérieur renforcé. Livraison et installation incluses.' : 'Perfect! I recommend our Wedding Pack with reinforced outdoor system. Delivery and installation included.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 bg-gray-800 rounded-full px-4 py-3">
                        <p className="text-xs text-gray-400">
                          {language === 'fr' ? 'Tapez votre message...' : 'Type your message...'}
                        </p>
                      </div>
                      <button className="w-10 h-10 bg-[#F2431E] rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
