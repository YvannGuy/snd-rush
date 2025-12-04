'use client';

import { useState } from 'react';

interface CatalogueContentProps {
  language: 'fr' | 'en';
}

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  image: string;
  capacity?: string;
  usageType?: string;
}

export default function CatalogueContent({ language }: CatalogueContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUsageType, setSelectedUsageType] = useState<string>('all');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');

  const texts = {
    fr: {
      title: 'Catalogue de matériel professionnel',
      subtitle: 'Sonorisation, DJ, micros, lumières, packs clé-en-main. Livraison, installation et urgence 24/7 disponibles.',
      searchPlaceholder: 'Rechercher un produit...',
      categories: {
        all: 'Tous',
        sonorisation: 'Sonorisation',
        dj: 'DJ',
        micros: 'Micros',
        lumieres: 'Lumières',
        packs: 'Packs',
        accessoires: 'Accessoires'
      },
      filters: {
        usageType: 'Type d\'usage',
        capacity: 'Capacité',
        priceRange: 'Tarifs par jour'
      },
      helpButton: 'Je ne sais pas quoi choisir → Guide rapide',
      addToQuote: 'Obtenir un devis',
      needHelp: {
        title: 'Besoin d\'aide pour choisir ?',
        description: 'Vous ne savez pas quel matériel choisir ? Décrivez votre événement et nous trouvons la meilleure configuration en 2 minutes.',
        cta: 'Trouver mon pack idéal'
      },
      urgency: {
        title: 'Besoin d\'un système son maintenant ?',
        intervention: 'Intervention en 2h en Île-de-France',
        delivery: 'Livraison + installation',
        cta: 'Appeler maintenant'
      },
      ready: {
        title: 'Prêt à louer votre matériel ?',
        quickQuote: 'Obtenir un devis rapide',
        expert: 'Parler à un expert'
      }
    },
    en: {
      title: 'Professional Equipment Catalog',
      subtitle: 'Sound, DJ, microphones, lights, turnkey packs. Delivery, installation and 24/7 emergency available.',
      searchPlaceholder: 'Search for a product...',
      categories: {
        all: 'All',
        sonorisation: 'Sound',
        dj: 'DJ',
        micros: 'Microphones',
        lumieres: 'Lights',
        packs: 'Packs',
        accessoires: 'Accessories'
      },
      filters: {
        usageType: 'Type of use',
        capacity: 'Capacity',
        priceRange: 'Daily rates'
      },
      helpButton: 'I don\'t know what to choose → Quick guide',
      addToQuote: 'Get a quote',
      needHelp: {
        title: 'Need help choosing?',
        description: 'Don\'t know what equipment to choose? Describe your event and we\'ll find the best configuration in 2 minutes.',
        cta: 'Find my ideal pack'
      },
      urgency: {
        title: 'Need a sound system now?',
        intervention: 'Intervention in 2h in Île-de-France',
        delivery: 'Delivery + installation',
        cta: 'Call now'
      },
      ready: {
        title: 'Ready to rent your equipment?',
        quickQuote: 'Get a quick quote',
        expert: 'Talk to an expert'
      }
    }
  };

  const currentTexts = texts[language];

  const products: Product[] = [
    {
      id: 1,
      name: 'Enceinte active 15"',
      category: 'sonorisation',
      description: '100-300 pers.',
      price: '85€/jour',
      image: '/enceintebt.jpg',
      capacity: '100-300',
      usageType: 'event'
    },
    {
      id: 2,
      name: 'Pioneer XDJ-RX3',
      category: 'dj',
      description: 'Contrôleur DJ pro',
      price: '120€/jour',
      image: '/platinedj.jpg',
      usageType: 'dj'
    },
    {
      id: 3,
      name: 'Shure SM58',
      category: 'micros',
      description: 'Micro dynamique',
      price: '25€/jour',
      image: '/microshure.png',
      usageType: 'event'
    },
    {
      id: 4,
      name: 'Lyre LED',
      category: 'lumieres',
      description: 'Éclairage dynamique',
      price: '45€/jour',
      image: '/lyreled.png',
      usageType: 'event'
    },
    {
      id: 5,
      name: 'Pack Mariage',
      category: 'packs',
      description: '2 enceintes + micro + table, 50-150 pers.',
      price: '180€/jour',
      image: '/mariage.jpg',
      capacity: '50-150',
      usageType: 'event'
    },
    {
      id: 6,
      name: 'Caisson de basse 18"',
      category: 'sonorisation',
      description: '150-500 pers',
      price: '95€/jour',
      image: '/caissonbasse.png',
      capacity: '150-500',
      usageType: 'event'
    },
    {
      id: 7,
      name: 'Micro serre-tête',
      category: 'micros',
      description: 'Sans fil HF',
      price: '35€/jour',
      image: '/microshure2.png',
      usageType: 'event'
    },
    {
      id: 8,
      name: 'Barre LED',
      category: 'lumieres',
      description: 'Éclairage d\'ambiance',
      price: '30€/jour',
      image: '/setled.png',
      usageType: 'event'
    }
  ];

  const categoryColors: Record<string, string> = {
    sonorisation: 'bg-[#F2431E]',
    dj: 'bg-blue-500',
    micros: 'bg-green-500',
    lumieres: 'bg-purple-500',
    packs: 'bg-pink-500',
    accessoires: 'bg-gray-500'
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesUsageType = selectedUsageType === 'all' || product.usageType === selectedUsageType;
    const matchesCapacity = selectedCapacity === 'all' || product.capacity === selectedCapacity;
    
    // Price range filter logic
    let matchesPrice = true;
    if (selectedPriceRange !== 'all') {
      const priceNum = parseInt(product.price);
      switch (selectedPriceRange) {
        case '0-50':
          matchesPrice = priceNum <= 50;
          break;
        case '50-100':
          matchesPrice = priceNum > 50 && priceNum <= 100;
          break;
        case '100+':
          matchesPrice = priceNum > 100;
          break;
      }
    }

    return matchesSearch && matchesCategory && matchesUsageType && matchesCapacity && matchesPrice;
  });

  const handleAddToQuote = (productId: number) => {
    // Rediriger vers la page de devis
    window.location.href = '/devis';
  };

  const scrollToHelp = () => {
    const element = document.getElementById('help-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="pt-16">
      {/* Header Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
              {currentTexts.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentTexts.subtitle}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentTexts.searchPlaceholder}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none text-lg"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {Object.entries(currentTexts.categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key === 'all' ? 'all' : key)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedCategory === key || (key === 'all' && selectedCategory === 'all')
                    ? 'bg-[#F2431E] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
            <select
              value={selectedUsageType}
              onChange={(e) => setSelectedUsageType(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
            >
              <option value="all">{currentTexts.filters.usageType}</option>
              <option value="event">Événement</option>
              <option value="dj">DJ</option>
            </select>

            <select
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
            >
              <option value="all">{currentTexts.filters.capacity}</option>
              <option value="50-150">50-150 personnes</option>
              <option value="100-300">100-300 personnes</option>
              <option value="150-500">150-500 personnes</option>
            </select>

            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
            >
              <option value="all">{currentTexts.filters.priceRange}</option>
              <option value="0-50">0-50€</option>
              <option value="50-100">50-100€</option>
              <option value="100+">100€+</option>
            </select>

            <button
              onClick={scrollToHelp}
              className="px-6 py-2 border-2 border-[#F2431E] text-[#F2431E] rounded-lg font-medium hover:bg-[#F2431E] hover:text-white transition-colors"
            >
              {currentTexts.helpButton}
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden flex flex-col h-full"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-200 flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Category Tag */}
                  <div className={`absolute top-3 left-3 ${categoryColors[product.category] || 'bg-gray-500'} text-white px-3 py-1 rounded-full text-xs font-medium`}>
                    {currentTexts.categories[product.category as keyof typeof currentTexts.categories] || product.category}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-black mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {product.description}
                  </p>
                  <p className="text-2xl font-bold text-[#F2431E] mb-4">
                    {product.price}
                  </p>

                  {/* Add to Quote Button - aligné en bas */}
                  <button
                    onClick={() => handleAddToQuote(product.id)}
                    className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors mt-auto"
                  >
                    {currentTexts.addToQuote}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">
                Aucun produit trouvé avec ces critères.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div id="help-section" className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🤖</div>
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            {currentTexts.needHelp.title}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {currentTexts.needHelp.description}
          </p>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openAssistantModal'));
            }}
            className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#E63A1A] transition-colors"
          >
            {currentTexts.needHelp.cta}
          </button>
        </div>
      </div>

      {/* Urgency Section */}
      <div className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              {currentTexts.urgency.title}
            </h2>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center text-2xl">
                  🕐
                </div>
                <span className="text-lg">{currentTexts.urgency.intervention}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center text-2xl">
                  🚚
                </div>
                <span className="text-lg">{currentTexts.urgency.delivery}</span>
              </div>
            </div>
            <a
              href="tel:+33651084994"
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.urgency.cta}
            </a>
          </div>
        </div>
      </div>

      {/* Ready Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-8">
            {currentTexts.ready.title}
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/devis"
              className="bg-[#F2431E] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#E63A1A] transition-colors text-center"
            >
              {currentTexts.ready.quickQuote}
            </a>
            <a
              href="tel:+33651084994"
              className="border-2 border-[#F2431E] text-[#F2431E] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#F2431E] hover:text-white transition-colors"
            >
              {currentTexts.ready.expert}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

