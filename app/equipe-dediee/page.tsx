'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Users, Clock, Headphones, Heart } from 'lucide-react';

export default function EquipeDedieePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const content = {
    fr: {
      title: 'Équipe dédiée',
      subtitle: 'Disponible 24h/24 - 7j/7',
      description: 'Une équipe de professionnels passionnés à votre service pour garantir le succès de vos événements.',
      sections: [
        {
          icon: Users,
          title: 'Équipe expérimentée',
          description: 'Nos techniciens sont des professionnels expérimentés dans le domaine de la sonorisation et de l\'événementiel.'
        },
        {
          icon: Clock,
          title: 'Disponibilité totale',
          description: 'Notre équipe est disponible 24h/24 et 7j/7 pour répondre à vos besoins, même en dehors des heures ouvrables.'
        },
        {
          icon: Headphones,
          title: 'Support client',
          description: 'Un accompagnement personnalisé avant, pendant et après votre événement pour une expérience sans stress.'
        },
        {
          icon: Heart,
          title: 'Passion et engagement',
          description: 'Nous sommes passionnés par ce que nous faisons et nous nous engageons à faire de votre événement un succès.'
        }
      ],
      cta: 'Nous contacter',
      ctaLink: 'tel:+33651084994',
      phone: '06 51 08 49 94'
    },
    en: {
      title: 'Dedicated team',
      subtitle: 'Available 24/7',
      description: 'A team of passionate professionals at your service to ensure the success of your events.',
      sections: [
        {
          icon: Users,
          title: 'Experienced team',
          description: 'Our technicians are experienced professionals in sound and event management.'
        },
        {
          icon: Clock,
          title: 'Total availability',
          description: 'Our team is available 24/7 to meet your needs, even outside business hours.'
        },
        {
          icon: Headphones,
          title: 'Customer support',
          description: 'Personalized support before, during and after your event for a stress-free experience.'
        },
        {
          icon: Heart,
          title: 'Passion and commitment',
          description: 'We are passionate about what we do and committed to making your event a success.'
        }
      ],
      cta: 'Contact us',
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
            <Users className="w-16 h-16 mx-auto mb-6" />
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
              {currentContent.cta} : {currentContent.phone}
            </a>
          </div>
        </section>
      </main>
      <Footer language={language} />
    </div>
  );
}
