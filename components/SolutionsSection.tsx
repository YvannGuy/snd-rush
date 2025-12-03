'use client';

import Link from 'next/link';

interface SolutionsSectionProps {
  language: 'fr' | 'en';
  onReservePack?: (packId: number) => void;
}

export default function SolutionsSection({ language, onReservePack }: SolutionsSectionProps) {
  const texts = {
    fr: {
      title: 'Nos Solutions',
      subtitle: 'Packs adaptés à chaque événement',
      viewPack: 'Voir le pack',
      solutions: [
        {
          id: 3,
          icon: '❤️',
          title: 'Mariage',
          description: 'Sonorisation romantique et élégante pour votre plus beau jour.'
        },
        {
          id: 4,
          icon: '🎂',
          title: 'Anniversaire',
          description: 'Ambiance festive garantie pour célébrer en musique.'
        },
        {
          id: 6,
          icon: '🎵',
          title: 'Soirée privée',
          description: 'Équipement professionnel pour vos soirées entre amis.'
        },
        {
          id: 2,
          icon: '🎤',
          title: 'Conférence',
          description: 'Sonorisation claire et professionnelle pour vos événements d\'entreprise.'
        }
      ]
    },
    en: {
      title: 'Our Solutions',
      subtitle: 'Packs adapted to each event',
      viewPack: 'View pack',
      solutions: [
        {
          id: 3,
          icon: '❤️',
          title: 'Wedding',
          description: 'Romantic and elegant sound system for your special day.'
        },
        {
          id: 4,
          icon: '🎂',
          title: 'Birthday',
          description: 'Festive atmosphere guaranteed to celebrate with music.'
        },
        {
          id: 6,
          icon: '🎵',
          title: 'Private party',
          description: 'Professional equipment for your parties with friends.'
        },
        {
          id: 2,
          icon: '🎤',
          title: 'Conference',
          description: 'Clear and professional sound system for your corporate events.'
        }
      ]
    }
  };

  const currentTexts = texts[language];

  const handleViewPack = (packId: number) => {
    // Redirect to pack detail page
    window.location.href = `/packs/${packId}`;
  };

  return (
    <section id="solutions" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            {currentTexts.title}
          </h2>
          <p className="text-xl text-gray-600">
            {currentTexts.subtitle}
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentTexts.solutions.map((solution) => (
            <div
              key={solution.id}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 flex flex-col h-full"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mb-4 text-3xl">
                {solution.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-black mb-3">
                {solution.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 flex-grow">
                {solution.description}
              </p>

              {/* Button */}
              <button
                onClick={() => handleViewPack(solution.id)}
                className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors mt-auto"
              >
                {currentTexts.viewPack}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

