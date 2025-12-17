'use client';

import { useState, useEffect } from 'react';
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

export default function ProCataloguePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isPro, checkingPro } = usePro();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
        setFilteredProducts(data || []);
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      }
    };

    loadProducts();
  }, [user, isPro]);

  // Filtrer les produits
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(query) ||
        product.slug?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    });
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

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

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-gray-500 text-lg">{currentTexts.noProducts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  {/* Image */}
                  <div className="mb-4 flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
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
                      onClick={() => {
                        // Calculer les dates par défaut (aujourd'hui et demain)
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        
                        const startDate = today.toISOString().split('T')[0];
                        const endDate = tomorrow.toISOString().split('T')[0];
                        
                        addToCart({
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
