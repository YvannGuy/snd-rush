'use client';

import Link from 'next/link';
import SectionChevron from './SectionChevron';
import { Clock, Calendar, Phone, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface UrgencySectionProps {
  language: 'fr' | 'en';
}

export default function UrgencySection({ language }: UrgencySectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'URGENCE',
      title: 'Besoin d\'une sono maintenant ?',
      subtitle: 'Les magasins ferment à 19h. Le weekend, aucun magasin de location n\'est ouvert.',
      subtitleHighlight: 'Pas de panique, nous sommes là.',
      description: 'SoundRush Paris est disponible 24h/24 et 7j/7 pour répondre à vos besoins urgents de sonorisation.',
      problem: {
        title: 'Le problème',
        items: [
          { icon: XCircle, text: 'Magasins fermés après 19h' },
          { icon: XCircle, text: 'Aucun magasin ouvert le weekend' },
          { icon: XCircle, text: 'Délais d\'attente trop longs' },
          { icon: XCircle, text: 'Pas de service d\'urgence' }
        ]
      },
      solution: {
        title: 'Notre solution',
        items: [
          { icon: CheckCircle2, text: 'Disponible 24h/24 et 7j/7' },
          { icon: CheckCircle2, text: 'Intervention rapide' },
          { icon: CheckCircle2, text: 'Livraison express' },
          { icon: CheckCircle2, text: 'Service d\'urgence dédié' }
        ]
      },
      cta: 'Appeler maintenant',
      ctaSecondary: 'Voir les packs'
    },
    en: {
      sectionTitle: 'URGENCY',
      title: 'Need sound equipment now?',
      subtitle: 'Stores close at 7pm. On weekends, no rental stores are open.',
      subtitleHighlight: 'Don\'t panic, we\'re here.',
      description: 'SoundRush Paris is available 24/7 to meet your urgent sound system needs.',
      problem: {
        title: 'The problem',
        items: [
          { icon: XCircle, text: 'Stores closed after 7pm' },
          { icon: XCircle, text: 'No stores open on weekends' },
          { icon: XCircle, text: 'Waiting times too long' },
          { icon: XCircle, text: 'No emergency service' }
        ]
      },
      solution: {
        title: 'Our solution',
        items: [
          { icon: CheckCircle2, text: 'Available 24/7' },
          { icon: CheckCircle2, text: 'Rapid intervention' },
          { icon: CheckCircle2, text: 'Express delivery' },
          { icon: CheckCircle2, text: 'Dedicated emergency service' }
        ]
      },
      cta: 'Call now',
      ctaSecondary: 'View packs'
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="urgency" className="py-16 lg:py-28 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#F2431E] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F2431E] rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-4">
          <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-6">
            {currentTexts.sectionTitle}
          </p>
        </div>

        {/* Main Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {currentTexts.title}
          </h2>
          <div className="max-w-4xl mx-auto space-y-4">
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              {currentTexts.subtitle}
            </p>
            <p className="text-2xl md:text-3xl font-bold text-[#F2431E]">
              {currentTexts.subtitleHighlight}
            </p>
            <p className="text-lg md:text-xl text-gray-600 mt-6">
              {currentTexts.description}
            </p>
          </div>
        </div>

        {/* Problem vs Solution Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Problem Column */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {currentTexts.problem.title}
              </h3>
            </div>
            <ul className="space-y-4">
              {currentTexts.problem.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index} className="flex items-start gap-3">
                    <Icon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700 text-lg">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Solution Column */}
          <div className="bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-2xl p-8 shadow-xl text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {currentTexts.solution.title}
              </h3>
            </div>
            <ul className="space-y-4">
              {currentTexts.solution.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index} className="flex items-start gap-3">
                    <Icon className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                    <span className="text-white text-lg font-medium">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 rounded-2xl p-8 lg:p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Clock className="w-8 h-8 text-[#F2431E]" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {language === 'fr' ? 'Disponible maintenant' : 'Available now'}
              </h3>
            </div>
            <p className="text-lg text-gray-300 mb-8">
              {language === 'fr' 
                ? 'Appelez-nous, nous intervenons rapidement pour votre événement'
                : 'Call us, we respond quickly for your event'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:+33744782754"
                className="inline-flex items-center gap-2 bg-[#F2431E] hover:bg-[#E63A1A] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Phone className="w-5 h-5" />
                {currentTexts.cta}
              </a>
              <Link
                href="#solutions"
                onClick={(e) => {
                  e.preventDefault();
                  const solutionsSection = document.getElementById('solutions');
                  if (solutionsSection) {
                    solutionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl"
              >
                <Calendar className="w-5 h-5" />
                {currentTexts.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <SectionChevron nextSectionId="comment-ca-marche" />
    </section>
  );
}
