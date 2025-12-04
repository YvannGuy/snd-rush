'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useUser } from '@/hooks/useUser';
import SignModal from '@/components/auth/SignModal';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MesFacturesPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const itemsPerPage = 10;

  // Rediriger vers l'accueil si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (loading) return; // Attendre que le chargement soit terminé
    
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadOrders = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      try {
        const { data, error } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
        setFilteredOrders(data || []);
      } catch (error) {
        console.error('Erreur chargement factures:', error);
      }
    };

    loadOrders();
  }, [user]);

  // Filtrer les factures selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = orders.filter((order) => {
      const orderNumber = order.id.slice(0, 8).toUpperCase();
      const date = new Date(order.created_at).toLocaleDateString('fr-FR');
      const total = parseFloat(order.total || 0).toFixed(2);
      const status = getStatusText(order.status).toLowerCase();
      const customerName = (order.customer_name || '').toLowerCase();
      const customerEmail = (order.customer_email || '').toLowerCase();
      const address = (order.delivery_address || '').toLowerCase();

      return (
        orderNumber.toLowerCase().includes(query) ||
        date.includes(query) ||
        total.includes(query) ||
        status.includes(query) ||
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        address.includes(query)
      );
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchQuery, orders]);

  const texts = {
    fr: {
      title: 'Mes factures',
      empty: 'Aucune facture',
      emptyDescription: 'Vos factures apparaîtront ici après vos commandes.',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour voir vos factures.',
      signIn: 'Se connecter',
      invoice: 'Facture',
      date: 'Date',
      amount: 'Montant',
      status: 'Statut',
      paid: 'Payée',
      pending: 'En attente',
      cancelled: 'Annulée',
      refunded: 'Remboursée',
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page',
      of: 'sur',
    },
    en: {
      title: 'My invoices',
      empty: 'No invoices',
      emptyDescription: 'Your invoices will appear here after your orders.',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to view your invoices.',
      signIn: 'Sign in',
      invoice: 'Invoice',
      date: 'Date',
      amount: 'Amount',
      status: 'Status',
      paid: 'Paid',
      pending: 'Pending',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
    },
  };

  const currentTexts = texts[language];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PAID': currentTexts.paid,
      'PENDING': currentTexts.pending,
      'CANCELLED': currentTexts.cancelled,
      'REFUNDED': currentTexts.refunded,
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'PAID': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'REFUNDED': 'bg-blue-100 text-blue-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar language={language} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar language={language} />
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
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex lg:flex-row">
      <DashboardSidebar language={language} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 overflow-y-auto w-full lg:w-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">♪</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SoundRush</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">{currentTexts.title}</h1>

          {/* Barre de recherche */}
          {orders.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'fr' ? 'Rechercher par date, prix, numéro, statut, client...' : 'Search by date, price, number, status, customer...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600">
                  {language === 'fr' 
                    ? `${filteredOrders.length} facture${filteredOrders.length > 1 ? 's' : ''} trouvée${filteredOrders.length > 1 ? 's' : ''}`
                    : `${filteredOrders.length} invoice${filteredOrders.length > 1 ? 's' : ''} found`}
                </p>
              )}
            </div>
          )}

          {filteredOrders.length === 0 && orders.length > 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🔍</div>
              <p className="text-xl text-gray-600 mb-2">{language === 'fr' ? 'Aucun résultat trouvé' : 'No results found'}</p>
              <p className="text-gray-500 mb-8">{language === 'fr' ? 'Essayez avec d\'autres mots-clés' : 'Try with different keywords'}</p>
              <button
                onClick={() => setSearchQuery('')}
                className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
              >
                {language === 'fr' ? 'Effacer la recherche' : 'Clear search'}
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📄</div>
              <p className="text-xl text-gray-600 mb-2">{currentTexts.empty}</p>
              <p className="text-gray-500">{currentTexts.emptyDescription}</p>
            </div>
          ) : (
            <>
              {/* Calculer la pagination */}
              {(() => {
                const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
                
                return (
                  <>
                    <div className="space-y-6 mb-6">
                      {paginatedOrders.map((order) => {
                  const orderNumber = order.id.slice(0, 8).toUpperCase();
                  const isPaid = order.status === 'PAID';
                  const isPending = order.status === 'PENDING';
                  const isCancelled = order.status === 'CANCELLED';
                  const isRefunded = order.status === 'REFUNDED';
                  
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                    >
                      {/* Header avec statut */}
                      <div className={`px-4 sm:px-6 py-4 ${
                        isPaid ? 'bg-green-50 border-b border-green-200' :
                        isPending ? 'bg-yellow-50 border-b border-yellow-200' :
                        isCancelled ? 'bg-gray-50 border-b border-gray-200' :
                        isRefunded ? 'bg-blue-50 border-b border-blue-200' :
                        'bg-gray-50 border-b border-gray-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isPaid ? 'bg-green-100' :
                              isPending ? 'bg-yellow-100' :
                              isCancelled ? 'bg-gray-100' :
                              isRefunded ? 'bg-blue-100' :
                              'bg-gray-100'
                            }`}>
                              <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                isPaid ? 'text-green-600' :
                                isPending ? 'text-yellow-600' :
                                isCancelled ? 'text-gray-600' :
                                isRefunded ? 'text-blue-600' :
                                'text-gray-600'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                                {currentTexts.invoice} #{orderNumber}
                              </h3>
                              <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                                isPaid
                                  ? 'bg-green-100 text-green-800'
                                  : isPending
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : isCancelled
                                  ? 'bg-gray-100 text-gray-800'
                                  : isRefunded
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/invoice/download?orderId=${order.id}`);
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `facture-${order.id.slice(0, 8)}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                } else {
                                  const error = await response.json();
                                  alert(language === 'fr' ? `Erreur: ${error.error || 'Impossible de télécharger la facture'}` : `Error: ${error.error || 'Unable to download invoice'}`);
                                }
                              } catch (error) {
                                console.error('Erreur téléchargement:', error);
                                alert(language === 'fr' ? 'Erreur lors du téléchargement de la facture' : 'Error downloading invoice');
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors text-sm sm:text-base whitespace-nowrap"
                            title={language === 'fr' ? 'Télécharger la facture' : 'Download invoice'}
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden sm:inline">{language === 'fr' ? 'Télécharger' : 'Download'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {/* Informations principales */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.date}</h4>
                              <div className="flex items-center gap-2 text-gray-900">
                                <svg className="w-5 h-5 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">{formatDate(order.created_at)}</span>
                              </div>
                            </div>

                            {order.customer_name && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{language === 'fr' ? 'Client' : 'Customer'}</h4>
                                <p className="text-gray-900">{order.customer_name}</p>
                              </div>
                            )}

                            {order.customer_email && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">Email</h4>
                                <p className="text-gray-900">{order.customer_email}</p>
                              </div>
                            )}

                            {order.delivery_address && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{language === 'fr' ? 'Adresse de livraison' : 'Delivery address'}</h4>
                                <p className="text-gray-900">{order.delivery_address}</p>
                              </div>
                            )}
                          </div>

                          {/* Informations financières */}
                          <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                              <h4 className="text-sm font-semibold text-gray-500 mb-3">{language === 'fr' ? 'Informations financières' : 'Financial information'}</h4>
                              <div className="space-y-2">
                                {order.subtotal && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{language === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
                                    <span className="font-semibold text-gray-900">{parseFloat(order.subtotal).toFixed(2)}€</span>
                                  </div>
                                )}
                                {order.delivery_fee > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{language === 'fr' ? 'Frais de livraison' : 'Delivery fee'}</span>
                                    <span className="font-semibold text-gray-900">{parseFloat(order.delivery_fee).toFixed(2)}€</span>
                                  </div>
                                )}
                                {order.total && (
                                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <span className="text-gray-900 font-semibold">{currentTexts.amount}</span>
                                    <span className="text-lg font-bold text-gray-900">{parseFloat(order.total).toFixed(2)}€</span>
                                  </div>
                                )}
                                {order.deposit_total > 0 && (
                                  <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-600">{language === 'fr' ? 'Dépôt de garantie' : 'Deposit'}</span>
                                    <span className="font-semibold text-gray-900">{parseFloat(order.deposit_total).toFixed(2)}€</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {order.stripe_payment_intent_id && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{language === 'fr' ? 'Référence paiement' : 'Payment reference'}</h4>
                                <p className="text-gray-700 text-sm font-mono">{order.stripe_payment_intent_id.slice(0, 20)}...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          {currentTexts.page} {currentPage} {currentTexts.of} {totalPages}
                        </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {currentTexts.previous}
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {currentTexts.next}
                        </button>
                      </div>
                    </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

