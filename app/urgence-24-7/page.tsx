'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Zap, Clock, Phone, AlertCircle } from 'lucide-react';

export default function Urgence247Page() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const content = {
    fr: {
      title: 'Urgence 24/7',
      subtitle: 'Intervention en 30-60 minutes',
      description: 'Besoin d\'une sono en urgence ? SoundRush intervient 24h/24 et 7j/7 pour répondre à vos besoins urgents, même en dernière minute.',
      sections: [
        {
          icon: Clock,
          title: 'Réactivité maximale',
          description: 'Intervention en 30 à 60 minutes selon votre localisation dans Paris et l\'Île-de-France.'
        },
        {
          icon: Phone,
          title: 'Disponible 24/7',
          description: 'Notre équipe est disponible 24h/24 et 7j/7 pour répondre à vos urgences, même les week-ends et jours fériés.'
        },
        {
          icon: Zap,
          title: 'Service express',
          description: 'Matériel prêt à l\'emploi, livraison rapide et installation si nécessaire pour votre événement urgent.'
        },
        {
          icon: AlertCircle,
          title: 'Situations d\'urgence',
          description: 'Panne de matériel, événement imprévu, besoin de dernière minute ? Nous sommes là pour vous aider.'
        }
      ],
      cta: 'Appeler maintenant',
      ctaLink: 'tel:+33651084994',
      phone: '06 51 08 49 94'
    },
    en: {
      title: 'Emergency 24/7',
      subtitle: '30-60 minute response',
      description: 'Need sound equipment urgently? SoundRush provides 24/7 service to meet your urgent needs, even at the last minute.',
      sections: [
        {
          icon: Clock,
          title: 'Maximum responsiveness',
          description: 'Intervention in 30 to 60 minutes depending on your location in Paris and Île-de-France.'
        },
        {
          icon: Phone,
          title: 'Available 24/7',
          description: 'Our team is available 24/7 to respond to your emergencies, even on weekends and holidays.'
        },
        {
          icon: Zap,
          title: 'Express service',
          description: 'Ready-to-use equipment, fast delivery and installation if necessary for your urgent event.'
        },
        {
          icon: AlertCircle,
          title: 'Emergency situations',
          description: 'Equipment failure, unexpected event, last-minute need? We are here to help you.'
        }
      ],
      cta: 'Call now',
      ctaLink: 'tel:+33651084994',
      phone: '+33 6 51 08 49 94'
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
            <Zap className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {currentContent.title}
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-6">
              {currentContent.subtitle}
            </p>
            <p className="text-lg max-w-3xl mx-auto text-orange-50 mb-8">
              {currentContent.description}
            </p>
            <a
              href={currentContent.ctaLink}
              className="inline-block bg-white text-[#F2431E] px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors"
            >
              {currentContent.cta} : {currentContent.phone}
            </a>
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
      </main>
      <Footer language={language} />
    </div>
  );
}
