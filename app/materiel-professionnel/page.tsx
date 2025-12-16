'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Music, CheckCircle, Award, Shield } from 'lucide-react';

export default function MaterielProfessionnelPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const content = {
    fr: {
      title: 'Matériel professionnel',
      subtitle: 'Équipements haut de gamme pour vos événements',
      description: 'Chez SoundRush, nous mettons à votre disposition uniquement du matériel professionnel de dernière génération, testé et vérifié avant chaque location.',
      sections: [
        {
          icon: Award,
          title: 'Marques reconnues',
          description: 'Nous travaillons exclusivement avec des marques de référence : Pioneer, Mac Mah, FBT, Shure, HPA et bien d\'autres.'
        },
        {
          icon: Shield,
          title: 'Qualité garantie',
          description: 'Tous nos équipements sont testés et vérifiés avant chaque sortie pour garantir des performances optimales.'
        },
        {
          icon: CheckCircle,
          title: 'Maintenance régulière',
          description: 'Nos équipements bénéficient d\'un entretien régulier pour assurer leur fiabilité et leur longévité.'
        },
        {
          icon: Music,
          title: 'Technologie de pointe',
          description: 'Nous renouvelons régulièrement notre parc pour vous proposer les dernières innovations technologiques.'
        }
      ],
      cta: 'Découvrir notre catalogue',
      ctaLink: '/catalogue'
    },
    en: {
      title: 'Professional equipment',
      subtitle: 'High-end gear for your events',
      description: 'At SoundRush, we provide only professional, state-of-the-art equipment, tested and verified before each rental.',
      sections: [
        {
          icon: Award,
          title: 'Recognized brands',
          description: 'We work exclusively with leading brands: Pioneer, Mac Mah, FBT, Shure, HPA and many others.'
        },
        {
          icon: Shield,
          title: 'Guaranteed quality',
          description: 'All our equipment is tested and verified before each rental to ensure optimal performance.'
        },
        {
          icon: CheckCircle,
          title: 'Regular maintenance',
          description: 'Our equipment benefits from regular maintenance to ensure reliability and longevity.'
        },
        {
          icon: Music,
          title: 'Cutting-edge technology',
          description: 'We regularly renew our inventory to offer you the latest technological innovations.'
        }
      ],
      cta: 'Discover our catalog',
      ctaLink: '/catalogue'
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
            <Music className="w-16 h-16 mx-auto mb-6" />
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
