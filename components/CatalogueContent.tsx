'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import QuickAddToCartModal from './catalogue/QuickAddToCartModal';

interface CatalogueContentProps {
  language: 'fr' | 'en';
}

interface Product {
  id: number | string;
  name: string;
  category: string;
  description: string;
  price: string;
  image: string;
  capacity?: string;
  usageType?: string;
  slug?: string;
}

export default function CatalogueContent({ language }: CatalogueContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUsageType, setSelectedUsageType] = useState<string>('all');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 produits par page (3 lignes de 4)
  const [quickAddModal, setQuickAddModal] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });

  // Fonction pour vérifier si le produit est une lumière
  const isLightProduct = (product: Product): boolean => {
    if (product.category === 'lumieres') return true;
    
    const productNameLower = product.name.toLowerCase();
    
    // Exclure les produits qui ne sont clairement pas des lumières
    if (productNameLower.includes('pied') || 
        productNameLower.includes('stand') ||
        productNameLower.includes('support') ||
        productNameLower.includes('micro') ||
        productNameLower.includes('cable') ||
        productNameLower.includes('câble') ||
        productNameLower.includes('xlr') ||
        productNameLower.includes('adaptateur')) {
      return false;
    }
    
    // Vérifier les mots-clés spécifiques aux lumières
    return productNameLower.includes('led') || 
           productNameLower.includes('lumière') || 
           productNameLower.includes('lumieres') ||
           productNameLower.includes('lyre led') || 
           productNameLower.includes('barre led') ||
           productNameLower.includes('par led') ||
           (productNameLower.includes('boomtone') && 
            (productNameLower.includes('led') || productNameLower.includes('lumière') || productNameLower.includes('light'))) ||
           (productNameLower.includes('par') && 
            (productNameLower.includes('led') || productNameLower.includes('lumière') || productNameLower.includes('light'))) ||
           productNameLower.includes('light');
  };

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
      addToCart: 'Ajouter au panier',
      viewProduct: 'Voir le produit',
      needHelp: {
        title: 'Besoin d\'aide pour choisir ?',
        description: 'Vous ne savez pas quel matériel choisir ? Décrivez votre événement et nous trouvons la meilleure configuration en 2 minutes.',
        cta: 'Trouver mon pack idéal'
      },
      urgency: {
        title: 'Besoin d\'un système son maintenant ?',
        intervention: 'Intervention en moins de 1h en Île-de-France',
        delivery: 'Livraison + installation',
        cta: 'Appeler maintenant'
      },
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
      addToCart: 'Add to cart',
      viewProduct: 'View product',
      needHelp: {
        title: 'Need help choosing?',
        description: 'Don\'t know what equipment to choose? Describe your event and we\'ll find the best configuration in 2 minutes.',
        cta: 'Find my ideal pack'
      },
      urgency: {
        title: 'Need a sound system now?',
        intervention: 'Intervention in less than 1h in Île-de-France',
        delivery: 'Delivery + installation',
        cta: 'Call now'
      }
    }
  };

  const currentTexts = texts[language];

  // Produits par défaut (fallback)
  const defaultProducts: Product[] = [
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

  // Charger les produits depuis Supabase
  useEffect(() => {
    const loadProducts = async () => {
      if (!supabase) {
        // Fallback vers les produits par défaut + packs
        const allProducts = [...defaultProducts, ...getPacksAsProducts()];
        setProducts(allProducts);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur chargement produits:', error);
          // Fallback vers les produits par défaut + packs
          const allProducts = [...defaultProducts, ...getPacksAsProducts()];
          setProducts(allProducts);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Convertir les produits Supabase au format attendu
          const convertedProducts: Product[] = data.map((product: any) => {
            // Convertir daily_price_ttc en nombre si c'est une chaîne
            const price = typeof product.daily_price_ttc === 'string' 
              ? parseFloat(product.daily_price_ttc) 
              : (product.daily_price_ttc || 0);
            
            // Extraire capacity et usage_type depuis specs (jsonb)
            const specs = product.specs || {};
            const capacity = specs.capacity || undefined;
            // Pour les accessoires, on définit usage_type par défaut à 'event' si non défini
            const usageType = specs.usage_type || (product.category === 'accessoires' ? 'event' : 'event');
            
            // Générer un slug si absent
            const generateSlug = (name: string): string => {
              return name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
                .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
                .replace(/^-+|-+$/g, ''); // Supprimer les tirets en début/fin
            };

            return {
              id: product.id,
              name: product.name || 'Produit sans nom',
              category: product.category || 'accessoires',
              description: product.description || '',
              price: `${price}€/jour`,
              image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg',
              capacity: capacity,
              usageType: usageType,
              slug: product.slug || generateSlug(product.name || 'produit'),
            };
          });
          
          // Filtrer Pioneer XDJ si présent
          const filteredProducts = convertedProducts.filter(p => 
            !p.name.toLowerCase().includes('pioneer') && !p.name.toLowerCase().includes('xdj')
          );
          
          // Ajouter les packs
          const allProducts = [...filteredProducts, ...getPacksAsProducts()];
          console.log('Produits chargés depuis Supabase:', allProducts);
          console.log('Produit Pied d\'enceinte trouvé:', filteredProducts.find(p => p.name.toLowerCase().includes('pied')));
          setProducts(allProducts);
        } else {
          console.log('Aucun produit en base, utilisation des produits par défaut + packs');
          // Aucun produit en base, utiliser les produits par défaut + packs
          const allProducts = [...defaultProducts, ...getPacksAsProducts()];
          setProducts(allProducts);
        }
      } catch (error) {
        console.error('Erreur chargement produits:', error);
        // Fallback vers les produits par défaut + packs
        const allProducts = [...defaultProducts, ...getPacksAsProducts()];
        setProducts(allProducts);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Fonction pour convertir les packs en produits
  function getPacksAsProducts(): Product[] {
    return [
      {
        id: 'pack-1',
        name: 'Pack S Petit',
        category: 'packs',
        description: 'Pour 30 à 70 personnes. 1 enceinte Mac Mah AS 115, 1 console de mixage',
        price: '109€/jour',
        image: '/pack2c.jpg',
        capacity: '30-70',
        usageType: 'event'
      },
      {
        id: 'pack-2',
        name: 'Pack M Confort',
        category: 'packs',
        description: 'Pour 70 à 150 personnes. 2 enceintes Mac Mah AS 115, 1 console HPA Promix 8',
        price: '129€/jour',
        image: '/pack2cc.jpg',
        capacity: '70-150',
        usageType: 'event'
      },
      {
        id: 'pack-3',
        name: 'Pack L Grand',
        category: 'packs',
        description: 'Pour 150 à 250 personnes. 2 enceintes FBT X-Lite 115A, 1 caisson, 1 console HPA Promix 16',
        price: '179€/jour',
        image: '/pack4cc.jpg',
        capacity: '150-250',
        usageType: 'event'
      },
      {
        id: 'pack-5',
        name: 'Pack Custom',
        category: 'packs',
        description: 'Composez votre pack sur mesure. Sélectionnez uniquement ce dont vous avez besoin, matériel adapté à votre événement, devis personnalisé',
        price: 'Sur devis',
        image: '/concert.jpg',
        capacity: '300+',
        usageType: 'event'
      }
    ];
  }

  const categoryColors: Record<string, string> = {
    sonorisation: 'bg-[#F2431E]',
    dj: 'bg-blue-500',
    micros: 'bg-green-500',
    lumieres: 'bg-purple-500',
    packs: 'bg-pink-500',
    accessoires: 'bg-gray-500'
  };

  const filteredProducts = products.filter(product => {
    // Exclure Pioneer XDJ de tous les résultats
    if (product.name.toLowerCase().includes('pioneer') || product.name.toLowerCase().includes('xdj')) {
      return false;
    }
    
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesUsageType = selectedUsageType === 'all' || product.usageType === selectedUsageType;
    // Pour les produits sans capacity (comme les accessoires), on les inclut si le filtre est à 'all'
    const matchesCapacity = selectedCapacity === 'all' || product.capacity === selectedCapacity || (!product.capacity && selectedCapacity === 'all');
    
    // Price range filter logic
    let matchesPrice = true;
    if (selectedPriceRange !== 'all') {
      // Extraire le nombre du prix (format: "70.00€/jour" ou "70€/jour" ou "Sur devis")
      if (product.price.toLowerCase().includes('devis') || product.price.toLowerCase().includes('quote')) {
        // Les packs "Sur devis" ne matchent aucun filtre de prix sauf si on filtre explicitement
        matchesPrice = false;
      } else {
        const priceMatch = product.price.match(/(\d+(?:\.\d+)?)/);
        const priceNum = priceMatch ? parseFloat(priceMatch[1]) : 0;
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
    }

    return matchesSearch && matchesCategory && matchesUsageType && matchesCapacity && matchesPrice;
  });

  // Pagination - s'active seulement si plus de 20 produits
  const shouldPaginate = filteredProducts.length > 20;
  const totalPages = shouldPaginate ? Math.ceil(filteredProducts.length / itemsPerPage) : 1;
  const startIndex = shouldPaginate ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = shouldPaginate ? startIndex + itemsPerPage : filteredProducts.length;
  const paginatedProducts = shouldPaginate ? filteredProducts.slice(startIndex, endIndex) : filteredProducts;

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedUsageType, selectedCapacity, selectedPriceRange]);

  const handleAddToQuote = (productId: number) => {
    // Ouvrir la chatbox
    window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
  };

  const scrollToHelp = () => {
    // Ouvrir la chatbox au lieu de scroller
    window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
  };

  return (
    <div className="pt-[180px] sm:pt-[200px]">
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
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement des produits...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
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
                  <div className="h-[3rem] mb-2 flex items-start">
                    <h3 className="text-lg font-bold text-black line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                  <div className="h-[3rem] mb-4">
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {product.description.split('.')[0] || product.description.substring(0, 100)}
                      {product.description.length > 100 && !product.description.includes('.') ? '...' : ''}
                    </p>
                  </div>
                  <div className="h-[2.75rem] flex items-end mb-4">
                    <p className="text-2xl font-bold text-[#F2431E] leading-none">
                      {product.price}
                    </p>
                  </div>

                  {/* Buttons - alignés en bas */}
                  <div className="flex flex-col gap-2 mt-auto pt-2">
                    {product.category === 'packs' && (product.price.includes('devis') || product.price.includes('quote')) ? (
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
                        }}
                        className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors text-center min-h-[44px] flex items-center justify-center"
                      >
                        {language === 'fr' ? '🤖 Utiliser l\'assistant SoundRush Paris' : '🤖 Use SoundRush Paris Assistant'}
                      </button>
                    ) : isLightProduct(product) ? (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 px-4 py-3 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <span>🚫</span>
                        {language === 'fr' ? 'Indisponible' : 'Unavailable'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Pour tous les produits (y compris les packs), ouvrir le modal
                          setQuickAddModal({ isOpen: true, product });
                        }}
                        className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <span>🛒</span>
                        {currentTexts.addToCart}
                      </button>
                    )}
                    {/* Ne pas afficher "Voir le produit" pour le pack XL sur mesure */}
                    {!(product.id === 'pack-5' || product.name.toLowerCase().includes('pack xl') || product.name.toLowerCase().includes('sur mesure')) && (
                      <Link
                        href={product.category === 'packs' 
                          ? `/packs/${product.id.toString().replace('pack-', '')}` 
                          : `/catalogue/${product.slug || product.id}`}
                        className="w-full border-2 border-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center min-h-[44px] flex items-center justify-center"
                      >
                        {currentTexts.viewProduct}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">
                Aucun produit trouvé avec ces critères.
              </p>
            </div>
          )}

          {/* Pagination - affichée seulement si nécessaire */}
          {!loading && shouldPaginate && filteredProducts.length > 0 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="text-sm text-gray-600">
                {language === 'fr' 
                  ? `Affichage ${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} sur ${filteredProducts.length} produits`
                  : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} of ${filteredProducts.length} products`
                }
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                  }`}
                >
                  {language === 'fr' ? 'Précédent' : 'Previous'}
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#F2431E] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                  }`}
                >
                  {language === 'fr' ? 'Suivant' : 'Next'}
                </button>
              </div>
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

      {/* Quick Add to Cart Modal */}
      {quickAddModal.product && (
        <QuickAddToCartModal
          isOpen={quickAddModal.isOpen}
          onClose={() => setQuickAddModal({ isOpen: false, product: null })}
          product={quickAddModal.product}
          language={language}
        />
      )}
    </div>
  );
}

