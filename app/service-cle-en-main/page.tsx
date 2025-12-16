'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Wrench, Package, Settings, CheckCircle } from 'lucide-react';

export default function ServiceCleEnMainPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const content = {
    fr: {
      title: 'Service clé en main',
      subtitle: 'Installation disponible',
      description: 'Un service complet de la livraison à l\'installation, pour que vous puissiez vous concentrer sur l\'essentiel : votre événement.',
      sections: [
        {
          icon: Package,
          title: 'Livraison disponible',
          description: 'Service de livraison disponible pour Paris et l\'Île-de-France, avec des tarifs adaptés selon votre zone.'
        },
        {
          icon: Wrench,
          title: 'Installation disponible',
          description: 'Nos techniciens peuvent installer et configurer votre matériel sur place pour un fonctionnement optimal.'
        },
        {
          icon: Settings,
          title: 'Configuration sur mesure',
          description: 'Nous adaptons l\'installation selon vos besoins spécifiques et les contraintes de votre lieu d\'événement.'
        },
        {
          icon: CheckCircle,
          title: 'Service complet',
          description: 'De la réservation à la récupération, nous gérons tout pour vous offrir une expérience sans stress.'
        }
      ],
      cta: 'Découvrir nos packs',
      ctaLink: '/packs'
    },
    en: {
      title: 'Turnkey service',
      subtitle: 'Installation available',
      description: 'A complete service from delivery to installation, so you can focus on what matters: your event.',
      sections: [
        {
          icon: Package,
          title: 'Delivery available',
          description: 'Delivery service available for Paris and Île-de-France, with rates adapted according to your zone.'
        },
        {
          icon: Wrench,
          title: 'Installation available',
          description: 'Our technicians can install and configure your equipment on site for optimal operation.'
        },
        {
          icon: Settings,
          title: 'Custom configuration',
          description: 'We adapt the installation according to your specific needs and the constraints of your event venue.'
        },
        {
          icon: CheckCircle,
          title: 'Complete service',
          description: 'From booking to pickup, we handle everything to give you a stress-free experience.'
        }
      ],
      cta: 'Discover our packs',
      ctaLink: '/packs'
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
            <Wrench className="w-16 h-16 mx-auto mb-6" />
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
