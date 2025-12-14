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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
        const orderToReservationMap: Record<string, string> = {};
        const stripeSessionIds = data?.map((o: any) => o.stripe_session_id).filter(Boolean) || [];
        
        // Charger les réservations qui ont un sessionId correspondant
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
            
            // 1. Vérifier si reservation_id existe directement
            if (order.reservation_id) {
              foundReservationId = order.reservation_id;
            }
            // 2. Chercher via stripe_session_id dans les réservations
            else if (order.stripe_session_id && reservationsBySessionId[order.stripe_session_id]) {
              foundReservationId = reservationsBySessionId[order.stripe_session_id];
            }
            // 3. Vérifier dans metadata
            else if (order.metadata) {
              try {
                const metadata = typeof order.metadata === 'string' 
                  ? JSON.parse(order.metadata) 
                  : order.metadata;
                
                // Chercher directement dans metadata
                if (metadata.reservationId) {
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
                    if (sessionMeta.reservationId) {
                      foundReservationId = sessionMeta.reservationId;
                    }
                    
                    // Debug: log pour voir le contenu de sessionMetadata
                    if (process.env.NODE_ENV === 'development') {
                      console.log('sessionMetadata content:', {
                        orderId: order.id,
                        sessionMetaKeys: Object.keys(sessionMeta),
                        hasReservationId: !!sessionMeta.reservationId,
                        fullSessionMeta: JSON.stringify(sessionMeta, null, 2)
                      });
                    }
                  }
                }
              } catch (e) {
                // Metadata n'est pas du JSON valide, ignorer
                console.error('Erreur parsing metadata order:', order.id, e);
              }
            }
            
            if (foundReservationId) {
              if (!reservationIds.includes(foundReservationId)) {
                reservationIds.push(foundReservationId);
              }
              orderToReservationMap[order.id] = foundReservationId;
            }
          });
        }

        // Stocker le mapping order -> reservation
        setOrderToReservationMap(orderToReservationMap);

        // Charger les réservations trouvées
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
                    <div className="mb-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{currentTexts.invoice}</TableHead>
                            <TableHead>{currentTexts.date}</TableHead>
                            <TableHead>{currentTexts.amount}</TableHead>
                            <TableHead>{currentTexts.status}</TableHead>
                            <TableHead className="text-right">{language === 'fr' ? 'Action' : 'Action'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedOrders.map((order) => {
                            const orderNumber = order.id.slice(0, 8).toUpperCase();
                            const isPaid = order.status === 'PAID';
                            const isPending = order.status === 'PENDING';
                            const isCancelled = order.status === 'CANCELLED';
                            const isRefunded = order.status === 'REFUNDED';
                            
                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-semibold">
                                  #{orderNumber}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {formatDate(order.created_at)}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold">
                                  <span className="text-gray-900">{parseFloat(order.total || 0).toFixed(2)}€</span>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={isPaid ? 'default' : isPending ? 'secondary' : 'outline'}
                                    className={
                                      isPaid
                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                        : isPending
                                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                        : isCancelled
                                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                        : isRefunded
                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                    }
                                  >
                                    {getStatusText(order.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
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
                                    title={language === 'fr' ? 'Télécharger la facture' : 'Download invoice'}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
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

