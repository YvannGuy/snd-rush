'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MapPin, Clock, Truck, Navigation } from 'lucide-react';

export default function ParisIleDeFrancePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const content = {
    fr: {
      title: 'Paris & Île-de-France',
      subtitle: 'Intervention rapide sur toute la région',
      description: 'SoundRush intervient rapidement dans toute la région parisienne et l\'Île-de-France pour vos événements urgents ou planifiés.',
      sections: [
        {
          icon: MapPin,
          title: 'Couverture complète',
          description: 'Nous couvrons Paris intra-muros, la petite couronne et la grande couronne pour vous servir au mieux.'
        },
        {
          icon: Clock,
          title: 'Intervention rapide',
          description: 'Notre équipe peut intervenir rapidement pour répondre à vos besoins urgents, même en dernière minute.'
        },
        {
          icon: Truck,
          title: 'Livraison incluse',
          description: 'La livraison est incluse dans nos tarifs pour Paris et l\'Île-de-France, avec des options selon votre zone.'
        },
        {
          icon: Navigation,
          title: 'Zones de livraison',
          description: 'Paris intra-muros, Petite Couronne (Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne) et Grande Couronne.'
        }
      ],
      cta: 'Réserver maintenant',
      ctaLink: '/reserver'
    },
    en: {
      title: 'Paris & Île-de-France',
      subtitle: 'Fast intervention throughout the region',
      description: 'SoundRush provides rapid service throughout Paris and the Île-de-France region for your urgent or planned events.',
      sections: [
        {
          icon: MapPin,
          title: 'Complete coverage',
          description: 'We cover inner Paris, the inner suburbs and the outer suburbs to serve you best.'
        },
        {
          icon: Clock,
          title: 'Fast intervention',
          description: 'Our team can intervene quickly to meet your urgent needs, even at the last minute.'
        },
        {
          icon: Truck,
          title: 'Delivery included',
          description: 'Delivery is included in our rates for Paris and Île-de-France, with options according to your zone.'
        },
        {
          icon: Navigation,
          title: 'Delivery zones',
          description: 'Inner Paris, Inner Suburbs (Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne) and Outer Suburbs.'
        }
      ],
      cta: 'Book now',
      ctaLink: '/reserver'
    }
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-white">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-[112px]">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#F2431E] to-[#E63A1A] text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {currentContent.title}
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-6">
              {currentContent.subtitle}
            </p>
            <p className="text-lg max-w-3xl mx-auto text-orange-50">
              {currentContent.description}
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentContent.sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-[#F2431E]/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[#F2431E]" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {section.title}
                        </h3>
                        <p className="text-gray-600">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <a
              href={currentContent.ctaLink}
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#E63A1A] transition-colors"
            >
              {currentContent.cta}
            </a>
          </div>
        </section>
      </main>
      <Footer language={language} />
    </div>
  );
}
