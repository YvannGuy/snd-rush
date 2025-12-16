'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Pack {
  id: string | number;
  name: string;
  description: string;
  price: string;
  image: string;
  capacity?: string;
  featured?: boolean;
}

interface RecommendedPacksProps {
  language: 'fr' | 'en';
  packs: Pack[];
  loading?: boolean;
}

export default function RecommendedPacks({ language, packs, loading }: RecommendedPacksProps) {
  const texts = {
    fr: {
      title: 'Packs recommandés',
      subtitle: 'Choisissez le pack adapté à la taille de votre événement',
      viewPack: 'Voir le pack',
      requestQuote: 'Utiliser l\'assistant SoundRush Paris',
    },
    en: {
      title: 'Recommended packs',
      subtitle: 'Choose the pack adapted to the size of your event',
      viewPack: 'View pack',
      requestQuote: 'Use SoundRush Paris Assistant',
    },
  };

  const currentTexts = texts[language];

  // Filtrer uniquement les packs (category === 'packs')
  const filteredPacks = packs.filter(pack => 
    typeof pack.id === 'string' ? pack.id.startsWith('pack-') : false
  );

  if (loading) {
    return (
      <section className="bg-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
            <p className="text-gray-600 mt-4">
              {language === 'fr' ? 'Chargement des packs...' : 'Loading packs...'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (filteredPacks.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3">
            {currentTexts.title}
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            {currentTexts.subtitle}
          </p>
        </div>

        {/* Packs Grid - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6">
          {filteredPacks.map((pack) => {
            const isCustomPack = pack.price.toLowerCase().includes('devis') || 
                                 pack.price.toLowerCase().includes('quote') ||
                                 pack.name.toLowerCase().includes('custom') ||
                                 pack.name.toLowerCase().includes('sur mesure');
            
            return (
              <div
                key={pack.id}
                className={`bg-white rounded-xl border-2 overflow-hidden flex flex-col h-full transition-all hover:shadow-lg ${
                  pack.featured 
                    ? 'border-[#F2431E] shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Pack Image */}
                <div className="relative h-48 bg-gray-200 flex-shrink-0">
                  <Image
                    src={pack.image}
                    alt={pack.name}
                    fill
                    className="object-cover"
                  />
                  {/* Featured Badge */}
                  {pack.featured && (
                    <div className="absolute top-3 left-3 bg-[#F2431E] text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {language === 'fr' ? 'Populaire' : 'Popular'}
                    </div>
                  )}
                </div>

                {/* Pack Info */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-black mb-2">
                    {pack.name}
                  </h3>
                  
                  <div className="text-3xl font-bold text-[#F2431E] mb-3">
                    {pack.price}
                  </div>

                  {pack.capacity && (
                    <p className="text-gray-600 mb-4 text-sm">
                      {pack.capacity}
                    </p>
                  )}

                  <p className="text-gray-600 text-sm mb-6 flex-grow line-clamp-3">
                    {pack.description}
                  </p>

                  {/* CTA Button */}
                  {isCustomPack ? (
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
                      }}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-center mt-auto ${
                        pack.featured
                          ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                          : 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                      }`}
                    >
                      {currentTexts.requestQuote}
                    </button>
                  ) : (
                    <Link
                      href={`/packs/${pack.id.toString().replace('pack-', '')}`}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-center mt-auto ${
                        pack.featured
                          ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                          : 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                      }`}
                    >
                      {currentTexts.viewPack}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Packs Horizontal Scroll - Mobile */}
        <div className="lg:hidden overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex gap-6 min-w-max px-4">
            {filteredPacks.map((pack) => {
              const isCustomPack = pack.price.toLowerCase().includes('devis') || 
                                   pack.price.toLowerCase().includes('quote') ||
                                   pack.name.toLowerCase().includes('custom') ||
                                   pack.name.toLowerCase().includes('sur mesure');
              
              return (
                <div
                  key={pack.id}
                  className={`bg-white rounded-xl border-2 overflow-hidden flex flex-col w-[300px] h-full transition-all ${
                    pack.featured 
                      ? 'border-[#F2431E] shadow-md' 
                      : 'border-gray-200'
                  }`}
                >
                  {/* Pack Image */}
                  <div className="relative h-48 bg-gray-200 flex-shrink-0">
                    <Image
                      src={pack.image}
                      alt={pack.name}
                      fill
                      className="object-cover"
                    />
                    {/* Featured Badge */}
                    {pack.featured && (
                      <div className="absolute top-3 left-3 bg-[#F2431E] text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {language === 'fr' ? 'Populaire' : 'Popular'}
                      </div>
                    )}
                  </div>

                  {/* Pack Info */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-black mb-2">
                      {pack.name}
                    </h3>
                    
                    <div className="text-3xl font-bold text-[#F2431E] mb-3">
                      {pack.price}
                    </div>

                    {pack.capacity && (
                      <p className="text-gray-600 mb-4 text-sm">
                        {pack.capacity}
                      </p>
                    )}

                    <p className="text-gray-600 text-sm mb-6 flex-grow line-clamp-3">
                      {pack.description}
                    </p>

                    {/* CTA Button */}
                    {isCustomPack ? (
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
                        }}
                        className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors text-center mt-auto"
                      >
                        {currentTexts.requestQuote}
                      </button>
                    ) : (
                      <Link
                        href={`/packs/${pack.id.toString().replace('pack-', '')}`}
                        className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors text-center mt-auto"
                      >
                        {currentTexts.viewPack}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
