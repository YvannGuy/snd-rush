'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/hooks/useUser';
import { usePro } from '@/hooks/usePro';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import ProCatalogueFilters from '@/components/pro/ProCatalogueFilters';

export default function ProCataloguePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isPro, checkingPro } = usePro();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>('name_asc');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const { addToCart } = useCart();

  // Guard: Rediriger si pas pro
  useEffect(() => {
    if (!checkingPro && !loading) {
      if (!user) {
        router.push('/pro');
        return;
      }
      if (!isPro) {
        router.push('/pro?denied=1');
        return;
      }
    }
  }, [isPro, checkingPro, user, loading, router]);

  // Charger les produits
  useEffect(() => {
    if (!user || !supabase || !isPro) return;

    const loadProducts = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      }
    };

    loadProducts();
  }, [user, isPro]);

  // Fonction pour déterminer la catégorie principale d'un produit
  const getProductMainCategory = (product: any): string | null => {
    const nameLower = product.name?.toLowerCase() || '';
    const categoryLower = product.category?.toLowerCase() || '';
    const descriptionLower = product.description?.toLowerCase() || '';
    const slugLower = product.slug?.toLowerCase() || '';

    // Vérifier dans l'ordre de priorité pour éviter les chevauchements
    
    // 1. Accessoires (priorité la plus haute - vérifier en premier pour capturer pieds, boomtone, etc.)
    if (
      categoryLower.includes('accessoire') ||
      nameLower.includes('pied') ||
      nameLower.includes('stand') ||
      nameLower.includes('support') ||
      nameLower.includes('boomtone') ||
      nameLower.includes('boom tone') ||
      nameLower.includes('cable') ||
      nameLower.includes('xlr') ||
      nameLower.includes('adaptateur') ||
      nameLower.includes('adapter') ||
      nameLower.includes('rca') ||
      nameLower.includes('jack') ||
      descriptionLower.includes('pied') ||
      descriptionLower.includes('support') ||
      descriptionLower.includes('cable') ||
      descriptionLower.includes('adaptateur') ||
      descriptionLower.includes('boomtone')
    ) {
      return 'accessoires';
    }

    // 2. DJ (priorité haute - vérifier avant les autres car "dj" peut apparaître dans d'autres noms)
    // Exclure les enceintes Mac Mah et autres produits de sonorisation
    const isSonorisationProduct = 
      nameLower.includes('mac mah') ||
      nameLower.includes('macmah') ||
      nameLower.includes('enceinte') ||
      nameLower.includes('caisson') ||
      nameLower.includes('promix') ||
      nameLower.includes('console de mixage') ||
      nameLower.includes('fbt');
    
    if (
      !isSonorisationProduct && (
        categoryLower.includes('dj') ||
        nameLower.includes('ddj') ||
        nameLower.includes('cdj') ||
        nameLower.includes('xdj') ||
        nameLower.includes('pioneer') ||
        nameLower.includes('platine dj') ||
        nameLower.includes('turntable') ||
        (slugLower.includes('dj') && !slugLower.includes('enceinte')) ||
        (descriptionLower.includes('dj') && !descriptionLower.includes('accessoire') && !descriptionLower.includes('enceinte'))
      )
    ) {
      return 'dj';
    }

    // 3. Lumières (priorité haute - mais exclure boomtone qui est un accessoire)
    if (
      (categoryLower.includes('lumiere') || categoryLower.includes('light')) &&
      !nameLower.includes('boomtone') &&
      !descriptionLower.includes('boomtone')
    ) {
      if (
        nameLower.includes('lumiere') ||
        nameLower.includes('light') ||
        nameLower.includes('led') ||
        nameLower.includes('par led') ||
        nameLower.includes('effet lumineux') ||
        nameLower.includes('projecteur')
      ) {
        return 'lumieres';
      }
    }

    // 4. Micros (priorité haute)
    if (
      categoryLower.includes('micro') ||
      categoryLower.includes('mic') ||
      nameLower.includes('micro') ||
      nameLower.includes('mic ') ||
      nameLower.includes('shure') ||
      nameLower.includes('mipro') ||
      nameLower.includes('sm58')
    ) {
      return 'micros';
    }

    // 5. Sonorisation (en dernier pour éviter les chevauchements)
    if (
      categoryLower.includes('sonorisation') ||
      (nameLower.includes('enceinte') && !nameLower.includes('pied')) ||
      nameLower.includes('caisson') ||
      nameLower.includes('promix') ||
      nameLower.includes('console de mixage') ||
      (nameLower.includes('mixage') && !nameLower.includes('dj')) ||
      (nameLower.includes('fbt') && !nameLower.includes('pied')) ||
      nameLower.includes('mac mah') ||
      nameLower.includes('macmah')
    ) {
      return 'sonorisation';
    }

    return null;
  };

  // Fonction pour déterminer la sous-catégorie d'un produit
  const getProductSubCategory = (product: any): string | null => {
    const nameLower = product.name?.toLowerCase() || '';
    const categoryLower = product.category?.toLowerCase() || '';
    const descriptionLower = product.description?.toLowerCase() || '';
    const slugLower = product.slug?.toLowerCase() || '';

    // Vérifier d'abord la catégorie principale pour éviter les chevauchements
    const mainCategory = getProductMainCategory(product);

    // Sonorisation (exclure les pieds qui sont des accessoires)
    if (mainCategory === 'sonorisation') {
      if (
        nameLower.includes('active') ||
        nameLower.includes('as108') ||
        nameLower.includes('as115') ||
        nameLower.includes('fbt x-lite') ||
        nameLower.includes('fbt xlite') ||
        nameLower.includes('fbt115') ||
        nameLower.includes('xlite 115') ||
        nameLower.includes('xlite115')
      ) {
        return 'enceintes_actives';
      }
      if (nameLower.includes('passive')) {
        return 'enceintes_passives';
      }
      if (nameLower.includes('caisson') || nameLower.includes('sub') || nameLower.includes('x-sub')) {
        return 'caissons';
      }
      if (nameLower.includes('promix') || nameLower.includes('console') || nameLower.includes('mixage')) {
        return 'consoles_mixage';
      }
      // Par défaut, si c'est une enceinte mais qu'on ne peut pas déterminer, considérer comme active
      if (nameLower.includes('enceinte') || nameLower.includes('fbt') || nameLower.includes('mac mah')) {
        return 'enceintes_actives';
      }
      // Si c'est de la sonorisation mais qu'on ne peut pas déterminer la sous-catégorie, retourner une valeur par défaut
      return 'enceintes_actives'; // Valeur par défaut pour la sonorisation
    }

    // DJ (uniquement si la catégorie principale est DJ)
    if (mainCategory === 'dj') {
      if (nameLower.includes('platine') || nameLower.includes('turntable') || nameLower.includes('cdj')) {
        return 'platines';
      }
      if (
        nameLower.includes('contrôleur') ||
        nameLower.includes('controller') ||
        nameLower.includes('ddj') ||
        nameLower.includes('xdj')
      ) {
        return 'controleurs';
      }
      if (nameLower.includes('mixeur') || nameLower.includes('mixer')) {
        return 'mixeurs_dj';
      }
      // Par défaut pour les produits DJ
      return 'controleurs'; // Valeur par défaut pour les produits DJ (la plupart sont des contrôleurs)
    }

    // Lumières (uniquement si la catégorie principale est Lumières, exclure boomtone)
    if (mainCategory === 'lumieres' && !nameLower.includes('boomtone') && !descriptionLower.includes('boomtone')) {
      if (nameLower.includes('led') || nameLower.includes('par')) {
        return 'led';
      }
      if (nameLower.includes('projecteur') || nameLower.includes('projector')) {
        return 'projecteurs';
      }
      // Par défaut pour les lumières
      return 'effets'; // Valeur par défaut pour les lumières
    }

    // Micros (uniquement si la catégorie principale est Micros)
    if (mainCategory === 'micros') {
      if (nameLower.includes('sans fil') || nameLower.includes('wireless') || nameLower.includes('mipro')) {
        return 'sans_fil';
      }
      if (nameLower.includes('cravate') || nameLower.includes('lavalier')) {
        return 'cravate';
      }
      // Par défaut pour les micros
      return 'filaire'; // Valeur par défaut pour les micros
    }

    // Accessoires (uniquement si la catégorie principale est Accessoires)
    if (mainCategory === 'accessoires') {
      // Vérifier les adaptateurs EN PREMIER (avant les câbles) car un adaptateur peut contenir "xlr" ou "rca"
      if (
        nameLower.includes('adaptateur') ||
        nameLower.includes('adapter') ||
        (nameLower.includes('rca') && nameLower.includes('xlr')) ||
        (nameLower.includes('rca') && nameLower.includes('↔')) ||
        (nameLower.includes('xlr') && nameLower.includes('↔')) ||
        descriptionLower.includes('adaptateur') ||
        descriptionLower.includes('adapter') ||
        (descriptionLower.includes('rca') && descriptionLower.includes('xlr'))
      ) {
        return 'adaptateurs';
      }
      
      // Ensuite vérifier les pieds
      if (
        nameLower.includes('pied') ||
        nameLower.includes('stand') ||
        nameLower.includes('support') ||
        descriptionLower.includes('pied') ||
        descriptionLower.includes('support') ||
        descriptionLower.includes('pied d\'enceinte')
      ) {
        return 'pieds';
      }
      
      // BoomTone est un accessoire (pied d'enceinte avec lumière intégrée)
      if (nameLower.includes('boomtone') || nameLower.includes('boom tone') || descriptionLower.includes('boomtone')) {
        return 'pieds'; // Classé comme pieds car c'est un pied d'enceinte
      }
      
      // Enfin vérifier les câbles (après les adaptateurs pour éviter les faux positifs)
      if (nameLower.includes('cable') || nameLower.includes('xlr') || descriptionLower.includes('cable')) {
        return 'cables';
      }
      
      // Si c'est un accessoire mais qu'on ne peut pas le classer précisément, retourner null pour qu'il soit quand même visible
      return null;
    }

    return null;
  };

  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => {
        return (
          product.name?.toLowerCase().includes(query) ||
          product.slug?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
        );
      });
    }

    // Filtre par catégories principales (utiliser la fonction getProductMainCategory pour éviter les chevauchements)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => {
        const productMainCategory = getProductMainCategory(product);
        // Le produit doit appartenir à au moins une des catégories sélectionnées
        return productMainCategory && selectedCategories.includes(productMainCategory);
      });
    }

    // Filtre par sous-catégories (seulement si des sous-catégories sont sélectionnées)
    // Si une catégorie principale est sélectionnée mais aucune sous-catégorie, on affiche tous les produits de cette catégorie
    if (selectedSubCategories.length > 0) {
      filtered = filtered.filter((product) => {
        const subCategory = getProductSubCategory(product);
        // Si le produit a une sous-catégorie, vérifier qu'elle est sélectionnée
        if (subCategory) {
          return selectedSubCategories.includes(subCategory);
        }
        // Si le produit n'a pas de sous-catégorie détectée mais appartient à une catégorie principale sélectionnée,
        // on vérifie s'il correspond vraiment à cette catégorie pour l'inclure
        // Cela permet d'afficher les produits même s'ils n'ont pas de sous-catégorie précise
        const categoryLower = product.category?.toLowerCase() || '';
        const nameLower = product.name?.toLowerCase() || '';
        const descriptionLower = product.description?.toLowerCase() || '';
        const slugLower = product.slug?.toLowerCase() || '';
        
        // Vérifier si le produit correspond à au moins une catégorie principale sélectionnée
        return selectedCategories.some((cat) => {
          if (cat === 'sonorisation') {
            const isAccessory = nameLower.includes('pied') || nameLower.includes('stand') || nameLower.includes('support');
            if (isAccessory) return false;
            return (
              categoryLower.includes('sonorisation') ||
              (nameLower.includes('enceinte') && !isAccessory) ||
              nameLower.includes('caisson') ||
              nameLower.includes('promix') ||
              nameLower.includes('console de mixage') ||
              nameLower.includes('mixage') ||
              (nameLower.includes('fbt') && !isAccessory) ||
              nameLower.includes('mac mah') ||
              nameLower.includes('macmah')
            );
          }
          if (cat === 'dj') {
            return (
              categoryLower.includes('dj') ||
              nameLower.includes('dj') ||
              nameLower.includes('pioneer') ||
              nameLower.includes('ddj') ||
              nameLower.includes('cdj') ||
              nameLower.includes('xdj') ||
              nameLower.includes('platine') ||
              nameLower.includes('turntable') ||
              slugLower.includes('dj') ||
              descriptionLower.includes('dj')
            );
          }
          if (cat === 'lumieres') {
            return (
              categoryLower.includes('lumiere') ||
              categoryLower.includes('light') ||
              nameLower.includes('lumiere') ||
              nameLower.includes('light') ||
              nameLower.includes('led') ||
              nameLower.includes('par') ||
              nameLower.includes('projecteur') ||
              nameLower.includes('boomtone') ||
              nameLower.includes('effet lumineux')
            );
          }
          if (cat === 'micros') {
            return (
              categoryLower.includes('micro') ||
              categoryLower.includes('mic') ||
              nameLower.includes('micro') ||
              nameLower.includes('mic') ||
              nameLower.includes('shure') ||
              nameLower.includes('mipro') ||
              nameLower.includes('sm58')
            );
          }
          if (cat === 'accessoires') {
            return (
              categoryLower.includes('accessoire') ||
              nameLower.includes('cable') ||
              nameLower.includes('xlr') ||
              nameLower.includes('adaptateur') ||
              nameLower.includes('adapter') ||
              nameLower.includes('pied') ||
              nameLower.includes('stand') ||
              nameLower.includes('support') ||
              nameLower.includes('rca') ||
              nameLower.includes('jack') ||
              descriptionLower.includes('cable') ||
              descriptionLower.includes('pied') ||
              descriptionLower.includes('support') ||
              descriptionLower.includes('adaptateur') ||
              descriptionLower.includes('adapter') ||
              descriptionLower.includes('rca')
            );
          }
          return false;
        });
      });
    }
    // Si aucune sous-catégorie n'est sélectionnée mais des catégories principales le sont,
    // tous les produits de ces catégories sont déjà inclus (filtrés à l'étape précédente)

    // Filtre par prix
    filtered = filtered.filter((product) => {
      // Récupérer le prix du produit
      const price = typeof product.daily_price_ttc === 'number' && !isNaN(product.daily_price_ttc) 
        ? product.daily_price_ttc 
        : null;
      
      // Si le produit n'a pas de prix défini, l'exclure du filtrage par prix
      // (ou l'inclure si la plage est 0-10000 par défaut)
      if (price === null) {
        // Si la plage par défaut (0-10000) est sélectionnée, inclure les produits sans prix
        // Sinon, les exclure
        return priceRange[0] === 0 && priceRange[1] >= 10000;
      }
      
      // Vérifier que le prix est dans la plage sélectionnée
      // Si priceRange[1] est >= 10000, c'est la valeur max (Infinity), donc accepter tous les prix >= min
      if (priceRange[1] >= 10000) {
        return price >= priceRange[0];
      }
      
      // Pour les plages normales, vérifier que le prix est dans l'intervalle [min, max]
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.daily_price_ttc || 0) - (b.daily_price_ttc || 0);
        case 'price_desc':
          return (b.daily_price_ttc || 0) - (a.daily_price_ttc || 0);
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'name_asc':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategories, selectedSubCategories, priceRange, sortBy]);

  // Fonction pour réinitialiser les filtres
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setPriceRange([0, 10000]);
    setSortBy('name_asc');
    setSearchQuery('');
  };

  const texts = {
    fr: {
      title: 'Catalogue Pro',
      subtitle: 'Matériel professionnel avec tarifs préférentiels',
      searchPlaceholder: 'Rechercher un produit...',
      noProducts: 'Aucun produit disponible',
      addToCart: 'Ajouter au panier',
      price: 'Prix/jour',
      deposit: 'Caution',
      category: 'Catégorie',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder au catalogue pro.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Pro Catalog',
      subtitle: 'Professional equipment with preferential rates',
      searchPlaceholder: 'Search a product...',
      noProducts: 'No products available',
      addToCart: 'Add to cart',
      price: 'Price/day',
      deposit: 'Deposit',
      category: 'Category',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access the pro catalog.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  // Loading state
  if (loading || checkingPro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
        </div>
      </div>
    );
  }

  // Guard: Si pas user, afficher modal connexion
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="flex-1 pt-[112px] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentTexts.signInRequired}</h1>
            <p className="text-xl text-gray-600 mb-8">{currentTexts.signInDescription}</p>
            <Button
              onClick={() => setIsSignModalOpen(true)}
              className="bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.signIn}
            </Button>
          </div>
        </main>
        <Footer language={language} />
        <SignModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          language={language}
          onSuccess={() => {
            setIsSignModalOpen(false);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Guard: Si pas pro, ne rien afficher (redirection en cours)
  if (!isPro) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="flex-1 pt-[112px] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {currentTexts.title}
            </h1>
            <p className="text-gray-600">
              {currentTexts.subtitle}
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={currentTexts.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters and Products Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <ProCatalogueFilters
              language={language}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              selectedSubCategories={selectedSubCategories}
              setSelectedSubCategories={setSelectedSubCategories}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onReset={handleResetFilters}
              productCount={filteredProducts.length}
              isMobileOpen={isMobileFiltersOpen}
              setIsMobileOpen={setIsMobileFiltersOpen}
            />

            {/* Products Grid */}
            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-lg">{currentTexts.noProducts}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  {/* Image - Lien vers la page produit */}
                  <Link href={`/pro/catalogue/${product.slug || product.id}`}>
                    <div className="mb-4 flex-shrink-0 cursor-pointer">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex flex-col flex-grow">
                    {/* Titre - Lien vers la page produit */}
                    <Link href={`/pro/catalogue/${product.slug || product.id}`}>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-[#F2431E] transition-colors cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    
                    {/* Price & Deposit */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-500">{currentTexts.price}</div>
                        <div className="text-lg font-bold text-gray-900">{product.daily_price_ttc}€</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">{currentTexts.deposit}</div>
                        <div className="text-lg font-bold text-gray-900">{product.deposit}€</div>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={async () => {
                        // Calculer les dates par défaut (aujourd'hui et demain)
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        
                        const startDate = today.toISOString().split('T')[0];
                        const endDate = tomorrow.toISOString().split('T')[0];
                        
                        const result = await addToCart({
                          productId: product.id,
                          productName: product.name,
                          productSlug: product.slug || product.id,
                          quantity: 1,
                          rentalDays: 1,
                          startDate: startDate,
                          endDate: endDate,
                          dailyPrice: product.daily_price_ttc || 0,
                          deposit: product.deposit || 0,
                          addons: [],
                          images: Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []),
                        });
                        if (!result.success) {
                          alert(result.error || (language === 'fr' 
                            ? 'Impossible d\'ajouter ce produit au panier.' 
                            : 'Unable to add this product to cart.'));
                        }
                      }}
                      className="w-full bg-[#F2431E] text-white hover:bg-[#E63A1A] transition-colors mt-auto"
                    >
                      {currentTexts.addToCart}
                    </Button>
                  </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer language={language} />

      {/* Sign Modal */}
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
        onSuccess={() => {
          setIsSignModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
