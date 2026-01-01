'use client';

import { CheckCircle2, Package, Wrench, Zap, Shield } from 'lucide-react';

interface AboutSoundRushSectionProps {
  language: 'fr' | 'en';
}

export default function AboutSoundRushSection({ language }: AboutSoundRushSectionProps) {
  const texts = {
    fr: {
      title: 'Qui est SoundRush Paris ?',
      description: 'SoundRush Paris, c\'est la sonorisation événementielle clé en main à Paris et en Île-de-France. Notre mission est simple : vous offrir un son propre, fiable et prêt à l\'heure, sans stress. Conférence, soirée, mariage : vous choisissez un pack selon votre événement et votre nombre d\'invités, et on s\'occupe du reste (livraison, installation, réglages, tests sur place).',
      subtitle: 'Ce qui nous différencie',
      features: [
        {
          icon: Package,
          title: 'Des packs "sans prise de tête"',
          description: 'Vous n\'avez plus à comparer 15 enceintes, câbles et consoles. Nos packs sont pensés pour les configurations standard de chaque type d\'événement :',
          points: [
            'Conférence : priorité à l\'intelligibilité des voix',
            'Soirée : puissance + équilibre musical',
            'Mariage : polyvalence (discours + ambiance)'
          ],
          conclusion: 'Résultat : vous choisissez, et ça marche.'
        },
        {
          icon: Wrench,
          title: 'Une prestation vraiment clé en main',
          description: 'On ne dépose pas du matériel "au hasard". On installe, on paramètre, on teste, et on s\'assure que tout est prêt avant le début. Vous n\'avez pas à gérer la technique.'
        },
        {
          icon: Zap,
          title: 'Organisation + réactivité (même en urgence)',
          description: 'Un événement qui se décide vite ? Un planning serré ? On est structurés pour intervenir rapidement quand c\'est possible, avec un process clair et des créneaux optimisés.'
        },
        {
          icon: Shield,
          title: 'Un service clair, pro, sans surprises',
          description: 'Communication simple, timing respecté, matériel pro, et une exécution propre. L\'objectif : un événement fluide et un son sans mauvaises surprises.'
        }
      ]
    },
    en: {
      title: 'Who is SoundRush Paris?',
      description: 'SoundRush Paris is turnkey event sound systems in Paris and Île-de-France. Our mission is simple: provide you with clean, reliable sound ready on time, stress-free. Conference, party, wedding: you choose a pack based on your event and number of guests, and we handle the rest (delivery, installation, setup, on-site testing).',
      subtitle: 'What sets us apart',
      features: [
        {
          icon: Package,
          title: 'No-hassle packs',
          description: 'You no longer need to compare 15 speakers, cables and consoles. Our packs are designed for standard configurations for each event type:',
          points: [
            'Conference: priority on voice intelligibility',
            'Party: power + musical balance',
            'Wedding: versatility (speeches + atmosphere)'
          ],
          conclusion: 'Result: you choose, and it works.'
        },
        {
          icon: Wrench,
          title: 'Truly turnkey service',
          description: 'We don\'t just drop off equipment "randomly". We install, configure, test, and make sure everything is ready before the start. You don\'t have to manage the technical side.'
        },
        {
          icon: Zap,
          title: 'Organization + responsiveness (even in emergencies)',
          description: 'An event decided at the last minute? A tight schedule? We\'re structured to intervene quickly when possible, with a clear process and optimized time slots.'
        },
        {
          icon: Shield,
          title: 'Clear, professional service, no surprises',
          description: 'Simple communication, respected timing, professional equipment, and clean execution. The goal: a smooth event and sound without bad surprises.'
        }
      ]
    }
  };

  const currentTexts = texts[language];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-gray-50">
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

        {/* Subtitle */}
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-[#F2431E]">
            {currentTexts.subtitle}
          </h3>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {currentTexts.features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col h-full"
              >
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E]/10 rounded-xl flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-[#F2431E]" />
                  </div>
                  <h4 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight pt-1">
                    {feature.title}
                  </h4>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-4 leading-relaxed text-base">
                  {feature.description}
                </p>

                {/* Points (if available) */}
                {feature.points && (
                  <div className="mb-4 space-y-2">
                    {feature.points.map((point, pointIndex) => (
                      <div key={pointIndex} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-[#F2431E] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conclusion (if available) */}
                {feature.conclusion && (
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <p className="text-[#F2431E] font-semibold text-base">
                      {feature.conclusion}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

