
'use client';

interface AboutSectionProps {
  language: 'fr' | 'en';
}

export default function AboutSection({ language }: AboutSectionProps) {

  const texts = {
    fr: {
      title: 'Pourquoi SoundRush',
      subtitle: 'Des raisons de nous faire confiance',
      features: [
        {
          icon: '🔧',
          title: 'Installation sur mesure',
          description: 'Nos techniciens qualifiés installent et configurent votre matériel selon vos besoins.'
        },
        {
          icon: '⭐',
          title: 'Matériel haut de gamme',
          description: 'Équipement professionnel de qualité pour garantir le succès de votre événement.'
        },
        {
          icon: '🕐',
          title: 'Urgence 24/7',
          description: 'Disponible à tout moment pour répondre à vos besoins urgents.'
        },
        {
          icon: '📦',
          title: 'Packs adaptables',
          description: 'Des formules flexibles qui s\'adaptent à tous vos événements.'
        }
      ]
    },
    en: {
      title: 'Why SoundRush',
      subtitle: 'Reasons to trust us',
      features: [
        {
          icon: '🔧',
          title: 'Custom installation',
          description: 'Our qualified technicians install and configure your equipment according to your needs.'
        },
        {
          icon: '⭐',
          title: 'High-end equipment',
          description: 'Professional quality equipment to guarantee the success of your event.'
        },
        {
          icon: '🕐',
          title: '24/7 Emergency',
          description: 'Available at any time to meet your urgent needs.'
        },
        {
          icon: '📦',
          title: 'Adaptable packs',
          description: 'Flexible formulas that adapt to all your events.'
        }
      ]
    }
  };

  return (
    <section id="about" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            <span className="text-black">{language === 'fr' ? 'Pourquoi ' : 'Why '}</span>
            <span className="text-[#F2431E]">SoundRush</span>
          </h2>
          <p className="text-xl text-gray-600">
            {texts[language].subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {texts[language].features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 text-center"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mb-4 mx-auto text-3xl">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-black mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
