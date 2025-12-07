'use client';

import Link from 'next/link';

interface SolutionsSectionProps {
  language: 'fr' | 'en';
  onReservePack?: (packId: number) => void;
}

export default function SolutionsSection({ language, onReservePack }: SolutionsSectionProps) {
  const texts = {
    fr: {
      title: 'Nos packs les plus populaires',
      subtitle: '',
      viewPack: 'Voir ce pack',
      requestQuote: 'Demander un devis',
      viewAllPacks: 'Voir tous les packs',
      findPackSection: {
        sectionTitle: 'TROUVER RAPIDEMENT LE BON PACK',
        title: 'Vous ne savez pas quoi réserver ?',
        description: 'Notre assistant snd rush vous aide à trouver le pack adapté à votre événement en répondant à quelques questions simples. En moins de 2 minutes, obtenez une recommandation personnalisée basée sur vos besoins.',
        cta: 'Trouver le bon pack'
      },
      catalogueSection: {
        sectionTitle: 'CATALOGUE MATÉRIEL',
        title: 'Location de matériel à l\'unité',
        subtitle: 'Pour DJ, musiciens, conférenciers et organisateurs.',
        categories: [
          { name: 'Enceintes', icon: '🔊' },
          { name: 'Consoles', icon: '🎛️' },
          { name: 'Micros filaires & sans fil', icon: '🎤' },
          { name: 'Caissons de basse', icon: '📻' },
          { name: 'Pieds & accessoires', icon: '🔧' }
        ],
        cta: 'Voir le catalogue'
      },
      packs: [
        {
          id: 1,
          name: 'Pack S Petit',
          price: '109€',
          capacity: 'Pour 30 à 70 personnes',
          includes: [
            '1 enceinte Mac Mah AS 115',
            '1 console de mixage',
            'Options : micros, câbles, installation, livraison'
          ],
          cta: 'Voir ce pack',
          ctaType: 'pack' as const
        },
        {
          id: 2,
          name: 'Pack M Confort',
          price: '129€',
          capacity: 'Pour 70 à 150 personnes',
          includes: [
            '2 enceintes Mac Mah AS 115',
            '1 console HPA Promix 8',
            'Options : micros, câbles, installation, livraison'
          ],
          cta: 'Voir ce pack',
          ctaType: 'pack' as const
        },
        {
          id: 3,
          name: 'Pack L Grand',
          price: '179€',
          capacity: 'Pour 150 à 250 personnes',
          includes: [
            '2 enceintes FBT X-Lite 115A',
            '1 caisson X-Sub 118SA',
            '1 console HPA Promix 16',
            'Options : micros, câbles, installation, livraison'
          ],
          cta: 'Voir ce pack',
          ctaType: 'pack' as const
        },
        {
          id: 5,
          name: 'Pack XL Maxi / Sur mesure',
          price: 'Sur mesure',
          capacity: 'Plus de 300 personnes',
          includes: [
            'Sonorisation pro',
            'Micros HF & instruments',
            'Technicien & régie',
            'Logistique complète'
          ],
          cta: 'Demander un devis',
          ctaType: 'quote' as const
        }
      ]
    },
    en: {
      title: 'Our most popular packs',
      subtitle: '',
      viewPack: 'View this pack',
      requestQuote: 'Request a quote',
      viewAllPacks: 'View all packs',
      findPackSection: {
        sectionTitle: 'QUICKLY FIND THE RIGHT PACK',
        title: 'Not sure what to book?',
        description: 'Our snd rush assistant helps you find the pack that fits your event by answering a few simple questions. In less than 2 minutes, get a personalized recommendation based on your needs.',
        cta: 'Find the right pack'
      },
      catalogueSection: {
        sectionTitle: 'EQUIPMENT CATALOG',
        title: 'Equipment rental by unit',
        subtitle: 'For DJs, musicians, speakers and organizers.',
        categories: [
          { name: 'Speakers', icon: '🔊' },
          { name: 'Consoles', icon: '🎛️' },
          { name: 'Wired & wireless mics', icon: '🎤' },
          { name: 'Subwoofers', icon: '📻' },
          { name: 'Stands & accessories', icon: '🔧' }
        ],
        cta: 'View catalog'
      },
      packs: [
        {
          id: 1,
          name: 'Pack S Small',
          price: '109€',
          capacity: 'For 30 to 70 people',
          includes: [
            '1 Mac Mah AS 115 speaker',
            '1 mixing console',
            'Options: mics, cables, installation, delivery'
          ],
          cta: 'View this pack',
          ctaType: 'pack' as const
        },
        {
          id: 2,
          name: 'Pack M Comfort',
          price: '129€',
          capacity: 'For 70 to 150 people',
          includes: [
            '2 Mac Mah AS 115 speakers',
            '1 HPA Promix 8 console',
            'Options: mics, cables, installation, delivery'
          ],
          cta: 'View this pack',
          ctaType: 'pack' as const
        },
        {
          id: 3,
          name: 'Pack L Large',
          price: '179€',
          capacity: 'For 150 to 250 people',
          includes: [
            '2 FBT X-Lite 115A speakers',
            '1 X-Sub 118SA subwoofer',
            '1 HPA Promix 16 console',
            'Options: mics, cables, installation, delivery'
          ],
          cta: 'View this pack',
          ctaType: 'pack' as const
        },
        {
          id: 5,
          name: 'Pack XL Maxi / Custom',
          price: 'On quote',
          capacity: 'More than 300 people',
          includes: [
            'Pro sound system',
            'Wireless mics & instruments',
            'Technician & control room',
            'Complete logistics'
          ],
          cta: 'Request a quote',
          ctaType: 'quote' as const
        }
      ]
    }
  };

  const currentTexts = texts[language];

  const handleViewPack = (packId: number) => {
    window.location.href = `/packs/${packId}`;
  };

  const handleRequestQuote = () => {
    window.location.href = '/devis';
  };

  return (
    <section id="solutions" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            {currentTexts.title}
          </h2>
          {currentTexts.subtitle && (
            <p className="text-xl text-gray-600">
              {currentTexts.subtitle}
            </p>
          )}
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {currentTexts.packs.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 flex flex-col h-full"
            >
              {/* Star Icon */}
              <div className="flex items-center mb-4">
                <span className="text-2xl">⭐</span>
                <h3 className="text-xl font-bold text-black ml-2">
                  {pack.name}
                </h3>
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-[#F2431E] mb-3">
                {pack.price}
              </div>

              {/* Capacity */}
              <p className="text-gray-600 mb-4 text-sm">
                {pack.capacity}
              </p>

              {/* Includes */}
              <div className="mb-6 flex-grow">
                <p className="text-sm font-semibold text-gray-700 mb-2">Inclut :</p>
                <ul className="space-y-1">
                  {pack.includes.map((item, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button */}
              {pack.ctaType === 'pack' ? (
                <button
                  onClick={() => handleViewPack(pack.id)}
                  className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors mt-auto"
                >
                  {pack.cta}
                </button>
              ) : (
                <button
                  onClick={handleRequestQuote}
                  className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors mt-auto"
                >
                  {pack.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* View All Packs Link */}
        <div className="text-center mb-16">
          <Link
            href="/packs"
            className="inline-block text-[#F2431E] font-semibold hover:text-[#E63A1A] transition-colors text-lg underline"
          >
            {currentTexts.viewAllPacks}
          </Link>
        </div>

        {/* Find Pack Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <p className="text-xs font-bold text-white/90 uppercase tracking-[0.2em] mb-6">
              {currentTexts.findPackSection.sectionTitle}
            </p>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {currentTexts.findPackSection.title}
            </h3>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed">
              {currentTexts.findPackSection.description}
            </p>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openAssistantModal'));
              }}
              className="inline-flex items-center gap-3 bg-white text-[#F2431E] px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              <span>🤖</span>
              {currentTexts.findPackSection.cta}
            </button>
          </div>
        </div>

        {/* Catalogue Matériel Section */}
        <div className="mt-20">
          <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-4 text-center">
            {currentTexts.catalogueSection.sectionTitle}
          </p>
          <h3 className="text-3xl md:text-4xl font-bold text-black mb-3 text-center">
            {currentTexts.catalogueSection.title}
          </h3>
          <p className="text-lg text-gray-600 mb-10 text-center">
            {currentTexts.catalogueSection.subtitle}
          </p>

          {/* Catégories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {currentTexts.catalogueSection.categories.map((category, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-[#F2431E] transition-all hover:shadow-lg text-center cursor-pointer transform hover:scale-105"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <p className="font-semibold text-gray-900 text-sm">{category.name}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/catalogue"
              className="inline-block bg-[#F2431E] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#E63A1A] transition-all transform hover:scale-105 shadow-lg"
            >
              {currentTexts.catalogueSection.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

