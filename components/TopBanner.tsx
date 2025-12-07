'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PACKS } from '@/lib/packs';

interface TopBannerProps {
  language: 'fr' | 'en';
}

interface SearchResult {
  type: 'product' | 'pack' | 'page' | 'section';
  title: string;
  description?: string;
  url: string;
  icon?: string;
  price?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  long_description?: string;
  category?: string;
  daily_price_ttc?: number;
  slug?: string;
  specs?: any;
}

export default function TopBanner({ language }: TopBannerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const texts = {
    fr: {
      searchPlaceholder: 'Rechercher un produit, pack, service...',
      sections: {
        solutions: 'Nos packs',
        urgency: 'Urgence 24/7',
        forWho: 'Pour qui ?',
        about: 'Pourquoi SoundRush',
        gallery: 'Galerie vidéos',
        trusted: 'Ils nous ont fait confiance',
        testimonials: 'Témoignages',
        faq: 'FAQ'
      },
      pages: {
        catalogue: 'Catalogue',
        packs: 'Tous les packs',
        generator: 'Générateur de prix'
      },
      contact: {
        phone: 'Appeler',
        whatsapp: 'WhatsApp'
      },
      noResults: 'Aucun résultat trouvé',
      seeAll: 'Voir tous les résultats'
    },
    en: {
      searchPlaceholder: 'Search for a product, pack, service...',
      sections: {
        solutions: 'Our packs',
        urgency: 'Emergency 24/7',
        forWho: 'For who?',
        about: 'Why SoundRush',
        gallery: 'Video gallery',
        trusted: 'They trusted us',
        testimonials: 'Testimonials',
        faq: 'FAQ'
      },
      pages: {
        catalogue: 'Catalog',
        packs: 'All packs',
        generator: 'Price generator'
      },
      contact: {
        phone: 'Call',
        whatsapp: 'WhatsApp'
      },
      noResults: 'No results found',
      seeAll: 'See all results'
    }
  };

  const currentTexts = texts[language];

  // Charger les produits depuis Supabase
  useEffect(() => {
    const loadProducts = async () => {
      if (!supabase || productsLoaded) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, long_description, category, daily_price_ttc, slug, specs')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur chargement produits pour recherche:', error);
          return;
        }

        if (data) {
          setProducts(data);
          setProductsLoaded(true);
        }
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      }
    };

    loadProducts();
  }, [productsLoaded]);

  // Sections de la homepage avec leurs IDs
  const homepageSections: SearchResult[] = [
    {
      type: 'section',
      title: currentTexts.sections.solutions,
      description: language === 'fr' ? 'Découvrez nos packs les plus populaires' : 'Discover our most popular packs',
      url: '/#solutions',
      icon: '📦'
    },
    {
      type: 'section',
      title: currentTexts.sections.urgency,
      description: language === 'fr' ? 'Besoin de matériel en urgence ?' : 'Need equipment urgently?',
      url: '/#urgency',
      icon: '🚨'
    },
    {
      type: 'section',
      title: currentTexts.sections.forWho,
      description: language === 'fr' ? 'On s\'occupe de tout, pour tous vos événements' : 'We take care of everything, for all your events',
      url: '/#forWho',
      icon: '👥'
    },
    {
      type: 'section',
      title: currentTexts.sections.about,
      description: language === 'fr' ? 'Des raisons de nous faire confiance' : 'Reasons to trust us',
      url: '/#about',
      icon: '⭐'
    },
    {
      type: 'section',
      title: currentTexts.sections.gallery,
      description: language === 'fr' ? 'Nos équipements en action' : 'Our equipment in action',
      url: '/#gallery',
      icon: '🎥'
    },
    {
      type: 'section',
      title: currentTexts.sections.trusted,
      description: language === 'fr' ? 'Ils nous ont fait confiance' : 'They trusted us',
      url: '/#trusted',
      icon: '🤝'
    },
    {
      type: 'section',
      title: currentTexts.sections.testimonials,
      description: language === 'fr' ? 'Ce que disent nos clients' : 'What our clients say',
      url: '/#testimonials',
      icon: '💬'
    },
    {
      type: 'section',
      title: currentTexts.sections.faq,
      description: language === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions',
      url: '/#faq',
      icon: '❓'
    }
  ];

  // Pages principales
  const mainPages: SearchResult[] = [
    {
      type: 'page',
      title: currentTexts.pages.catalogue,
      description: language === 'fr' ? 'Catalogue complet de matériel' : 'Complete equipment catalog',
      url: '/catalogue',
      icon: '📋'
    },
    {
      type: 'page',
      title: currentTexts.pages.packs,
      description: language === 'fr' ? 'Tous nos packs de sonorisation' : 'All our sound system packs',
      url: '/packs',
      icon: '📦'
    },
    {
      type: 'page',
      title: currentTexts.pages.generator,
      description: language === 'fr' ? 'Générateur de devis en ligne' : 'Online quote generator',
      url: '/generateur_de_prix',
      icon: '💰'
    }
  ];

  // Recherche complète dans produits, packs, sections et pages
  const performSearch = (query: string): SearchResult[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0);
    const results: SearchResult[] = [];

    // Mots-clés techniques et synonymes
    const technicalKeywords: Record<string, string[]> = {
      'micro': ['micro', 'microphone', 'micro filaire', 'micro sans fil', 'shure', 'mipro'],
      'enceinte': ['enceinte', 'speaker', 'haut-parleur', 'sonorisation', 'mac mah', 'fbt', 'as115', 'as108'],
      'caisson': ['caisson', 'subwoofer', 'basse', 'sub', 'basses'],
      'console': ['console', 'mixage', 'promix', 'hpa', 'table de mixage'],
      'cable': ['cable', 'câble', 'xlr', 'rca', 'adaptateur'],
      'led': ['led', 'lumière', 'light', 'lyre', 'barre', 'éclairage'],
      'bluetooth': ['bluetooth', 'sans fil', 'wireless'],
      'accessoire': ['accessoire', 'cable', 'câble', 'adaptateur', 'xlr', 'rca'],
      'pack': ['pack', 'solution', 'clé en main', 'turnkey'],
      'petit': ['petit', 's', 'small', 'basique', 'basic', '30-70', '30 à 70'],
      'confort': ['confort', 'm', 'medium', 'moyen', '70-150', '70 à 150'],
      'grand': ['grand', 'l', 'large', 'big', '150-250', '150 à 250'],
      'maxi': ['maxi', 'xl', 'sur mesure', 'custom', 'prestige', '300+', '300+ personnes'],
    };

    // 1. Rechercher dans les PRODUITS individuels (recherche améliorée)
    products.forEach(product => {
      // Exclure Pioneer XDJ
      if (product.name.toLowerCase().includes('pioneer') || product.name.toLowerCase().includes('xdj')) {
        return;
      }
      const productName = (product.name || '').toLowerCase();
      const productDesc = (product.description || '').toLowerCase();
      const productLongDesc = (product.long_description || '').toLowerCase();
      const productCategory = (product.category || '').toLowerCase();
      const specs = product.specs || {};
      const specsStr = JSON.stringify(specs).toLowerCase();
      
      // Score de correspondance
      let matchScore = 0;
      let matchReasons: string[] = [];
      
      // Correspondance exacte du nom
      if (productName === lowerQuery) {
        matchScore += 100;
        matchReasons.push('Nom exact');
      } else if (productName.includes(lowerQuery)) {
        matchScore += 50;
        matchReasons.push('Nom partiel');
      }
      
      // Recherche par mots dans le nom
      const nameWords = productName.split(/\s+/);
      queryWords.forEach(qWord => {
        if (nameWords.some(nWord => nWord.includes(qWord) || qWord.includes(nWord))) {
          matchScore += 30;
        }
      });
      
      // Recherche dans la description
      if (productDesc.includes(lowerQuery)) {
        matchScore += 20;
        matchReasons.push('Description');
      }
      
      // Recherche dans la description longue
      if (productLongDesc.includes(lowerQuery)) {
        matchScore += 15;
        matchReasons.push('Détails');
      }
      
      // Recherche dans les specs
      if (specsStr.includes(lowerQuery)) {
        matchScore += 10;
        matchReasons.push('Caractéristiques');
      }
      
      // Recherche par catégorie
      if (productCategory.includes(lowerQuery)) {
        matchScore += 10;
        matchReasons.push('Catégorie');
      }
      
      // Recherche par mots-clés techniques
      Object.keys(technicalKeywords).forEach(key => {
        if (technicalKeywords[key].some(kw => lowerQuery.includes(kw))) {
          // Vérifier si le produit correspond à ce mot-clé
          if (
            (key === 'micro' && productCategory === 'micros') ||
            (key === 'enceinte' && (productCategory === 'sonorisation' && !productName.includes('caisson'))) ||
            (key === 'caisson' && productName.includes('caisson')) ||
            (key === 'console' && (productName.includes('promix') || productName.includes('hpa'))) ||
            (key === 'cable' && productCategory === 'accessoires' && (productName.includes('cable') || productName.includes('câble'))) ||
            (key === 'led' && productCategory === 'lumieres') ||
            (key === 'bluetooth' && (productLongDesc.includes('bluetooth') || specsStr.includes('bluetooth'))) ||
            (key === 'accessoire' && productCategory === 'accessoires')
          ) {
            matchScore += 25;
            matchReasons.push(`Mots-clés: ${key}`);
          }
        }
      });
      
      // Recherche par synonymes de catégories
      const categorySynonyms: Record<string, string[]> = {
        'sonorisation': ['son', 'audio', 'enceinte', 'speaker', 'haut-parleur', 'ampli', 'amplificateur'],
        'micros': ['micro', 'microphone', 'micro filaire', 'micro sans fil'],
        'lumieres': ['lumière', 'light', 'led', 'éclairage', 'lyre', 'barre'],
        'accessoires': ['accessoire', 'cable', 'câble', 'adaptateur', 'connectique'],
      };
      
      Object.keys(categorySynonyms).forEach(cat => {
        if (categorySynonyms[cat].some(syn => lowerQuery.includes(syn)) && productCategory === cat) {
          matchScore += 15;
        }
      });
      
      // Si le score est suffisant, ajouter le produit
      if (matchScore >= 10) {
        const price = product.daily_price_ttc 
          ? `${product.daily_price_ttc}€/jour`
          : undefined;
        
        // Description améliorée
        let description = product.description || '';
        if (productLongDesc) {
          // Extraire la première phrase descriptive
          const firstLine = productLongDesc.split('\n').find(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.match(/^[🎤🔊⚡🔌👥🎶🎛️🎚️✨🎨🏛️📏✅🎧]/);
          });
          if (firstLine) {
            description = firstLine.trim().substring(0, 100);
          }
        }
        
        results.push({
          type: 'product',
          title: product.name,
          description: description || product.category || undefined,
          url: product.slug ? `/catalogue/${product.slug}` : `/catalogue/${product.id}`,
          icon: productCategory === 'micros' ? '🎤' : 
                productCategory === 'lumieres' ? '💡' : 
                productCategory === 'accessoires' ? '🔌' : '🔊',
          price: price
        });
      }
    });

    // 2. Rechercher dans les PACKS (recherche améliorée)
    Object.values(PACKS).forEach(pack => {
      const packName = pack.name.toLowerCase();
      const packComposition = pack.composition.join(' ').toLowerCase();
      const packCapacity = `${pack.capacity.min}-${pack.capacity.max}`;
      
      let matchScore = 0;
      
      // Recherche dans le nom
      if (packName.includes(lowerQuery)) {
        matchScore += 50;
      }
      
      // Recherche dans la composition
      if (packComposition.includes(lowerQuery)) {
        matchScore += 30;
      }
      
      // Recherche par capacité
      if (lowerQuery.includes(packCapacity) || 
          lowerQuery.includes(`${pack.capacity.min}`) || 
          lowerQuery.includes(`${pack.capacity.max}`)) {
        matchScore += 25;
      }
      
      // Mots-clés spécifiques aux packs
      const packKeywords: Record<string, string[]> = {
        'pack_petit': ['petit', 's', 'small', 'basique', 'basic', '30', '70', '30-70', '30 à 70', 'petit événement'],
        'pack_confort': ['confort', 'm', 'medium', 'moyen', '70', '150', '70-150', '70 à 150', 'moyen événement'],
        'pack_grand': ['grand', 'l', 'large', 'big', '150', '250', '150-250', '150 à 250', 'grand événement'],
        'pack_maxi': ['maxi', 'xl', 'sur mesure', 'custom', 'prestige', '300', '300+', '300+ personnes', 'grand événement', 'festival', 'concert'],
      };
      
      if (packKeywords[pack.id]) {
        packKeywords[pack.id].forEach(keyword => {
          if (lowerQuery.includes(keyword)) {
            matchScore += 20;
          }
        });
      }
      
      // Recherche par équipements dans la composition
      queryWords.forEach(qWord => {
        if (packComposition.includes(qWord)) {
          matchScore += 15;
        }
      });
      
      // Recherche par mots-clés génériques
      if (lowerQuery.includes('pack') || lowerQuery.includes('solution') || lowerQuery.includes('clé en main')) {
        matchScore += 10;
      }
      
      if (matchScore >= 10) {
        // Déterminer l'ID du pack pour l'URL
        let packId = 1;
        if (pack.id === 'pack_petit') packId = 1;
        else if (pack.id === 'pack_confort') packId = 2;
        else if (pack.id === 'pack_grand') packId = 3;
        else if (pack.id === 'pack_maxi') packId = 4;

        const price = pack.basePrice 
          ? `${pack.basePrice}€/jour`
          : language === 'fr' ? 'Sur devis' : 'On quote';

        // Description améliorée avec capacité
        const description = `${pack.composition.join(', ')} - ${pack.capacity.min}-${pack.capacity.max} ${language === 'fr' ? 'personnes' : 'people'}`;

        results.push({
          type: 'pack',
          title: pack.name,
          description: description,
          url: `/packs/${packId}`,
          icon: '📦',
          price: price
        });
      }
    });

    // 3. Rechercher dans les sections
    homepageSections.forEach(section => {
      if (
        section.title.toLowerCase().includes(lowerQuery) ||
        section.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push(section);
      }
    });

    // 4. Rechercher dans les pages
    mainPages.forEach(page => {
      if (
        page.title.toLowerCase().includes(lowerQuery) ||
        page.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push(page);
      }
    });

    // 5. Recherche par mots-clés spécifiques (améliorée)
    const keywords: Record<string, SearchResult[]> = {
      'pack': [homepageSections[0], mainPages[1]],
      'packs': [homepageSections[0], mainPages[1]],
      'solution': [homepageSections[0], mainPages[1]],
      'urgence': [homepageSections[1]],
      'urgent': [homepageSections[1]],
      'rapide': [homepageSections[1]],
      'catalogue': [mainPages[0]],
      'produit': [mainPages[0]],
      'produits': [mainPages[0]],
      'équipement': [mainPages[0]],
      'matériel': [mainPages[0]],
      'prix': [mainPages[2]],
      'tarif': [mainPages[2]],
      'tarifs': [mainPages[2]],
      'devis': [mainPages[2]],
      'estimation': [mainPages[2]],
      'faq': [homepageSections[7]],
      'question': [homepageSections[7]],
      'aide': [homepageSections[7]],
      'témoignage': [homepageSections[6]],
      'témoignages': [homepageSections[6]],
      'avis': [homepageSections[6]],
      'client': [homepageSections[6]],
      'galerie': [homepageSections[4]],
      'video': [homepageSections[4]],
      'vidéo': [homepageSections[4]],
      'confiance': [homepageSections[5]],
      'référence': [homepageSections[5]],
    };

    Object.keys(keywords).forEach(keyword => {
      if (lowerQuery.includes(keyword)) {
        keywords[keyword].forEach(result => {
          if (!results.find(r => r.url === result.url)) {
            results.push(result);
          }
        });
      }
    });

    // Trier les résultats : produits et packs en premier, puis par pertinence
    const sortedResults = results.sort((a, b) => {
      // Priorité : produits > packs > pages > sections
      const typePriority: Record<string, number> = {
        'product': 4,
        'pack': 3,
        'page': 2,
        'section': 1
      };
      
      const aPriority = typePriority[a.type] || 0;
      const bPriority = typePriority[b.type] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Si même type, trier par ordre alphabétique
      return a.title.localeCompare(b.title);
    });

    return sortedResults.slice(0, 15); // Limiter à 15 résultats pour plus de choix
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = performSearch(searchQuery);
      setSearchResults(results);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [searchQuery, products]);

  // Fermer la recherche quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  const handleResultClick = (url: string) => {
    if (url.startsWith('/#')) {
      // Section de la homepage
      router.push('/');
      setTimeout(() => {
        const sectionId = url.replace('/#', '');
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      router.push(url);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };


  return (
    <div className="bg-[#F2431E] text-white py-2 px-4 relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 relative">
        {/* Barre de recherche */}
        <div className="flex-1 w-full lg:w-auto relative" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setIsSearchOpen(true);
                }
              }}
              placeholder={currentTexts.searchPlaceholder}
              className="w-full lg:w-96 pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 text-sm"
            />
          </div>

          {/* Résultats de recherche */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-y-auto z-50">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.type}-${result.url}-${index}`}
                  onClick={() => handleResultClick(result.url)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{result.icon || '🔍'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{result.title}</p>
                        {result.price && (
                          <span className="text-xs font-bold text-[#F2431E] flex-shrink-0">
                            {result.price}
                          </span>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{result.description}</p>
                      )}
                      {result.type === 'product' && (
                        <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {language === 'fr' ? 'Produit' : 'Product'}
                        </span>
                      )}
                      {result.type === 'pack' && (
                        <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {language === 'fr' ? 'Pack' : 'Pack'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isSearchOpen && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50">
              <p className="text-gray-600 text-sm text-center">{currentTexts.noResults}</p>
            </div>
          )}
        </div>

        {/* Contacts */}
        <div className="flex items-center gap-2 sm:gap-3 justify-center lg:justify-end w-full lg:w-auto">
          {/* Bouton téléphone */}
          <a
            href="tel:+33651084994"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium min-w-[44px] h-[38px]"
          >
            <span>📞</span>
            <span className="hidden sm:inline">{currentTexts.contact.phone}</span>
          </a>

          {/* Bouton WhatsApp */}
          <a
            href="https://wa.me/33651084994"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium min-w-[44px] h-[38px]"
          >
            <span>💬</span>
            <span className="hidden sm:inline">{currentTexts.contact.whatsapp}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

