'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';

export default function AdminCataloguePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

    // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

useEffect(() => {
    if (!user || !supabase) return;

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
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter((product) => {
    
  // Double vérification de sécurité
  if (!isAdmin) {
    return null;
  }

  return (
        product.name?.toLowerCase().includes(query) ||
        product.slug?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    });
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchQuery, products]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const texts = {
    fr: {
      title: 'Catalogue produits (ADMIN ONLY)',
      subtitle: 'Utilisé pour ajuster un pack ou gérer les exceptions. Les clients ne voient pas ce catalogue.',
      addProduct: '+ Ajouter un produit',
      searchPlaceholder: 'Rechercher un produit...',
      noProducts: 'Aucun produit',
      name: 'Nom',
      price: 'Prix/jour',
      deposit: 'Caution',
      category: 'Catégorie',
      actions: 'Actions',
      edit: 'Modifier',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder au catalogue.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Product Catalog',
      subtitle: 'Used to adjust a pack or manage exceptions. Clients do not see this catalog.',
      addProduct: '+ Add a product',
      searchPlaceholder: 'Search a product...',
      noProducts: 'No products',
      name: 'Name',
      price: 'Price/day',
      deposit: 'Deposit',
      category: 'Category',
      actions: 'Actions',
      edit: 'Edit',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access the catalog.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar language={language} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentTexts.signInRequired}</h1>
            <p className="text-xl text-gray-600 mb-8">{currentTexts.signInDescription}</p>
            <button
              onClick={() => setIsSignModalOpen(true)}
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.signIn}
            </button>
          </div>
        </main>
        <SignModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          language={language}
          isAdmin={true}
          onSuccess={() => window.location.reload()}
          onOpenUserModal={() => router.push('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        {/* Sidebar - Fixed, ne prend pas d'espace dans le flux */}
        <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>
        <AdminSidebar
          language={language}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((v) => !v)}
        />
        <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">♪</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SoundRush</span>
            </Link>
            <button 
              onClick={() => setIsSidebarOpen((v) => !v)} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-expanded={isSidebarOpen}
              aria-controls="admin-sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Header Desktop */}
          <div className="hidden lg:block">
            <AdminHeader language={language} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{currentTexts.title}</h1>
                  {currentTexts.subtitle && (
                    <p className="text-sm text-gray-600 mt-2">{currentTexts.subtitle}</p>
                  )}
                </div>
                <Link
                  href="/admin/catalogue/nouveau"
                  className="bg-[#F2431E] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  {currentTexts.addProduct}
                </Link>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder={currentTexts.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                />
              </div>

              {paginatedProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-lg">{currentTexts.noProducts}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'produit' : 'produits'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {paginatedProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                      <div className="mb-4 flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-grow">
                        <div className="h-[3rem] mb-2 flex items-start">
                          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{product.name}</h3>
                        </div>
                        <div className="h-[3rem] mb-4">
                          <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                        </div>
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
                        <div className="mt-auto pt-2">
                          <Link
                            href={`/admin/catalogue/${product.id}`}
                            className="w-full text-center bg-[#F2431E] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors min-h-[44px] flex items-center justify-center"
                          >
                            {currentTexts.edit}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Précédent
                      </button>
                      <span className="px-4 py-2 text-gray-700">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
      <Footer language={language} />
    </div>
  );
}

