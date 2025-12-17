'use client';

interface CommentCaMarcheSectionProps {
  language: 'fr' | 'en';
}

export default function CommentCaMarcheSection({ language }: CommentCaMarcheSectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'COMMENT ÇA MARCHE',
      title: 'Un processus simple et sécurisé',
      steps: [
        {
          number: 1,
          title: 'Expliquez votre événement',
          description: 'Via notre assistant intelligent ou un formulaire guidé.'
        },
        {
          number: 2,
          title: 'Validation & ajustement',
          description: 'Nous vérifions la disponibilité et adaptons la solution si nécessaire.'
        },
        {
          number: 3,
          title: 'Paiement & confirmation',
          description: 'La date est sécurisée après paiement.'
        },
        {
          number: 4,
          title: 'Installation & sérénité',
          description: 'Nous livrons, installons et assurons le bon déroulement technique.'
        }
      ]
    },
    en: {
      sectionTitle: 'HOW IT WORKS',
      title: 'A simple and secure process',
      steps: [
        {
          number: 1,
          title: 'Explain your event',
          description: 'Via our intelligent assistant or a guided form.'
        },
        {
          number: 2,
          title: 'Validation & adjustment',
          description: 'We check availability and adapt the solution if necessary.'
        },
        {
          number: 3,
          title: 'Payment & confirmation',
          description: 'The date is secured after payment.'
        },
        {
          number: 4,
          title: 'Installation & peace of mind',
          description: 'We deliver, install and ensure smooth technical execution.'
        }
      ]
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="howItWorks" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Title */}
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-4 text-center">
          {currentTexts.sectionTitle}
        </p>

        {/* Main Title */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 text-center">
          {language === 'fr' ? (
            <>
              <span className="text-black">Un processus </span>
              <span className="text-[#F2431E]">simple et sécurisé</span>
            </>
          ) : (
            <>
              <span className="text-black">A </span>
              <span className="text-[#F2431E]">simple and secure</span>
              <span className="text-black"> process</span>
            </>
          )}
        </h2>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {currentTexts.steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 lg:p-8 border-2 border-gray-200 hover:border-[#F2431E] transition-all hover:shadow-lg"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#F2431E] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl lg:text-4xl font-bold text-white">{step.number}</span>
                </div>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-black mb-3 text-center">
                {step.title}
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
