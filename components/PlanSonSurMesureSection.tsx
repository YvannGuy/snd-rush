'use client';

import Link from 'next/link';
import SectionChevron from './SectionChevron';

interface PlanSonSurMesureSectionProps {
  language: 'fr' | 'en';
}

const featureList = [
  {
    title: 'Mesure et diagnostic',
    description: 'On analyse votre site (capacité, obstacles, ambiance) pour vous proposer un plan précis.',
  },
  {
    title: 'Puissance ciblée',
    description: 'Chaque enceinte est positionnée pour couvrir le public sans surcharger la salle.',
  },
  {
    title: 'Installation clef en main',
    description: 'Livraison, câblage, réglages, tests : nous validons la maquette avant votre événement.',
  },
];

const caseStudies = [
  {
    title: 'Mariage rooftop Paris',
    summary: 'Plan de diffusion 360° avec monitoring en live pour la cérémonie, le cocktail et la soirée.',
  },
  {
    title: 'Conférence internationale',
    summary: 'Mixage speech + briefing micro wireless, plan de retours pour les intervenants.',
  },
  {
    title: 'Soirée club privée',
    summary: 'Calibration dynamique avec zones dansantes et corners VIP pour garder du relief.',
  },
];

export default function PlanSonSurMesureSection({ language }: PlanSonSurMesureSectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'PLAN SUR-MESURE',
      title: 'Plan son sur mesure',
      description:
        'On construit la maquette sonore adaptée à votre lieu, votre nombre dʼinvités et votre ambiance. Pas de “pack par défaut”, juste un plan technique créé pour vous.',
      cta: 'Consulter le plan son sur mesure',
      caseLabel: 'Exemples de plans',
    },
    en: {
      sectionTitle: 'TAILORED PLAN',
      title: 'Tailored sound plan',
      description:
        'We craft a bespoke sound plan for your space, guest count and atmosphere. No default pack—just a technical layout built for your event.',
      cta: 'Discover the tailored sound plan',
      caseLabel: 'Sample plans',
    },
  };

  const currentTexts = texts[language];

  return (
    <section id="plan-son-sur-mesure" className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.4em] text-center mb-4">
          {currentTexts.sectionTitle}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 mb-6">
              {currentTexts.title}
            </h2>
            <p className="text-lg text-gray-600 mb-8">{currentTexts.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {featureList.map((feature) => (
                <div key={feature.title} className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
                  <p className="text-sm text-gray-500 uppercase tracking-[0.3em] mb-2">+</p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
            <Link
              href="/plan-son-sur-mesure"
              className="inline-flex items-center justify-center gap-3 bg-[#F2431E] text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:bg-[#d6391a] transition-all duration-300"
            >
              {currentTexts.cta}
            </Link>
          </div>
          <div className="space-y-5">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-[0.4em]">
              {currentTexts.caseLabel}
            </div>
            <div className="space-y-4">
              {caseStudies.map((caseStudy) => (
                <div key={caseStudy.title} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{caseStudy.title}</h3>
                  <p className="text-sm text-gray-600">{caseStudy.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SectionChevron nextSectionId="promesse" />
    </section>
  );
}
