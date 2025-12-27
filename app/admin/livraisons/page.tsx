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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Phone, Package, Truck, ChevronRight } from 'lucide-react';

export default function AdminLivraisonsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([]);
  const [reservationsData, setReservationsData] = useState<any[]>([]);
  const [clientReservationsData, setClientReservationsData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'livraison' | 'retrait'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

    // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

useEffect(() => {
    if (!user || !supabase) return;

    const loadDeliveries = async () => {
      if (!supabase) return;
      try {
        // Récupérer toutes les commandes avec delivery_option
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Récupérer les réservations associées (ancienne table)
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('*')
          .order('start_date', { ascending: false });

        // Récupérer les client_reservations (nouvelle table) avec l'adresse de l'événement
        const { data: clientReservationsData } = await supabase
          .from('client_reservations')
          .select('*')
          .order('start_at', { ascending: false });

        setReservationsData(reservationsData || []);
        setClientReservationsData(clientReservationsData || []);

        // Créer la liste des livraisons/récupérations
        const deliveriesList: any[] = [];
        const processedReservations = new Set<string>();
        
        (ordersData || []).forEach((order) => {
          if (order.delivery_option && order.delivery_option !== 'retrait') {
            // Trouver la réservation associée (ancienne table)
            let reservation = null;
            if (order.metadata?.reservation_id && reservationsData) {
              reservation = reservationsData.find(r => r.id === order.metadata.reservation_id);
            }

            // Trouver la client_reservation associée (nouvelle table) - priorité sur l'adresse de l'événement
            let clientReservation = null;
            if (order.metadata?.client_reservation_id && clientReservationsData) {
              clientReservation = clientReservationsData.find(cr => cr.id === order.metadata.client_reservation_id);
            } else if (order.customer_email && clientReservationsData) {
              // Essayer de trouver par email si pas d'ID direct
              clientReservation = clientReservationsData.find(cr => 
                cr.customer_email?.toLowerCase() === order.customer_email?.toLowerCase()
              );
            }

            // Prioriser l'adresse de l'événement depuis client_reservations
            const eventAddress = clientReservation?.address || 
                                 order.delivery_address || 
                                 reservation?.address || 
                                 'N/A';

            deliveriesList.push({
              id: `livraison_${order.id}`,
              type: 'livraison',
              customer_name: clientReservation?.customer_name || order.customer_name || 'Client',
              customer_email: clientReservation?.customer_email || order.customer_email,
              customer_phone: clientReservation?.customer_phone || order.customer_phone,
              address: eventAddress,
              delivery_option: order.delivery_option,
              start_date: clientReservation?.start_at || reservation?.start_date || null,
              end_date: clientReservation?.end_at || reservation?.end_date || null,
              created_at: order.created_at,
              order: order,
              clientReservation: clientReservation,
            });

            // Marquer cette réservation comme traitée
            if (reservation?.id) {
              processedReservations.add(reservation.id);
            }
            if (clientReservation?.id) {
              processedReservations.add(`client_${clientReservation.id}`);
            }
          }
        });

        // Pour les récupérations, on utilise la date de fin de réservation
        // D'abord les client_reservations (nouvelle table)
        if (clientReservationsData) {
          clientReservationsData.forEach((clientReservation, index) => {
            if (clientReservation.address && clientReservation.end_at) {
              // Vérifier si on a déjà une livraison pour cette réservation
              const hasDelivery = processedReservations.has(`client_${clientReservation.id}`);

              if (!hasDelivery) {
                // Récupérer l'order associé
                let order = null;
                if (clientReservation.source === 'direct_solution' && ordersData) {
                  // Chercher l'order par email ou ID
                  order = ordersData.find(o => 
                    o.customer_email?.toLowerCase() === clientReservation.customer_email?.toLowerCase() ||
                    o.metadata?.client_reservation_id === clientReservation.id
                  );
                }

                deliveriesList.push({
                  id: `recup_client_${clientReservation.id}_${index}`,
                  type: 'récupération',
                  customer_name: clientReservation.customer_name || order?.customer_name || 'Client',
                  customer_email: clientReservation.customer_email || order?.customer_email || '',
                  customer_phone: clientReservation.customer_phone || order?.customer_phone || '',
                  address: clientReservation.address,
                  delivery_option: order?.delivery_option || 'retrait',
                  start_date: clientReservation.start_at,
                  end_date: clientReservation.end_at,
                  created_at: clientReservation.created_at,
                  order: order,
                  clientReservation: clientReservation,
                });
              }
            }
          });
        }

        // Ensuite les réservations (ancienne table)
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
      
  // Double vérification de sécurité
  if (!isAdmin) {
    return null;
  }

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
                <Card>
                  <CardContent className="text-center py-16">
                    <Truck className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                    <p className="text-gray-500 text-lg">{currentTexts.noDeliveries}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {paginatedDeliveries.map((delivery) => {
                      // Trouver la réservation associée (ancienne table)
                      let reservation = delivery.reservation;
                      if (!reservation && delivery.order?.metadata?.reservation_id) {
                        reservation = reservationsData.find((r: any) => r.id === delivery.order.metadata.reservation_id);
                      }
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
                      
                      // Trouver la client_reservation associée (nouvelle table)
                      let clientReservation = delivery.clientReservation;
                      if (!clientReservation && delivery.order?.metadata?.client_reservation_id && clientReservationsData) {
                        clientReservation = clientReservationsData.find((cr: any) => cr.id === delivery.order.metadata.client_reservation_id);
                      }
                      
                      // Prioriser le statut depuis client_reservation si disponible
                      const deliveryStatus = clientReservation?.delivery_status || reservation?.delivery_status || null;
                      
                      const getStatusBadgeColor = (status: string | null) => {
                        if (status === 'termine') {
                          return { bg: 'bg-green-100', dot: 'bg-green-500', text: 'text-green-800' };
                        } else if (status === 'en_cours') {
                          return { bg: 'bg-yellow-100', dot: 'bg-yellow-500', text: 'text-yellow-800' };
                        }
                        return { bg: 'bg-gray-100', dot: 'bg-gray-500', text: 'text-gray-800' };
                      };
                      
                      const statusColors = getStatusBadgeColor(deliveryStatus);
                      const statusText = deliveryStatus === 'termine' 
                        ? (language === 'fr' ? 'Terminé' : 'Completed')
                        : deliveryStatus === 'en_cours'
                        ? (language === 'fr' ? 'En cours' : 'In progress')
                        : (language === 'fr' ? 'En attente' : 'Pending');
                      
                      const dateRange = delivery.start_date && delivery.end_date
                        ? `${formatDate(delivery.start_date)} - ${formatDate(delivery.end_date)}`
                        : 'N/A';
                      
                      return (
                        <Card 
                          key={delivery.id} 
                          className="hover:shadow-md transition-all cursor-pointer"
                          onClick={() => {
                            // Marquer comme "viewé" si c'est une livraison en cours
                            if (reservation && reservation.id && deliveryStatus && deliveryStatus !== 'termine') {
                              const viewed = JSON.parse(localStorage.getItem('admin_viewed_deliveries') || '[]');
                              if (!viewed.includes(reservation.id)) {
                                viewed.push(reservation.id);
                                localStorage.setItem('admin_viewed_deliveries', JSON.stringify(viewed));
                                window.dispatchEvent(new CustomEvent('pendingActionsUpdated'));
                              }
                            }
                          }}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Type et statut */}
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className={`${delivery.type === 'livraison' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} border-0 px-3 py-1`}>
                                    {delivery.type === 'livraison' ? (
                                      <><Package className="w-3 h-3 mr-1 inline" /> Livraison</>
                                    ) : (
                                      <><Truck className="w-3 h-3 mr-1 inline" /> Récupération</>
                                    )}
                                  </Badge>
                                  <Badge className={`${statusColors.bg} ${statusColors.text} border-0 px-3 py-1`}>
                                    <span className={`w-2 h-2 rounded-full ${statusColors.dot} mr-2 inline-block`}></span>
                                    {statusText}
                                  </Badge>
                                </div>
                                
                                {/* Nom du client */}
                                <h3 className="font-bold text-gray-900 text-lg mb-2">
                                  {delivery.customer_name}
                                </h3>
                                
                                {/* Email */}
                                {delivery.customer_email && (
                                  <p className="text-sm text-gray-600 mb-3">{delivery.customer_email}</p>
                                )}
                                
                                {/* Adresse */}
                                {delivery.address && (
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm truncate">{delivery.address}</span>
                                  </div>
                                )}
                                
                                {/* Téléphone */}
                                {delivery.customer_phone && (
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm">{delivery.customer_phone}</span>
                                  </div>
                                )}
                                
                                {/* Dates */}
                                {dateRange !== 'N/A' && (
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm">{dateRange}</span>
                                  </div>
                                )}
                                
                                {/* Option de livraison */}
                                {delivery.delivery_option && (
                                  <div className="text-sm text-gray-600 mt-2">
                                    {getDeliveryOptionText(delivery.delivery_option)}
                                  </div>
                                )}
                              </div>
                              
                              {/* Actions */}
                              {reservation && (
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                  {deliveryStatus !== 'en_cours' && deliveryStatus !== 'termine' && (
                                    <Button
                                      onClick={async () => {
                                        if (!supabase || !reservation) return;
                                        const { error } = await supabase
                                          .from('reservations')
                                          .update({ delivery_status: 'en_cours' })
                                          .eq('id', reservation.id);
                                        if (error) {
                                          alert(language === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error');
                                        } else {
                                          window.location.reload();
                                        }
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                                    >
                                      {currentTexts.start}
                                    </Button>
                                  )}
                                  {deliveryStatus === 'en_cours' && (
                                    <Button
                                      onClick={async () => {
                                        if (!supabase || !reservation) return;
                                        const { error } = await supabase
                                          .from('reservations')
                                          .update({ delivery_status: 'termine' })
                                          .eq('id', reservation.id);
                                        if (error) {
                                          alert(language === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error');
                                        } else {
                                          window.location.reload();
                                        }
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                                    >
                                      {currentTexts.complete}
                                    </Button>
                                  )}
                                </div>
                              )}
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

