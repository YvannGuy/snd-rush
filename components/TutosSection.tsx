'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface TutosSectionProps {
  language: 'fr' | 'en';
}

export default function TutosSection({ language }: TutosSectionProps) {
  const texts = {
    fr: {
      title: 'Tutos',
      subtitle: 'Apprenez à utiliser votre matériel audio professionnel',
      tutorials: [
        {
          id: 1,
          slug: 'installation-pack-s',
          title: 'Guide complet : Installation d\'un Pack S pour petit événement',
          description: 'Découvrez comment installer et configurer un Pack S SoundRush pour vos événements de 30 à 70 personnes. Guide étape par étape avec nos experts.',
          image: '/pack2c.jpg',
          category: 'Installation'
        },
        {
          id: 2,
          slug: 'installation-caisson-basse',
          title: 'Comment installer et optimiser un caisson de basse ?',
          description: 'Guide professionnel pour installer correctement un caisson de basse FBT X-Sub. Optimisation du placement, réglages et connexions pour un son optimal.',
          image: '/caissonbasse.png',
          category: 'Installation'
        },
        {
          id: 3,
          slug: 'entretien-micro-sans-fil',
          title: 'Entretien et dépannage des micros sans fil : Guide complet',
          description: 'Apprenez à entretenir vos micros sans fil Mipro et Shure. Dépannage des problèmes courants, changement de piles, réglage des fréquences.',
          image: '/microshure.png',
          category: 'Entretien'
        },
        {
          id: 4,
          slug: 'configuration-sonorisation-evenement',
          title: 'Configuration sonorisation événement : Guide professionnel',
          description: 'Comment configurer une sonorisation complète pour votre événement ? Réglages console, placement enceintes, gestion des micros et optimisation du son.',
          image: '/installation.jpg',
          category: 'Configuration'
        }
      ]
    },
    en: {
      title: 'Tutorials',
      subtitle: 'Learn how to use your professional audio equipment',
      tutorials: [
        {
          id: 1,
          slug: 'installation-pack-s',
          title: 'Complete guide: Installing a Pack S for small events',
          description: 'Learn how to install and configure a SoundRush Pack S for your events with 30 to 70 people. Step-by-step guide with our experts.',
          image: '/pack2c.jpg',
          category: 'Installation'
        },
        {
          id: 2,
          slug: 'installation-caisson-basse',
          title: 'How to install and optimize a subwoofer?',
          description: 'Professional guide to properly install an FBT X-Sub subwoofer. Placement optimization, settings and connections for optimal sound.',
          image: '/caissonbasse.png',
          category: 'Installation'
        },
        {
          id: 3,
          slug: 'entretien-micro-sans-fil',
          title: 'Wireless microphone maintenance and troubleshooting: Complete guide',
          description: 'Learn how to maintain your Mipro and Shure wireless microphones. Troubleshooting common issues, battery replacement, frequency adjustment.',
          image: '/microshure.png',
          category: 'Maintenance'
        },
        {
          id: 4,
          slug: 'configuration-sonorisation-evenement',
          title: 'Event sound system configuration: Professional guide',
          description: 'How to configure a complete sound system for your event? Console settings, speaker placement, microphone management and sound optimization.',
          image: '/installation.jpg',
          category: 'Configuration'
        }
      ]
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="tutos" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            <span className="text-black">{currentTexts.title}</span>
          </h2>
          {currentTexts.subtitle && (
            <p className="text-xl text-gray-600">
              {currentTexts.subtitle}
            </p>
          )}
        </div>

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentTexts.tutorials.map((tutorial) => (
            <Link href={`/guides/${tutorial.slug}`} key={tutorial.id}>
            <Card
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 flex flex-col h-full"
            >
              {/* Image */}
              <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                <Image
                  src={tutorial.image}
                  alt={tutorial.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {/* Category Badge */}
                <div className="absolute bottom-2 right-2">
                  <span className="bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                    {tutorial.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-black mb-2 line-clamp-2 group-hover:text-[#F2431E] transition-colors">
                  {tutorial.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-3 flex-grow">
                  {tutorial.description}
                </p>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
