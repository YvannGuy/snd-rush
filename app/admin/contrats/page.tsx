'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Mail, ChevronRight, Search, X } from 'lucide-react';

export default function AdminContratsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    if (!user || !supabase) return;

    const loadContracts = async () => {
      try {
        // Récupérer toutes les réservations signées
        const { data: reservationsData, error } = await supabase
          .from('reservations')
          .select('*')
          .not('client_signature', 'is', null)
          .order('client_signed_at', { ascending: false });

        if (error) throw error;

        // Enrichir avec les informations des orders
        const { data: allOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        const enrichedContracts = (reservationsData || []).map((reservation) => {
          let customerName = 'Client';
          let customerEmail = '';
          let order = null;

          // Chercher l'order associé
          if (reservation.notes) {
            try {
              const notesData = JSON.parse(reservation.notes);
              if (notesData.sessionId && allOrders) {
                order = allOrders.find((o: any) => o.stripe_session_id === notesData.sessionId);
              }
              if (notesData.customerName) customerName = notesData.customerName;
              if (notesData.customerEmail) customerEmail = notesData.customerEmail;
            } catch (e) {
              // Ignorer
            }
          }

          if (order) {
            customerName = order.customer_name || customerName;
            customerEmail = order.customer_email || customerEmail;
          }

          return {
            ...reservation,
            customerName,
            customerEmail,
            order,
          };
        });

        setContracts(enrichedContracts);
        setFilteredContracts(enrichedContracts);
      } catch (error) {
        console.error('Erreur chargement contrats:', error);
      }
    };

    loadContracts();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContracts(contracts);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contracts.filter((contract) => {
      return (
        contract.customerName?.toLowerCase().includes(query) ||
        contract.customerEmail?.toLowerCase().includes(query) ||
        contract.id.toLowerCase().includes(query) ||
        contract.address?.toLowerCase().includes(query)
      );
    });
    setFilteredContracts(filtered);
    setCurrentPage(1);
  }, [searchQuery, contracts]);

  // Charger l'état de la sidebar depuis localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === 'true');
    }
  }, []);

  // Sauvegarder l'état de la sidebar dans localStorage
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);

  const texts = {
    fr: {
      title: 'Contrats',
      searchPlaceholder: 'Rechercher un contrat...',
      noContracts: 'Aucun contrat',
      customer: 'Client',
      dates: 'Dates',
      signedAt: 'Signé le',
      actions: 'Actions',
      download: 'Télécharger',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder aux contrats.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Contracts',
      searchPlaceholder: 'Search a contract...',
      noContracts: 'No contracts',
      customer: 'Client',
      dates: 'Dates',
      signedAt: 'Signed on',
      actions: 'Actions',
      download: 'Download',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access contracts.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
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
        <AdminSidebar 
          language={language} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">{currentTexts.title}</h1>

              {/* Barre de recherche */}
              {contracts.length > 0 && (
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={currentTexts.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-10 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="mt-2 text-sm text-gray-600">
                      {filteredContracts.length} {filteredContracts.length === 1 ? 'contrat' : 'contrats'} trouvé{filteredContracts.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {paginatedContracts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-16">
                    <p className="text-gray-500 text-lg">{currentTexts.noContracts}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {paginatedContracts.map((contract) => {
                      const dateRange = `${formatDate(contract.start_date)} - ${formatDate(contract.end_date)}`;
                      
                      return (
                        <Card key={contract.id} className="hover:shadow-md transition-all">
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Nom du client */}
                                <h3 className="font-bold text-gray-900 text-lg mb-2">
                                  {contract.customerName || 'Client'}
                                </h3>
                                
                                {/* Email */}
                                {contract.customerEmail && (
                                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm truncate">{contract.customerEmail}</span>
                                  </div>
                                )}
                                
                                {/* Dates avec icône calendrier */}
                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm">{dateRange}</span>
                                </div>
                                
                                {/* Date de signature */}
                                {contract.client_signed_at && (
                                  <div className="text-sm text-gray-600 mt-2">
                                    {currentTexts.signedAt}: {formatDate(contract.client_signed_at)}
                                  </div>
                                )}
                              </div>
                              
                              {/* Bouton télécharger */}
                              <a
                                href={`/api/contract/download?reservationId=${contract.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-4 py-2 bg-[#F2431E] hover:bg-[#E63A1A] text-white rounded-lg font-semibold transition-colors flex items-center gap-2 flex-shrink-0"
                              >
                                <Download className="w-4 h-4" />
                                {currentTexts.download}
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Page {currentPage} sur {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                        >
                          Suivant
                        </Button>
                      </div>
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

