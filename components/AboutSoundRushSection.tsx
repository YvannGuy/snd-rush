'use client';

import SectionChevron from './SectionChevron';

interface AboutSoundRushSectionProps {
  language: 'fr' | 'en';
}

export default function AboutSoundRushSection({ language }: AboutSoundRushSectionProps) {
  const texts = {
    fr: {
      title: 'Qui est SoundRush Paris ?',
      description: 'La solution clé en main pour sonoriser vos évènements à paris et ile de france. Notre mission est simple : vous offrir un son propre, fiable et prêt à l\'heure, sans stress. Conférence, soirée, mariage : vous choisissez un pack selon votre événement et votre nombre d\'invités, et on s\'occupe du reste (livraison, installation, réglages, tests sur place).',
    },
    en: {
      title: 'Who is SoundRush Paris?',
      description: 'SoundRush Paris is turnkey event sound systems in Paris and Île-de-France. Our mission is simple: provide you with clean, reliable sound ready on time, stress-free. Conference, party, wedding: you choose a pack based on your event and number of guests, and we handle the rest (delivery, installation, setup, on-site testing).',
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="about-soundrush" className="py-20 lg:py-28 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
            {currentTexts.title}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {currentTexts.description}
          </p>
        </div>

      </div>
      <SectionChevron nextSectionId="solutions" />
    </section>
  );
}

