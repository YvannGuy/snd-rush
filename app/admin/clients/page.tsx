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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{currentTexts.title}</h1>
              
              <div className="mb-4">
                <input
                  type="text"
                  placeholder={currentTexts.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                />
              </div>

              {paginatedClients.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-lg">{currentTexts.noClients}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.name}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.email}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.phone}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.reservations}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.totalSpent}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedClients.map((client, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.reservations}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.totalSpent.toLocaleString('fr-FR')}€</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/admin/clients/${encodeURIComponent(client.email)}`}
                                className="text-[#F2431E] hover:text-[#E63A1A]"
                              >
                                {currentTexts.view}
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

