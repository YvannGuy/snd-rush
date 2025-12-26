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
          title: 'Choisissez votre pack',
          description: 'Sélectionnez la solution adaptée à votre événement : Conférence, Soirée ou Mariage.'
        },
        {
          number: 2,
          title: 'Remplissez votre réservation',
          description: 'Indiquez vos dates, lieu, nombre de personnes et finalisez votre sélection.'
        },
        {
          number: 3,
          title: 'Paiement de l\'acompte',
          description: 'Sécurisez votre date avec un acompte de 30%. Le solde sera demandé 5 jours avant l\'événement.'
        },
        {
          number: 4,
          title: 'Installation & sérénité',
          description: 'Nous livrons, installons et assurons le bon déroulement technique de votre événement.'
        }
      ]
    },
    en: {
      sectionTitle: 'HOW IT WORKS',
      title: 'A simple and secure process',
      steps: [
        {
          number: 1,
          title: 'Choose your pack',
          description: 'Select the solution adapted to your event: Conference, Party or Wedding.'
        },
        {
          number: 2,
          title: 'Complete your reservation',
          description: 'Enter your dates, location, number of people and finalize your selection.'
        },
        {
          number: 3,
          title: 'Pay the deposit',
          description: 'Secure your date with a 30% deposit. The balance will be requested 5 days before the event.'
        },
        {
          number: 4,
          title: 'Installation & peace of mind',
          description: 'We deliver, install and ensure smooth technical execution of your event.'
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
