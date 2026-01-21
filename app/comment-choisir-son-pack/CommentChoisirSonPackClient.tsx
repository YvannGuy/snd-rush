'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Home, Music, Calendar, MapPin, Volume2 } from 'lucide-react';
import Link from 'next/link';
import SEOHead from '@/components/SEOHead';

export default function CommentChoisirSonPackClient() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const texts = {
    fr: {
      title: 'Comment choisir son pack pour son événement ?',
      subtitle: 'Guide complet pour faire le bon choix',
      intro: 'Choisir le bon pack de sonorisation est essentiel pour le succès de votre événement. Plusieurs critères sont à prendre en compte : le nombre de personnes, le lieu (intérieur ou extérieur), l\'ambiance souhaitée et le type d\'événement.',
      criteria: {
        title: 'Les critères à prendre en compte',
        items: [
          {
            icon: Users,
            title: 'Nombre de personnes',
            description: 'Le nombre d\'invités détermine la puissance nécessaire. Plus il y a de monde, plus il faut de puissance sonore pour couvrir l\'ensemble de l\'espace.'
          },
          {
            icon: Home,
            title: 'Lieu : Intérieur ou Extérieur',
            description: 'Les événements en extérieur nécessitent plus de puissance car le son se disperse davantage. En intérieur, l\'acoustique de la salle joue aussi un rôle important.'
          },
          {
            icon: Music,
            title: 'Ambiance : Douce ou Dansante',
            description: 'Une ambiance douce (fond musical, discours) nécessite moins de puissance qu\'une ambiance dansante avec de la musique forte et des basses marquées.'
          },
          {
            icon: Calendar,
            title: 'Type d\'événement',
            description: 'Chaque type d\'événement a ses spécificités : mariage (cérémonie + soirée), conférence (prise de parole), soirée privée (musique), etc.'
          }
        ]
      },
      packs: {
        title: 'Nos packs adaptés',
        items: [
          {
            name: 'Pack Conférence',
            description: 'Idéal pour réunions, conférences, séminaires jusqu\'à 1500 personnes',
            features: ['Enceinte professionnelle', 'Micros sans-fil', 'Console de mixage', 'Installation incluse'],
            link: '/conference',
            people: 'Jusqu\'à 1500 personnes',
            ambiance: 'Ambiance douce',
            location: 'Intérieur recommandé'
          },
          {
            name: 'Pack Soirée',
            description: 'Parfait pour soirées privées, anniversaires, événements festifs jusqu\'à 1500 personnes',
            features: ['Enceinte haute puissance', 'Console de mixage', 'Câbles et accessoires', 'Livraison incluse'],
            link: '/soiree',
            people: 'Jusqu\'à 1500 personnes',
            ambiance: 'Ambiance dansante',
            location: 'Intérieur/Extérieur'
          },
          {
            name: 'Pack Mariage',
            description: 'Solution complète pour mariages jusqu\'à 1500 personnes : cérémonie, cocktail et soirée',
            features: ['Enceinte + caisson de basses', 'Micros sans-fil', 'Console professionnelle', 'Support technique'],
            link: '/mariage',
            people: 'Jusqu\'à 1500 personnes',
            ambiance: 'Polyvalent',
            location: 'Intérieur/Extérieur'
          }
        ]
      },
      guide: {
        title: 'Guide de sélection rapide',
        steps: [
          {
            step: '1',
            title: 'Déterminez le nombre de personnes',
            content: 'Comptez le nombre d\'invités attendus. Pour plus de 1500 personnes, contactez-nous pour une solution sur mesure.'
          },
          {
            step: '2',
            title: 'Identifiez le lieu',
            content: 'Intérieur ou extérieur ? En extérieur, prévoyez 30% de puissance supplémentaire pour compenser la dispersion du son.'
          },
          {
            step: '3',
            title: 'Définissez l\'ambiance',
            content: 'Ambiance douce (fond musical, discours) ou dansante (musique forte, basses) ? Cela détermine le type de matériel nécessaire.'
          },
          {
            step: '4',
            title: 'Choisissez votre pack',
            content: 'Selon vos critères, sélectionnez le pack adapté. En cas de doute, notre équipe est là pour vous conseiller.'
          }
        ]
      },
      cta: {
        title: 'Besoin d\'aide pour choisir ?',
        description: 'Notre équipe d\'experts est disponible pour vous conseiller et vous proposer la solution adaptée à votre événement.',
        button: 'Nous contacter'
      }
    },
    en: {
      title: 'How to choose your pack for your event?',
      subtitle: 'Complete guide to make the right choice',
      intro: 'Choosing the right sound pack is essential for the success of your event. Several criteria must be taken into account: the number of people, the location (indoor or outdoor), the desired atmosphere and the type of event.',
      criteria: {
        title: 'Criteria to consider',
        items: [
          {
            icon: Users,
            title: 'Number of people',
            description: 'The number of guests determines the power needed. The more people there are, the more sound power is needed to cover the entire space.'
          },
          {
            icon: Home,
            title: 'Location: Indoor or Outdoor',
            description: 'Outdoor events require more power because sound disperses more. Indoors, the acoustics of the room also play an important role.'
          },
          {
            icon: Music,
            title: 'Atmosphere: Soft or Dancing',
            description: 'A soft atmosphere (background music, speeches) requires less power than a dancing atmosphere with loud music and marked bass.'
          },
          {
            icon: Calendar,
            title: 'Type of event',
            description: 'Each type of event has its specificities: wedding (ceremony + party), conference (speaking), private party (music), etc.'
          }
        ]
      },
      packs: {
        title: 'Our adapted packs',
        items: [
          {
            name: 'Conference Pack',
            description: 'Ideal for meetings, conferences, seminars up to 1500 people',
            features: ['Professional speaker', 'Wireless microphones', 'Mixing console', 'Installation included'],
            link: '/conference',
            people: 'Up to 1500 people',
            ambiance: 'Soft atmosphere',
            location: 'Indoor recommended'
          },
          {
            name: 'Party Pack',
            description: 'Perfect for private parties, birthdays, festive events up to 1500 people',
            features: ['High power speaker', 'Mixing console', 'Cables and accessories', 'Delivery included'],
            link: '/soiree',
            people: 'Up to 1500 people',
            ambiance: 'Dancing atmosphere',
            location: 'Indoor/Outdoor'
          },
          {
            name: 'Wedding Pack',
            description: 'Complete solution for weddings up to 1500 people: ceremony, cocktail and party',
            features: ['Speaker + subwoofer', 'Wireless microphones', 'Professional console', 'Technical support'],
            link: '/mariage',
            people: 'Up to 1500 people',
            ambiance: 'Versatile',
            location: 'Indoor/Outdoor'
          }
        ]
      },
      guide: {
        title: 'Quick selection guide',
        steps: [
          {
            step: '1',
            title: 'Determine the number of people',
            content: 'Count the number of expected guests. For more than 1500 people, contact us for a custom solution.'
          },
          {
            step: '2',
            title: 'Identify the location',
            content: 'Indoor or outdoor? Outdoors, plan 30% additional power to compensate for sound dispersion.'
          },
          {
            step: '3',
            title: 'Define the atmosphere',
            content: 'Soft atmosphere (background music, speeches) or dancing (loud music, bass)? This determines the type of equipment needed.'
          },
          {
            step: '4',
            title: 'Choose your pack',
            content: 'According to your criteria, select the appropriate pack. If in doubt, our team is here to advise you.'
          }
        ]
      },
      cta: {
        title: 'Need help choosing?',
        description: 'Our team of experts is available to advise you and offer you the solution adapted to your event.',
        button: 'Contact us'
      }
    }
  };

  const currentTexts = texts[language];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={currentTexts.title}
        description={`${currentTexts.subtitle} - ${currentTexts.intro.substring(0, 150)}...`}
        canonicalUrl="https://www.sndrush.com/comment-choisir-son-pack"
      />
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="pt-[112px] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              {currentTexts.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentTexts.subtitle}
            </p>
          </div>

          {/* Intro */}
          <div className="max-w-3xl mx-auto mb-16">
            <p className="text-lg text-gray-700 leading-relaxed">
              {currentTexts.intro}
            </p>
          </div>

          {/* Criteria */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {currentTexts.criteria.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentTexts.criteria.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-[#F2431E] rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Guide */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {currentTexts.guide.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentTexts.guide.steps.map((step, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {step.step}
                    </div>
                    <CardTitle className="text-lg mt-4">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{step.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Packs */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {currentTexts.packs.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentTexts.packs.items.map((pack, index) => (
                <Card key={index} className="hover:shadow-xl transition-all">
                  <CardHeader>
                    <CardTitle className="text-2xl text-[#F2431E] mb-2">{pack.name}</CardTitle>
                    <p className="text-gray-600">{pack.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Users className="w-4 h-4 text-[#F2431E]" />
                        <span>{pack.people}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Music className="w-4 h-4 text-[#F2431E]" />
                        <span>{pack.ambiance}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="w-4 h-4 text-[#F2431E]" />
                        <span>{pack.location}</span>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {pack.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-[#F2431E]">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={pack.link}
                      className="block w-full text-center bg-[#F2431E] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
                    >
                      {language === 'fr' ? 'Découvrir le pack' : 'Discover the pack'}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-[#F2431E] to-[#E63A1A] text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">{currentTexts.cta.title}</h3>
              <p className="text-lg mb-6 opacity-90">{currentTexts.cta.description}</p>
              <a
                href="tel:+33744782754"
                className="inline-block bg-white text-[#F2431E] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                {currentTexts.cta.button}
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => {}}
        onRentalConditionsClick={() => {}}
      />
    </div>
  );
}

