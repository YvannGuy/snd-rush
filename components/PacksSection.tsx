
'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Pack {
  id: number;
  name: string;
  tagline: string;
  description: string;
  priceParis: string;
  priceHorsParis: string;
  featured: boolean;
  image: string;
  features: string[];
  highlight: string;
  ideal: string;
  note: string;
}

interface PacksSectionProps {
  language: 'fr' | 'en';
}

export default function PacksSection({ language }: PacksSectionProps) {
  const [packsFromSupabase, setPacksFromSupabase] = useState<any[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);

  // Charger les packs depuis Supabase
  useEffect(() => {
    const loadPacks = async () => {
      if (!supabase) {
        setLoadingPacks(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('packs')
          .select('*')
          .order('prix_base_ttc', { ascending: true });

        if (error) throw error;
        setPacksFromSupabase(data || []);
      } catch (error) {
        console.error('Erreur chargement packs:', error);
      } finally {
        setLoadingPacks(false);
      }
    };

    loadPacks();
  }, []);

  const texts = {
    fr: {
      title: 'Des packs personnalisés pour',
      titleHighlight: 'tous vos événements',
      subtitle: 'Mariage, anniversaire, conférence, entreprise… choisissez la solution adaptée.',
      reserveNow: 'Réserver maintenant',
      requestQuote: 'Utiliser l\'assistant SoundRush Paris',
      keyInHand: 'Clé en main',
      parisPrice: 'Paris intra-muros',
      horsParisPrice: 'Hors Paris',
      transportFee: '+80 € transport',
      reassurance: '✅ Zéro caution sur les formules clé en main · ✅ Technicien qualifié · ✅ Matériel pro · ✅ Date bloquée avec 30 % d\'acompte'
    },
    en: {
      title: 'Personalized packs for',
      titleHighlight: 'all your events',
      subtitle: 'Wedding, birthday, conference, corporate… pick the right fit.',
      reserveNow: 'Book now',
      requestQuote: 'Request precise quote',
      keyInHand: 'Turnkey',
      parisPrice: 'Paris intra-muros',
      horsParisPrice: 'Outside Paris',
      transportFee: '+80 € transport',
      reassurance: '✅ Zero deposit on turnkey formulas · ✅ Qualified technician · ✅ Professional equipment · ✅ Date secured with 30% down payment'
    }
  };

  const packs: { fr: Pack[], en: Pack[] } = {
    fr: [
      {
        id: 2,
        name: "Pack M Confort",
        tagline: "Solution complète pour événements moyens",
        description: "Pack M pour événements moyens jusqu'à 150 personnes, avec 2 enceintes Mac Mah AS 115 et console HPA Promix 8.",
        priceParis: "129 € TTC",
        priceHorsParis: "129 € TTC",
        featured: true,
        image: "/packM.png",
        features: [
          "2 enceintes Mac Mah AS 115",
          "1 console HPA Promix 8",
          "Options : micros, câbles, installation, livraison"
        ],
        highlight: "Caution : 1100 €",
        ideal: "70 à 150 personnes",
        note: "Parfait pour conférences, fêtes, DJ sets."
      },
      {
        id: 3,
        name: "Pack L Grand",
        tagline: "Solution professionnelle pour grands événements",
        description: "Pack L idéal pour événements jusqu'à 250 personnes, avec 2 enceintes FBT X-Lite 115A, 1 caisson X-Sub 118SA et console HPA Promix 16.",
        priceParis: "179 € TTC",
        priceHorsParis: "179 € TTC",
        featured: false,
        image: "/packL.png",
        features: [
          "2 enceintes FBT X-Lite 115A",
          "1 caisson X-Sub 118SA",
          "1 console HPA Promix 16",
          "Options : micros, câbles, installation, livraison"
        ],
        highlight: "Caution : 1600 €",
        ideal: "150 à 250 personnes",
        note: "Idéal pour concerts, DJ sets, grandes conférences."
      },
      {
        id: 1,
        name: "Pack S Petit",
        tagline: "Solution basique pour petits événements",
        description: "Pack S parfait pour les petits événements jusqu'à 70 personnes, avec 1 enceinte Mac Mah AS 115 et console de mixage.",
        priceParis: "109 € TTC",
        priceHorsParis: "109 € TTC",
        featured: false,
        image: "/packs.png",
        features: [
          "1 enceinte Mac Mah AS 115",
          "1 console de mixage",
          "Options : micros, câbles, installation, livraison"
        ],
        highlight: "Caution : 700 €",
        ideal: "30 à 70 personnes",
        note: "Idéal pour conférences, mariages, DJ sets."
      }
    ],
    en: [
      {
        id: 2,
        name: "Pack M Comfort",
        tagline: "Complete solution for medium events",
        description: "Pack M for medium events up to 150 people, with 2 Mac Mah AS 115 speakers and HPA Promix 8 console.",
        priceParis: "129 € TTC",
        priceHorsParis: "129 € TTC",
        featured: true,
        image: "/packM.png",
        features: [
          "2 Mac Mah AS 115 speakers",
          "1 HPA Promix 8 console",
          "Options: mics, cables, installation, delivery"
        ],
        highlight: "Deposit: 1100 €",
        ideal: "70 to 150 people",
        note: "Perfect for conferences, parties, DJ sets."
      },
      {
        id: 3,
        name: "Pack L Large",
        tagline: "Professional solution for large events",
        description: "Pack L ideal for events up to 250 people, with 2 FBT X-Lite 115A speakers, 1 X-Sub 118SA subwoofer and HPA Promix 16 console.",
        priceParis: "179 € TTC",
        priceHorsParis: "179 € TTC",
        featured: false,
        image: "/packL.png",
        features: [
          "2 FBT X-Lite 115A speakers",
          "1 X-Sub 118SA subwoofer",
          "1 HPA Promix 16 console",
          "Options: mics, cables, installation, delivery"
        ],
        highlight: "Deposit: 1600 €",
        ideal: "150 to 250 people",
        note: "Ideal for concerts, DJ sets, large conferences."
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "Up to 500 people",
        description: "Maximum configuration with technical supervision during the event.",
        priceParis: "Sur devis",
        priceHorsParis: "Sur devis",
        featured: false,
        image: "/concert.jpg",
        features: [
          "Pro sound system",
          "HF mics & instruments",
          "Technician & control room",
          "Complete logistics"
        ],
        highlight: "Deposit: on quote",
        ideal: "More than 300 people",
        note: "Perfect for very large events, festivals, concerts, corporate events."
      },
      {
        id: 6,
        name: "Party",
        tagline: "Private parties & events",
        description: "Festive and energetic sound system for your parties and private events.",
        priceParis: "À partir de 450 € TTC",
        priceHorsParis: "530 € TTC",
        featured: false,
        image: "/packs.png",
        features: [
          "Festive and energetic sound system",
          "Ambient music and DJ",
          "Delivery & installation",
          "Technician during the party",
          "Dismantling after the event"
        ],
        highlight: "Turnkey",
        ideal: "Up to 200 people",
        note: "Perfect for private parties, birthdays, corporate events, festive occasions."
      }
    ]
  };

  const currentPacks = packs[language];
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (amount: number) => {
    if (listRef.current) {
      listRef.current.scrollBy({
        left: amount,
        behavior: 'smooth'
      });
    }
  };


  return (
    <section id="packs" className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white transition-all duration-1000 ease-in-out relative mx-4 mb-8 rounded-3xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 transform transition-all duration-1000 ease-in-out">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight mb-8 transition-all duration-1000 ease-in-out">
            {texts[language].title}
            <span className="text-[#F2431E]"> {texts[language].titleHighlight}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ease-in-out mb-8">
            {texts[language].subtitle}
          </p>

          {/* Bouton Réservez votre pack */}
          <div className="mt-8">
            <button
              onClick={() => {
                // Déclencher l'ouverture du modal assistant
                const event = new CustomEvent('openAssistantModal');
                window.dispatchEvent(event);
              }}
              className="bg-[#F2431E] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#E63A1A] transition-colors shadow-lg hover:shadow-xl"
            >
              <i className="ri-robot-line mr-2 text-xl"></i>
              Réservez votre pack
            </button>
          </div>

        </div>



        {/* Packs Carrousel avec flèches en haut */}
        <div className="relative">
          <style jsx>{`
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex items-center justify-end gap-3 mb-4">
          <button
              aria-label="Précédent"
              onClick={() => scrollByAmount(-320)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200"
          >
              <span className="text-xl leading-none">‹</span>
          </button>
              <button
              aria-label="Suivant"
              onClick={() => scrollByAmount(320)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200"
            >
              <span className="text-xl leading-none">›</span>
          </button>
        </div>

          <div ref={listRef} className="flex gap-6 sm:gap-8 lg:gap-12 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide" style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {(() => {
              // Mapping des images par ID de pack pour correspondre à la page pack
              const packImageMap: Record<number, string> = {
                1: '/packs.png',    // Pack S Petit
                2: '/packM.png',    // Pack M Confort
                3: '/packL.png',    // Pack L Grand
                5: '/concert.jpg',   // Pack Custom/XL Maxi
              };

              // Si on charge depuis Supabase et qu'on a des données, les utiliser
              if (!loadingPacks && packsFromSupabase.length > 0) {
                return packsFromSupabase
                  .filter((pack: any) => {
                    // Exclure le Pack Custom (id 4 ou 5, ou nom contenant "Custom")
                    const packName = (pack.nom_pack || '').toLowerCase();
                    return pack.id !== 4 && pack.id !== 5 && !packName.includes('custom');
                  })
                  .map((pack: any) => {
                  // Parser la composition si c'est une string JSON
                  let features: string[] = [];
                  if (pack.composition) {
                    try {
                      features = typeof pack.composition === 'string' 
                        ? JSON.parse(pack.composition) 
                        : pack.composition;
                    } catch (e) {
                      features = [];
                    }
                  }

                  return {
                    id: pack.id,
                    name: pack.nom_pack || 'Pack',
                    tagline: pack.description_courte || pack.nom_pack || '',
                    description: pack.description || pack.description_courte || '',
                    priceParis: pack.prix_base_ttc ? `${pack.prix_base_ttc} € TTC` : 'Sur devis',
                    priceHorsParis: pack.prix_base_ttc ? `${pack.prix_base_ttc} € TTC` : 'Sur devis',
                    featured: pack.featured || false,
                    image: packImageMap[pack.id] || pack.image_url || pack.image || '/conference.jpg',
                    features: features.length > 0 ? features : [pack.description_courte || ''],
                    highlight: pack.caution ? `Caution : ${pack.caution} €` : '',
                    ideal: pack.capacite || pack.ideal || '',
                    note: pack.note || ''
                  };
                });
              }
              // Sinon utiliser les packs par défaut (filtrer le Pack Custom)
              return currentPacks.filter((pack: Pack) => {
                const packName = pack.name.toLowerCase();
                return pack.id !== 4 && pack.id !== 5 && !packName.includes('custom');
              });
            })().map((pack) => (
                    <Link
                      key={pack.id}
                      href={`/packs/${pack.id}`}
                      className={`snap-start min-w-[280px] sm:min-w-[360px] lg:min-w-[400px] group transition-all duration-300 ease-out block`}
                    >
                      <div
                  className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out overflow-visible border h-full cursor-pointer ${
                          pack.featured
                            ? 'border-[#F2431E]/30 ring-2 ring-[#F2431E]/20'
                            : 'border-gray-100'
                        }`}
                      >

                        {/* Image */}
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <Image
                            src={pack.image}
                            alt={pack.name}
                            fill
                            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                            style={{
                              filter:
                                'grayscale(100%) contrast(110%) brightness(95%) sepia(10%) hue-rotate(345deg) saturate(130%)'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500 ease-in-out"></div>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6 lg:p-8 transform transition-all duration-500 ease-in-out">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3 relative">
                          <h3 className="text-xl sm:text-2xl font-bold text-black transition-all duration-300">
                                {pack.name}
                              </h3>
                        </div>
                        <p className="text-[#F2431E] font-medium text-sm sm:text-base transition-all duration-300">
                          {pack.tagline}
                        </p>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base transition-all duration-300">
                            {pack.description}
                          </p>

                          <div className="space-y-2 sm:space-y-3 mb-4">
                            {pack.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                                <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                                <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mb-6 sm:mb-8">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-center">
                        {pack.note}
                            </p>
                          </div>

                        </div>
                      </div>
                    </Link>
                  ))}

            {/* Carte supplémentaire: Anniversaire (même style que les autres) */}
            <div className="snap-start min-w-[280px] sm:min-w-[360px] lg:min-w-[400px] group transition-all duration-300 ease-out">
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out overflow-visible border h-full border-gray-100">

                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src="/anniversaire.jpg"
                    alt={language === 'fr' ? 'Anniversaire' : 'Birthday'}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    style={{
                      filter: 'grayscale(100%) contrast(110%) brightness(95%) sepia(10%) hue-rotate(345deg) saturate(130%)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500 ease-in-out"></div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 lg:p-8 transform transition-all duration-500 ease-in-out">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3 relative">
                        <h3 className="text-xl sm:text-2xl font-bold text-black transition-all duration-300">
                          {language === 'fr' ? 'Anniversaire' : 'Birthday'}
                        </h3>
                      </div>
                      <p className="text-[#F2431E] font-medium text-sm sm:text-base transition-all duration-300">
                        {language === 'fr' ? 'Fête & célébrations' : 'Party & celebrations'}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base transition-all duration-300">
                    {language === 'fr' ? 'Sonorisation festive pour vos anniversaires et célébrations privées.' : 'Festive sound system for your birthdays and private celebrations.'}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Sonorisation festive et conviviale' : 'Festive and friendly sound'}</span>
                    </div>
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Micros pour discours & toasts' : 'Micros for speeches & toasts'}</span>
                    </div>
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Livraison & installation' : 'Delivery & installation'}</span>
                    </div>
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Technicien discret pendant l\'événement' : 'Discrete technician during event'}</span>
                    </div>
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Démontage après la fête' : 'Dismantling after party'}</span>
                    </div>
                  </div>

                  {/* Note bas de carte */}
                  <div className="mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-center">
                      {language === 'fr' ? 'Parfait pour anniversaires, fêtes privées, célébrations.' : 'Perfect for birthdays, private parties, celebrations.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Encart de réassurance */}
        <div className="mt-16 bg-gradient-to-r from-[#F2431E]/10 to-[#F2431E]/5 rounded-2xl p-8 border border-[#F2431E]/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-black mb-6">Pourquoi nous choisir ?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-sound-module-line text-white text-2xl"></i>
                </div>
                <h4 className="font-semibold text-black mb-2">Matériel professionnel</h4>
                <p className="text-sm text-gray-600">Enceintes, micros, consoles haut de gamme</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-user-settings-line text-white text-2xl"></i>
                </div>
                <h4 className="font-semibold text-black mb-2">Techniciens qualifiés</h4>
                <p className="text-sm text-gray-600">Installation et réglages sur place</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-map-pin-line text-white text-2xl"></i>
                </div>
                <h4 className="font-semibold text-black mb-2">Couverture Paris & Île-de-France</h4>
                <p className="text-sm text-gray-600">+80 € hors Paris intra-muros</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-time-line text-white text-2xl"></i>
                </div>
                <h4 className="font-semibold text-black mb-2">Réservation rapide</h4>
                <p className="text-sm text-gray-600">Acompte 30 % en ligne, solde à J-3</p>
              </div>
            </div>
            <div className="mt-8 p-4 bg-white rounded-xl border border-[#F2431E]/20">
              <p className="text-sm text-gray-700 font-medium">
                {texts[language].reassurance}
              </p>
            </div>
          </div>

        </div>


      </div>
    </section>
  );
}
