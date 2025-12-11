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

export default function AdminLivraisonsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([]);
  const [reservationsData, setReservationsData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'livraison' | 'retrait'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user || !supabase) return;

    const loadDeliveries = async () => {
      try {
        // Récupérer toutes les commandes avec delivery_option
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Récupérer les réservations associées
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('*')
          .order('start_date', { ascending: false });

        setReservationsData(reservationsData || []);

        // Créer la liste des livraisons/récupérations
        const deliveriesList: any[] = [];
        const processedReservations = new Set<string>();
        
        (ordersData || []).forEach((order) => {
          if (order.delivery_option && order.delivery_option !== 'retrait') {
            // Trouver la réservation associée
            let reservation = null;
            if (order.metadata?.reservation_id && reservationsData) {
              reservation = reservationsData.find(r => r.id === order.metadata.reservation_id);
            }

            deliveriesList.push({
              id: `livraison_${order.id}`,
              type: 'livraison',
              customer_name: order.customer_name || 'Client',
              customer_email: order.customer_email,
              customer_phone: order.customer_phone,
              address: order.delivery_address || reservation?.address || 'N/A',
              delivery_option: order.delivery_option,
              start_date: reservation?.start_date || null,
              end_date: reservation?.end_date || null,
              created_at: order.created_at,
              order: order,
            });

            // Marquer cette réservation comme traitée
            if (reservation?.id) {
              processedReservations.add(reservation.id);
            }
          }
        });

        // Pour les récupérations, on utilise la date de fin de réservation
        if (reservationsData) {
          reservationsData.forEach((reservation, index) => {
            if (reservation.address && reservation.end_date) {
              // Vérifier si on a déjà une livraison pour cette réservation
              const hasDelivery = processedReservations.has(reservation.id);

              if (!hasDelivery) {
                // Récupérer l'order associé
                let order = null;
                if (reservation.notes) {
                  try {
                    const notesData = JSON.parse(reservation.notes);
                    if (notesData.sessionId) {
                      order = ordersData?.find(o => o.stripe_session_id === notesData.sessionId);
                    }
                  } catch (e) {
                    // Ignorer
                  }
                }

                deliveriesList.push({
                  id: `recup_${reservation.id}_${index}`,
                  type: 'récupération',
                  customer_name: order?.customer_name || 'Client',
                  customer_email: order?.customer_email || '',
                  customer_phone: order?.customer_phone || '',
                  address: reservation.address,
                  delivery_option: order?.delivery_option || 'retrait',
                  start_date: reservation.start_date,
                  end_date: reservation.end_date,
                  created_at: reservation.created_at,
                  order: order,
                  reservation: reservation,
                });
              }
            }
          });
        }

        setDeliveries(deliveriesList);
        setFilteredDeliveries(deliveriesList);
      } catch (error) {
        console.error('Erreur chargement livraisons:', error);
      }
    };

    loadDeliveries();
  }, [user]);

  useEffect(() => {
    let filtered = deliveries;

    // Filtrer par type
    if (filterType !== 'all') {
      filtered = filtered.filter(d => {
        if (filterType === 'livraison') return d.type === 'livraison';
        if (filterType === 'retrait') return d.delivery_option === 'retrait';
        return true;
      });
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((delivery) => {
        return (
          delivery.customer_name?.toLowerCase().includes(query) ||
          delivery.customer_email?.toLowerCase().includes(query) ||
          delivery.address?.toLowerCase().includes(query) ||
          delivery.customer_phone?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredDeliveries(filtered);
    setCurrentPage(1);
  }, [searchQuery, filterType, deliveries]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDeliveryOptionText = (option: string) => {
    const options: { [key: string]: string } = {
      'paris': 'Paris (80€)',
      'petite_couronne': 'Petite Couronne (120€)',
      'grande_couronne': 'Grande Couronne (160€)',
      'retrait': 'Retrait sur place',
    };
    return options[option] || option;
  };

  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);

  const texts = {
    fr: {
      title: 'Livraisons & Récupérations',
      searchPlaceholder: 'Rechercher par client, adresse...',
      all: 'Toutes',
      delivery: 'Livraisons',
      pickup: 'Retraits',
      noDeliveries: 'Aucune livraison/récupération',
      type: 'Type',
      customer: 'Client',
      address: 'Adresse',
      phone: 'Téléphone',
      dates: 'Dates',
      deliveryOption: 'Option',
      status: 'Statut',
      actions: 'Actions',
      view: 'Voir',
      start: 'Commencer',
      complete: 'Terminé',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder aux livraisons.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Deliveries & Pickups',
      searchPlaceholder: 'Search by client, address...',
      all: 'All',
      delivery: 'Deliveries',
      pickup: 'Pickups',
      noDeliveries: 'No deliveries/pickups',
      type: 'Type',
      customer: 'Client',
      address: 'Address',
      phone: 'Phone',
      dates: 'Dates',
      deliveryOption: 'Option',
      status: 'Status',
      actions: 'Actions',
      view: 'View',
      start: 'Start',
      complete: 'Complete',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access deliveries.',
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
        <AdminSidebar language={language} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
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
              
              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder={currentTexts.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      filterType === 'all'
                        ? 'bg-[#F2431E] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {currentTexts.all}
                  </button>
                  <button
                    onClick={() => setFilterType('livraison')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      filterType === 'livraison'
                        ? 'bg-[#F2431E] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {currentTexts.delivery}
                  </button>
                  <button
                    onClick={() => setFilterType('retrait')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      filterType === 'retrait'
                        ? 'bg-[#F2431E] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {currentTexts.pickup}
                  </button>
                </div>
              </div>

              {paginatedDeliveries.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-lg">{currentTexts.noDeliveries}</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.type}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.customer}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.address}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.phone}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.dates}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.deliveryOption}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.status}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedDeliveries.map((delivery) => {
                            // Trouver la réservation associée
                            let reservation = delivery.reservation;
                            if (!reservation && delivery.order?.metadata?.reservation_id) {
                              reservation = reservationsData.find((r: any) => r.id === delivery.order.metadata.reservation_id);
                            }
                            // Si toujours pas trouvé, chercher par order_id dans les notes des réservations
                            if (!reservation && delivery.order?.id) {
                              reservation = reservationsData.find((r: any) => {
                                if (r.notes) {
                                  try {
                                    const notes = JSON.parse(r.notes);
                                    return notes.orderId === delivery.order.id || notes.sessionId === delivery.order.stripe_session_id;
                                  } catch (e) {
                                    return false;
                                  }
                                }
                                return false;
                              });
                            }
                            const deliveryStatus = reservation?.delivery_status || null;
                            
                            return (
                            <tr key={delivery.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  delivery.type === 'livraison'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {delivery.type === 'livraison' ? '📦 Livraison' : '↩️ Récupération'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{delivery.customer_name}</div>
                                  <div className="text-sm text-gray-500">{delivery.customer_email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">{delivery.address}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {delivery.customer_phone || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {delivery.start_date && delivery.end_date
                                  ? `${formatDate(delivery.start_date)} - ${formatDate(delivery.end_date)}`
                                  : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getDeliveryOptionText(delivery.delivery_option)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  deliveryStatus === 'termine'
                                    ? 'bg-green-100 text-green-800'
                                    : deliveryStatus === 'en_cours'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {deliveryStatus === 'termine' 
                                    ? (language === 'fr' ? '✅ Terminé' : '✅ Completed')
                                    : deliveryStatus === 'en_cours'
                                    ? (language === 'fr' ? '🔄 En cours' : '🔄 In progress')
                                    : (language === 'fr' ? '⏳ En attente' : '⏳ Pending')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {reservation && (
                                  <div className="flex gap-2">
                                    {deliveryStatus !== 'en_cours' && deliveryStatus !== 'termine' && (
                                      <button
                                        onClick={async () => {
                                          if (!supabase || !reservation) return;
                                          const { error } = await supabase
                                            .from('reservations')
                                            .update({ delivery_status: 'en_cours' })
                                            .eq('id', reservation.id);
                                          if (error) {
                                            console.error('Erreur mise à jour statut:', error);
                                            alert(language === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error');
                                          } else {
                                            window.location.reload();
                                          }
                                        }}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold"
                                      >
                                        {currentTexts.start}
                                      </button>
                                    )}
                                    {deliveryStatus === 'en_cours' && (
                                      <button
                                        onClick={async () => {
                                          if (!supabase || !reservation) return;
                                          const { error } = await supabase
                                            .from('reservations')
                                            .update({ delivery_status: 'termine' })
                                            .eq('id', reservation.id);
                                          if (error) {
                                            console.error('Erreur mise à jour statut:', error);
                                            alert(language === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error');
                                          } else {
                                            window.location.reload();
                                          }
                                        }}
                                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-semibold"
                                      >
                                        {currentTexts.complete}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )})}
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

