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
import { Search, X, Mail, Phone, User as UserIcon, ChevronRight } from 'lucide-react';

export default function AdminClientsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!user || !supabase) return;

    const loadClients = async () => {
      try {
        // Récupérer tous les orders pour extraire les clients uniques
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('customer_email, customer_name, customer_phone, total, created_at')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Grouper par email pour créer la liste des clients
        const clientsMap = new Map();
        (ordersData || []).forEach((order: any) => {
          if (order.customer_email) {
            if (!clientsMap.has(order.customer_email)) {
              clientsMap.set(order.customer_email, {
                email: order.customer_email,
                name: order.customer_name || 'Client',
                phone: order.customer_phone || '',
                totalSpent: 0,
                reservations: 0,
                lastOrder: order.created_at,
              });
            }
            const client = clientsMap.get(order.customer_email);
            client.totalSpent += parseFloat(order.total || 0);
            client.reservations += 1;
            if (new Date(order.created_at) > new Date(client.lastOrder)) {
              client.lastOrder = order.created_at;
            }
          }
        });

        const clientsList = Array.from(clientsMap.values());
        setClients(clientsList);
        setFilteredClients(clientsList);
      } catch (error) {
        console.error('Erreur chargement clients:', error);
      }
    };

    loadClients();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter((client) => {
      return (
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query)
      );
    });
    setFilteredClients(filtered);
    setCurrentPage(1);
  }, [searchQuery, clients]);

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const texts = {
    fr: {
      title: 'Clients',
      searchPlaceholder: 'Rechercher un client...',
      noClients: 'Aucun client',
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      reservations: 'Réservations',
      totalSpent: 'Total dépensé',
      lastOrder: 'Dernière commande',
      actions: 'Actions',
      view: 'Voir',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder aux clients.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Clients',
      searchPlaceholder: 'Search a client...',
      noClients: 'No clients',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      reservations: 'Reservations',
      totalSpent: 'Total spent',
      lastOrder: 'Last order',
      actions: 'Actions',
      view: 'View',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access clients.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

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
              {clients.length > 0 && (
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
                      {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'} trouvé{filteredClients.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {paginatedClients.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-16">
                    <UserIcon className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                    <p className="text-gray-500 text-lg">{currentTexts.noClients}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {paginatedClients.map((client, index) => (
                      <Card 
                        key={index} 
                        className="hover:shadow-md transition-all cursor-pointer"
                        onClick={() => router.push(`/admin/clients/${encodeURIComponent(client.email)}`)}
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Nom du client */}
                              <h3 className="font-bold text-gray-900 text-lg mb-3">
                                {client.name}
                              </h3>
                              
                              {/* Email avec icône */}
                              <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm truncate">{client.email}</span>
                              </div>
                              
                              {/* Téléphone avec icône */}
                              {client.phone && (
                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm">{client.phone}</span>
                                </div>
                              )}
                              
                              {/* Stats */}
                              <div className="flex gap-4 mt-3 text-sm">
                                <div>
                                  <span className="text-gray-500">{currentTexts.reservations}: </span>
                                  <span className="font-semibold text-gray-900">{client.reservations}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">{currentTexts.totalSpent}: </span>
                                  <span className="font-semibold text-gray-900">{client.totalSpent.toLocaleString('fr-FR')}€</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Bouton circulaire orange avec chevron */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/clients/${encodeURIComponent(client.email)}`);
                              }}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                              aria-label={currentTexts.view}
                            >
                              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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

