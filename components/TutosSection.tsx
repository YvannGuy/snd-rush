'use client';

import Image from 'next/image';
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
          title: 'Guide complet : Installation et configuration d\'une console de mixage',
          description: 'Découvrez comment installer et configurer votre console de mixage pour obtenir le meilleur son lors de vos événements.',
          image: '/platinedj.jpg',
          category: 'Console'
        },
        {
          id: 2,
          title: 'Comment protéger ses oreilles pendant un concert ou un festival ?',
          description: 'Acouphènes, oreilles qui sifflent ou baisse d\'audition passagère : découvrez les meilleures pratiques pour protéger votre audition.',
          image: '/concert.jpg',
          category: 'Protection'
        },
        {
          id: 3,
          title: 'Les techniques d\'enregistrement d\'un piano',
          description: 'Enregistrer un piano, c\'est à la fois un art et une aventure. Les conseils présentés ici décryptent toutes les techniques essentielles.',
          image: '/installation.jpg',
          category: 'Enregistrement'
        },
        {
          id: 4,
          title: 'DJ : Comment résoudre un problème de latence audio ?',
          description: 'Vous venez de brancher votre contrôleur DJ favori, prêt à lancer vos premiers sets, mais quelque chose ne va pas ? Découvrez les solutions.',
          image: '/platinedj2.jpg',
          category: 'DJ'
        }
      ]
    },
    en: {
      title: 'Tutorials',
      subtitle: 'Learn how to use your professional audio equipment',
      tutorials: [
        {
          id: 1,
          title: 'Complete guide: Installation and setup of a mixing console',
          description: 'Learn how to install and configure your mixing console to get the best sound for your events.',
          image: '/platinedj.jpg',
          category: 'Console'
        },
        {
          id: 2,
          title: 'How to protect your ears during a concert or festival?',
          description: 'Tinnitus, ringing ears or temporary hearing loss: discover best practices to protect your hearing.',
          image: '/concert.jpg',
          category: 'Protection'
        },
        {
          id: 3,
          title: 'Piano recording techniques',
          description: 'Recording a piano is both an art and an adventure. The advice presented here deciphers all essential techniques.',
          image: '/installation.jpg',
          category: 'Recording'
        },
        {
          id: 4,
          title: 'DJ: How to solve an audio latency problem?',
          description: 'You\'ve just plugged in your favorite DJ controller, ready to launch your first sets, but something\'s wrong? Discover the solutions.',
          image: '/platinedj2.jpg',
          category: 'DJ'
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
            <Card
              key={tutorial.id}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 flex flex-col h-full"
              onClick={() => {
                // Pour l'instant, pas de navigation
                // TODO: Ajouter la navigation vers la page du tutoriel
              }}
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
          ))}
        </div>
      </div>
    </section>
  );
}
