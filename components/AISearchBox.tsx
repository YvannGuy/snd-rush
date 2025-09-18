'use client';

import { useState } from 'react';

interface PackMatch {
  id: number;
  name: string;
  confidence: number;
  reason: string;
}

interface AISearchBoxProps {
  language: 'fr' | 'en';
  onPackSelected: (packId: number) => void;
}

export default function AISearchBox({ language, onPackSelected }: AISearchBoxProps) {
  const [query, setQuery] = useState('');
  const [suggestion, setSuggestion] = useState<PackMatch | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const texts = {
    fr: {
      placeholder: 'Décrivez votre événement (ex: "mariage 150 personnes")',
      analyzing: 'Analyse en cours...',
      suggestion: 'Nous recommandons :',
      selectPack: 'Choisir ce pack',
      tryAgain: 'Essayez une autre description'
    },
    en: {
      placeholder: 'Describe your event (ex: "wedding 150 people")',
      analyzing: 'Analyzing...',
      suggestion: 'We recommend:',
      selectPack: 'Choose this pack',
      tryAgain: 'Try another description'
    }
  };

  // Logique IA simplifiée et précise basée sur les nombres
  const analyzeQuery = (query: string): PackMatch => {
    const lowerQuery = query.toLowerCase();

    // Extraire les nombres de la requête
    const numbers = lowerQuery.match(/\d+/g);
    let bestMatch: PackMatch = { id: 1, name: 'Pack Starter', confidence: 0, reason: '' };

    if (numbers && numbers.length > 0) {
      const num = parseInt(numbers[0]);
      
      // Logique basée uniquement sur le nombre de personnes
      if (num >= 50 && num <= 80) {
        bestMatch = {
          id: 1,
          name: 'Pack Starter',
          confidence: 95,
          reason: `Événement de ${num} personnes - Pack Starter recommandé`
        };
      } else if (num >= 100 && num <= 180) {
        bestMatch = {
          id: 2,
          name: 'Pack Standard',
          confidence: 95,
          reason: `Événement de ${num} personnes - Pack Standard recommandé`
        };
      } else if (num >= 200 && num <= 250) {
        bestMatch = {
          id: 3,
          name: 'Pack Premium',
          confidence: 95,
          reason: `Événement de ${num} personnes - Pack Premium recommandé`
        };
      } else if (num > 250) {
        bestMatch = {
          id: 4,
          name: 'Pack Prestige',
          confidence: 95,
          reason: `Événement de ${num} personnes - Pack Prestige recommandé`
        };
      } else if (num < 50) {
        // Pour moins de 50 personnes, on recommande le Pack Starter
        bestMatch = {
          id: 1,
          name: 'Pack Starter',
          confidence: 85,
          reason: `Événement de ${num} personnes - Pack Starter adapté`
        };
      } else if (num > 400) {
        // Pour plus de 400 personnes, on recommande le Pack Prestige
        bestMatch = {
          id: 4,
          name: 'Pack Prestige',
          confidence: 85,
          reason: `Événement de ${num} personnes - Pack Prestige recommandé`
        };
      } else {
        // Cas limites - choisir le pack le plus proche
        if (num >= 80 && num < 100) {
          bestMatch = {
            id: 1,
            name: 'Pack Starter',
            confidence: 80,
            reason: `Événement de ${num} personnes - Pack Starter (limite haute)`
          };
        } else if (num >= 180 && num < 200) {
          bestMatch = {
            id: 2,
            name: 'Pack Standard',
            confidence: 80,
            reason: `Événement de ${num} personnes - Pack Standard (limite haute)`
          };
        } else if (num >= 250 && num < 300) {
          bestMatch = {
            id: 4,
            name: 'Pack Prestige',
            confidence: 80,
            reason: `Événement de ${num} personnes - Pack Prestige recommandé`
          };
        }
      }
    } else {
      // Si pas de nombre, analyser les mots-clés simples
      if (lowerQuery.includes('petit') || lowerQuery.includes('small') || lowerQuery.includes('intime') || lowerQuery.includes('famille')) {
        bestMatch = {
          id: 1,
          name: 'Pack Starter',
          confidence: 70,
          reason: 'Événement petit/intime détecté - Pack Starter recommandé'
        };
      } else if (lowerQuery.includes('mariage') || lowerQuery.includes('wedding') || lowerQuery.includes('standard')) {
        bestMatch = {
          id: 2,
          name: 'Pack Standard',
          confidence: 70,
          reason: 'Mariage/événement standard détecté - Pack Standard recommandé'
        };
      } else if (lowerQuery.includes('grand') || lowerQuery.includes('large') || lowerQuery.includes('premium')) {
        bestMatch = {
          id: 3,
          name: 'Pack Premium',
          confidence: 70,
          reason: 'Grand événement détecté - Pack Premium recommandé'
        };
      } else if (lowerQuery.includes('prestige') || lowerQuery.includes('luxe') || lowerQuery.includes('exceptionnel')) {
        bestMatch = {
          id: 4,
          name: 'Pack Prestige',
          confidence: 70,
          reason: 'Événement prestigieux détecté - Pack Prestige recommandé'
        };
      }
    }

    return bestMatch;
  };

  const getPackName = (packId: number): string => {
    const packNames = {
      1: 'Pack Starter',
      2: 'Pack Standard', 
      3: 'Pack Premium',
      4: 'Pack Prestige'
    };
    return packNames[packId as keyof typeof packNames] || 'Pack inconnu';
  };

  const getPackDetails = (packId: number): { image: string; price: string; description: string } => {
    const packDetails = {
      1: { // Pack Starter
        image: '/enceintebt.jpg',
        price: '109€',
        description: language === 'fr' 
          ? 'Pack starter idéal pour événements jusqu\'à 80 personnes avec équipement de base.'
          : 'Starter pack ideal for events up to 80 people with basic equipment.'
      },
      2: { // Pack STANDARD - Sono
        image: '/pack2cc.jpg',
        price: '139€',
        description: language === 'fr'
          ? 'Pack standard parfait pour événements de 100 à 180 personnes avec sonorisation professionnelle.'
          : 'Standard pack perfect for events of 100 to 180 people with professional sound.'
      },
      3: { // Pack PREMIUM - Sono
        image: '/pack2cc.jpg',
        price: '199€',
        description: language === 'fr'
          ? 'Pack premium avec équipement haut de gamme pour événements de 200 à 250 personnes.'
          : 'Premium pack with high-end equipment for events of 200 to 250 people.'
      },
      4: { // Pack PRESTIGE - Sono
        image: '/pack4cc.jpg',
        price: '299€',
        description: language === 'fr'
          ? 'Pack prestige avec matériel d\'exception pour événements de plus de 250 personnes.'
          : 'Prestige pack with exceptional equipment for events of more than 250 people.'
      }
    };
    return packDetails[packId as keyof typeof packDetails] || {
      image: '/pack2c.jpg',
      price: 'N/A',
      description: language === 'fr' ? 'Pack non trouvé' : 'Pack not found'
    };
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsAnalyzing(true);
    
    // Simuler un délai d'analyse
    setTimeout(() => {
      const result = analyzeQuery(query);
      setSuggestion(result);
      setIsAnalyzing(false);
    }, 1000);
  };

  const handlePackSelect = (packId: number) => {
    onPackSelected(packId);
    setQuery('');
    setSuggestion(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F2431E] to-orange-500"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#F2431E] to-orange-500 rounded-2xl mb-4 shadow-lg">
              <i className="ri-robot-line text-2xl text-white"></i>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-black mb-3">
              Recherche IA Intelligente
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Décrivez votre événement et notre IA vous recommandera le pack sonorisation parfait
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={texts[language].placeholder}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#F2431E]/20 focus:border-[#F2431E] transition-all duration-300 bg-white/80 backdrop-blur-sm"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <i className="ri-search-line text-xl text-gray-400"></i>
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={isAnalyzing || !query.trim()}
                className="px-8 py-4 bg-gradient-to-r from-[#F2431E] to-orange-500 text-white rounded-2xl font-bold text-lg hover:from-[#E63A1A] hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {texts[language].analyzing}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <i className="ri-magic-line"></i>
                    Analyser
                  </div>
                )}
              </button>
            </div>

            {suggestion && (
              <div className="mt-8 animate-fade-in">
                <div className="bg-gradient-to-r from-[#F2431E]/10 via-orange-50 to-yellow-50 rounded-3xl p-6 border-2 border-[#F2431E]/20 shadow-xl">
                  <div className="flex flex-col lg:flex-row items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <img
                          src={getPackDetails(suggestion.id).image}
                          alt={suggestion.name}
                          className="w-24 h-24 object-cover rounded-2xl shadow-lg"
                        />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#F2431E] rounded-full flex items-center justify-center">
                          <i className="ri-check-line text-white text-sm"></i>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-2xl font-bold text-black">
                          {texts[language].suggestion}
                        </h4>
                        <span className="px-4 py-2 bg-[#F2431E] text-white rounded-full text-sm font-bold">
                          {suggestion.name}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3 font-medium">
                        {suggestion.reason}
                      </p>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {getPackDetails(suggestion.id).description}
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-[#F2431E]">
                            {getPackDetails(suggestion.id).price}
                          </span>
                          <span className="text-sm text-gray-500">/jour</span>
                        </div>
                        <button
                          onClick={() => handlePackSelect(suggestion.id)}
                          className="px-6 py-3 bg-gradient-to-r from-[#F2431E] to-orange-500 text-white rounded-xl font-bold hover:from-[#E63A1A] hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                        >
                          <i className="ri-calendar-line"></i>
                          {texts[language].selectPack}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {query && !suggestion && !isAnalyzing && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <i className="ri-lightbulb-line"></i>
                  <p className="text-sm">
                    {texts[language].tryAgain}
                  </p>
                </div>
              </div>
            )}

            {/* Exemples de requêtes */}
            {!query && !suggestion && (
              <div className="mt-8">
                <p className="text-center text-gray-500 text-sm mb-4">Exemples de requêtes :</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    "Mariage 150 personnes",
                    "Anniversaire 60 invités", 
                    "Événement 250 personnes",
                    "Gala 350 invités"
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(example)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors duration-200"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}