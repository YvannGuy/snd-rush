'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/hooks/useUser';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import SignModal from '@/components/auth/SignModal';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// Icônes lucide-react
import { 
  Search, 
  X, 
  FileText, 
  Download,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

export default function MesFacturesPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [reservationsMap, setReservationsMap] = useState<Record<string, any>>({});
  const [orderToReservationMap, setOrderToReservationMap] = useState<Record<string, string>>({});
  const [orderToClientReservationMap, setOrderToClientReservationMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const itemsPerPage = 2;
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();

  // Rediriger vers l'accueil si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (loading) return; // Attendre que le chargement soit terminé
    
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  // Marquer les factures comme consultées quand la page est visitée
  useEffect(() => {
    if (!user || !supabase || typeof window === 'undefined') return;
    
    const markAsViewed = async () => {
      try {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id')
          .eq('customer_email', user.email);
        
        if (ordersData && ordersData.length > 0) {
          const viewedIds = ordersData.map(o => o.id);
          localStorage.setItem('viewed_invoices', JSON.stringify(viewedIds));
          // Dispatcher un événement pour mettre à jour les compteurs du dashboard
          window.dispatchEvent(new CustomEvent('pendingActionsUpdated'));
        }
      } catch (error) {
        console.error('Erreur marquage factures comme consultées:', error);
      }
    };
    
    markAsViewed();
  }, [user, supabase]);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadOrders = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      try {
        // Charger les orders
        const { data, error } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
        setFilteredOrders(data || []);

        // Extraire les IDs de réservation depuis les orders
        const reservationIds: string[] = [];
        const clientReservationIds: string[] = [];
        const orderToReservationMap: Record<string, string> = {};
        const orderToClientReservationMap: Record<string, string> = {};
        const stripeSessionIds = data?.map((o: any) => o.stripe_session_id).filter(Boolean) || [];
        
        // Charger les réservations qui ont un sessionId correspondant (ancienne table)
        let reservationsBySessionId: Record<string, any> = {};
        if (stripeSessionIds.length > 0) {
          const { data: reservationsWithSession } = await supabaseClient
            .from('reservations')
            .select('id, notes, created_at')
            .eq('user_id', user.id);
          
          if (reservationsWithSession) {
            reservationsWithSession.forEach((r: any) => {
              try {
                const notes = typeof r.notes === 'string' ? JSON.parse(r.notes) : r.notes;
                if (notes && notes.sessionId && stripeSessionIds.includes(notes.sessionId)) {
                  reservationsBySessionId[notes.sessionId] = r.id;
                }
              } catch (e) {
                // Ignorer
              }
            });
          }
        }
        
        if (data && data.length > 0) {
          data.forEach((order: any) => {
            let foundReservationId: string | null = null;
            let foundClientReservationId: string | null = null;
            
            // PRIORITÉ 1: client_reservation_id (nouveau champ, lien direct)
            if (order.client_reservation_id) {
              foundClientReservationId = order.client_reservation_id;
            }
            // PRIORITÉ 2: reservation_id (ancien champ)
            else if (order.reservation_id) {
              foundReservationId = order.reservation_id;
            }
            // PRIORITÉ 3: Chercher via stripe_session_id dans les réservations (ancienne table)
            else if (order.stripe_session_id && reservationsBySessionId[order.stripe_session_id]) {
              foundReservationId = reservationsBySessionId[order.stripe_session_id];
            }
            // PRIORITÉ 4: Vérifier dans metadata
            else if (order.metadata) {
              try {
                const metadata = typeof order.metadata === 'string' 
                  ? JSON.parse(order.metadata) 
                  : order.metadata;
                
                // Chercher directement dans metadata
                if (metadata.reservation_id) {
                  // Vérifier si c'est une client_reservation ou une ancienne reservation
                  // En vérifiant dans client_reservations d'abord
                  foundClientReservationId = metadata.reservation_id;
                } else if (metadata.reservationId) {
                  foundReservationId = metadata.reservationId;
                }
                // Chercher dans sessionMetadata (métadonnées de la session Stripe)
                else if (metadata.sessionMetadata) {
                  let sessionMeta = metadata.sessionMetadata;
                  
                  // Si sessionMetadata est une string, la parser
                  if (typeof sessionMeta === 'string') {
                    try {
                      sessionMeta = JSON.parse(sessionMeta);
                    } catch (e) {
                      // Ignorer si ce n'est pas du JSON
                    }
                  }
                  
                  // Chercher reservationId dans sessionMetadata
                  if (sessionMeta) {
                    // Vérifier directement
                    if (sessionMeta.reservation_id) {
                      foundClientReservationId = sessionMeta.reservation_id;
                    } else if (sessionMeta.reservationId) {
                      foundReservationId = sessionMeta.reservationId;
                    }
                  }
                }
              } catch (e) {
                // Metadata n'est pas du JSON valide, ignorer
                console.error('Erreur parsing metadata order:', order.id, e);
              }
            }
            
            if (foundClientReservationId) {
              if (!clientReservationIds.includes(foundClientReservationId)) {
                clientReservationIds.push(foundClientReservationId);
              }
              orderToClientReservationMap[order.id] = foundClientReservationId;
            } else if (foundReservationId) {
              if (!reservationIds.includes(foundReservationId)) {
                reservationIds.push(foundReservationId);
              }
              orderToReservationMap[order.id] = foundReservationId;
            }
          });
        }

        // Stocker les mappings order -> reservation
        setOrderToReservationMap(orderToReservationMap);
        setOrderToClientReservationMap(orderToClientReservationMap);

        // Charger les réservations trouvées (ancienne table)
        if (reservationIds.length > 0) {
          const { data: reservationsData } = await supabaseClient
            .from('reservations')
            .select('id, start_date, end_date, created_at')
            .in('id', reservationIds)
            .eq('user_id', user.id);

          if (reservationsData) {
            const map: Record<string, any> = {};
            reservationsData.forEach((r: any) => {
              map[r.id] = r;
            });
            setReservationsMap(map);
          }
        }

        // Charger les client_reservations trouvées (nouvelle table)
        if (clientReservationIds.length > 0) {
          const { data: clientReservationsData } = await supabaseClient
            .from('client_reservations')
            .select('id, start_at, end_at, created_at')
            .in('id', clientReservationIds)
            .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`);

          if (clientReservationsData) {
            const map: Record<string, any> = {};
            clientReservationsData.forEach((cr: any) => {
              // Adapter les champs pour compatibilité avec l'affichage
              map[cr.id] = {
                id: cr.id,
                start_date: cr.start_at,
                end_date: cr.end_at,
                created_at: cr.created_at,
                type: 'client_reservation',
              };
            });
            // Fusionner avec les réservations existantes
            setReservationsMap((prev) => ({ ...prev, ...map }));
          }
        }
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

  // Fonction pour formater la date au format court
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Fonction pour obtenir les couleurs du badge selon le statut
  const getStatusBadgeColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'PAID') {
      return { bg: 'bg-green-100', dot: 'bg-green-500', text: 'text-green-800' };
    } else if (upperStatus === 'PENDING') {
      return { bg: 'bg-orange-100', dot: 'bg-orange-500', text: 'text-orange-800' };
    } else if (upperStatus === 'REFUNDED') {
      return { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-800' };
    } else if (upperStatus === 'CANCELLED') {
      return { bg: 'bg-red-100', dot: 'bg-red-500', text: 'text-red-800' };
    }
    return { bg: 'bg-gray-100', dot: 'bg-gray-500', text: 'text-gray-800' };
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
      <DashboardSidebar 
        language={language} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      <main className={`flex-1 overflow-y-auto w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">♪</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SoundRush</span>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">{currentTexts.title}</h1>

          {/* Barre de recherche */}
          {orders.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={language === 'fr' ? 'Rechercher par date, prix, numéro, statut, client...' : 'Search by date, price, number, status, customer...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 h-11"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
            <Card>
              <CardContent className="text-center py-16">
                <Search className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <CardTitle className="text-xl mb-2">{language === 'fr' ? 'Aucun résultat trouvé' : 'No results found'}</CardTitle>
                <CardDescription className="mb-8">{language === 'fr' ? 'Essayez avec d\'autres mots-clés' : 'Try with different keywords'}</CardDescription>
                <Button
                  onClick={() => setSearchQuery('')}
                  className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                >
                  {language === 'fr' ? 'Effacer la recherche' : 'Clear search'}
                </Button>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <CardTitle className="text-xl mb-2">{currentTexts.empty}</CardTitle>
                <CardDescription>{currentTexts.emptyDescription}</CardDescription>
              </CardContent>
            </Card>
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
                    <div className="space-y-4 mb-6">
                      {paginatedOrders.map((order) => {
                        const orderNumber = order.id.slice(0, 8).toUpperCase();
                        const invoiceDate = formatDateShort(order.created_at);
                        const amount = parseFloat(order.total || 0).toFixed(2);
                        const badgeColors = getStatusBadgeColor(order.status);
                        
                        return (
                          <Card 
                            key={order.id} 
                            className="hover:shadow-md transition-all"
                          >
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  {/* Badge de statut avec point coloré */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge className={`${badgeColors.bg} ${badgeColors.text} border-0 px-3 py-1`}>
                                      <span className={`w-2 h-2 rounded-full ${badgeColors.dot} mr-2 inline-block`}></span>
                                      {getStatusText(order.status)}
                                    </Badge>
                                  </div>
                                  
                                  {/* Titre de la facture */}
                                  <h3 className="font-bold text-gray-900 text-lg mb-3">
                                    {language === 'fr' ? 'Facture' : 'Invoice'} #{orderNumber}
                                  </h3>
                                  
                                  {/* Date */}
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm">{invoiceDate}</span>
                                  </div>
                                  
                                  {/* Montant */}
                                  <div className="flex items-center gap-2 text-gray-900 mb-2">
                                    <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm font-semibold">{amount}€</span>
                                  </div>
                                  
                                  {/* Lien vers la réservation si associée */}
                                  {(orderToClientReservationMap[order.id] || orderToReservationMap[order.id]) && (
                                    <div className="mt-2">
                                      <Link
                                        href={orderToClientReservationMap[order.id]
                                          ? `/mes-reservations`
                                          : `/mes-reservations/${orderToReservationMap[order.id]}`}
                                        className="text-sm text-[#F2431E] hover:underline flex items-center gap-1"
                                      >
                                        <Calendar className="w-3 h-3" />
                                        {language === 'fr' ? 'Voir la réservation' : 'View reservation'}
                                      </Link>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Bouton télécharger */}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const response = await fetch(`/api/invoice/download?orderId=${order.id}`);
                                      if (response.ok) {
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `facture-${orderNumber}.pdf`;
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
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                                  title={language === 'fr' ? 'Télécharger la facture' : 'Download invoice'}
                                >
                                  <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
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
                          {currentTexts.page} {currentPage} {currentTexts.of} {totalPages}
                        </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      {currentTexts.previous}
                    </Button>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                    >
                      {currentTexts.next}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
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
      <Footer language={language} />
    </div>
  );
}

