'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminApiClient';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getReservationStatusUI } from '@/lib/reservationStatus';
import { CheckCircle2, XCircle, AlertCircle, Calendar, MapPin, ChevronRight, Search, X, Clock, Settings } from 'lucide-react';
import DocumentsPanel from '@/components/DocumentsPanel';
import AdjustReservationModal from '@/components/admin/AdjustReservationModal';

export default function AdminReservationsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedReservationDocuments, setSelectedReservationDocuments] = useState<{
    orders: any[];
    etatLieux: any | null;
  }>({ orders: [], etatLieux: null });
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [reservationToAdjust, setReservationToAdjust] = useState<any>(null);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationsError, setReservationsError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

  // Marquer comme "viewé" quand le modal s'ouvre
  useEffect(() => {
    // Extraire les primitives stables au début
    const reservationId = selectedReservation?.id;
    const status = selectedReservation?.status;

    // Garde-fous : si modal fermé ou données manquantes -> return
    if (!isDetailModalOpen || !reservationId || !status) {
      return;
    }

    const markAsViewed = () => {
      // Marquer selon le type
      if (status === 'PENDING' || status === 'pending') {
        const viewed = JSON.parse(localStorage.getItem('admin_viewed_reservations') || '[]');
        if (!viewed.includes(reservationId)) {
          viewed.push(reservationId);
          localStorage.setItem('admin_viewed_reservations', JSON.stringify(viewed));
        }
      } else if (status === 'CANCEL_REQUESTED' || status === 'cancel_requested') {
        const viewed = JSON.parse(localStorage.getItem('admin_viewed_cancellations') || '[]');
        if (!viewed.includes(reservationId)) {
          viewed.push(reservationId);
          localStorage.setItem('admin_viewed_cancellations', JSON.stringify(viewed));
        }
      } else if (status === 'CHANGE_REQUESTED' || status === 'change_requested') {
        const viewed = JSON.parse(localStorage.getItem('admin_viewed_modifications') || '[]');
        if (!viewed.includes(reservationId)) {
          viewed.push(reservationId);
          localStorage.setItem('admin_viewed_modifications', JSON.stringify(viewed));
        }
      }

      // Dispatcher l'événement pour mettre à jour les compteurs
      window.dispatchEvent(new Event('pendingActionsUpdated'));
    };

    markAsViewed();
  }, [isDetailModalOpen, selectedReservation?.id, selectedReservation?.status]);

  // Charger les documents pour la réservation sélectionnée via API
  useEffect(() => {
    // Extraire la primitive stable au début
    const selectedId = selectedReservation?.id;

    // Garde-fou : si id manquant -> reset et return
    if (!selectedId) {
      setSelectedReservationDocuments({ orders: [], etatLieux: null });
      return;
    }

    const loadReservationDocuments = async () => {
      try {
        const data = await adminFetch<{
          reservation: any;
          orders: any[];
          contract: { signed: boolean; signed_at: string | null };
          documents: {
            contract_url: string;
            invoice_urls: string[];
            etat_lieux_url?: string;
          };
        }>(`/api/admin/reservations/${selectedId}`);

        setSelectedReservationDocuments({
          orders: data.orders || [],
          etatLieux: data.documents?.etat_lieux_url ? { id: 'loaded' } : null, // Placeholder si URL disponible
        });
      } catch (error: unknown) {
        console.error('Erreur chargement documents:', error);
        setSelectedReservationDocuments({ orders: [], etatLieux: null });
      }
    };

    loadReservationDocuments();
  }, [selectedReservation?.id]);

  useEffect(() => {
    if (!user) return;

    const loadReservations = async () => {
      setLoadingReservations(true);
      setReservationsError(null);

      try {
        // Construire les query params
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: itemsPerPage.toString(),
        });

        if (searchQuery.trim()) {
          params.set('query', searchQuery.trim());
        }
        // Note: status, from, to peuvent être ajoutés plus tard si besoin
        // L'API attend: query, status, from, to, page, pageSize

        const data = await adminFetch<{
          data: any[];
          page: number;
          pageSize: number;
          total: number;
        }>(`/api/admin/reservations?${params.toString()}`);

        // Adapter les réservations pour compatibilité avec le rendu existant
        const adaptedReservations = (data.data || []).map((r: any) => ({
          ...r,
          // Adapter les champs pour compatibilité
          start_date: r.start_at || r.created_at,
          end_date: r.end_at || r.created_at,
          total_price: r.price_total,
          pack_id: r.pack_key,
          type: r.source === 'client_reservation' ? 'client_reservation' : 'reservation',
          customerName: r.customer_name || 'Client',
          customerEmail: r.customer_email || '',
        }));

        setReservations(adaptedReservations);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } catch (error: any) {
        console.error('❌ Erreur chargement réservations:', error);
        setReservationsError(error.message || 'Erreur lors du chargement');
        setReservations([]);
      } finally {
        setLoadingReservations(false);
      }
    };

    loadReservations();
  }, [user, currentPage, searchQuery]);

  // Double vérification de sécurité
  if (!isAdmin) {
    return null;
  }

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'CONFIRMED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPackName = (packId: string | null) => {
    if (!packId) return 'Réservation';
    const packNames: { [key: string]: string } = {
      'pack-1': 'Pack Essentiel',
      'pack-2': 'Pack Standard',
      'pack-3': 'Pack Premium',
      'pack-4': 'Pack Événement',
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage',
    };
    return packNames[packId] || `Pack ${packId}`;
  };

  const paginatedReservations = reservations;

  const texts = {
    fr: {
      title: 'Réservations',
      searchPlaceholder: 'Rechercher par client, email, statut...',
      noResults: 'Aucune réservation trouvée',
      customer: 'Client',
      dates: 'Dates',
      status: 'Statut',
      total: 'Total',
      actions: 'Actions',
      view: 'Voir',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder aux réservations.',
      signIn: 'Se connecter',
      reservationDetails: 'Détails de la réservation',
      cancelRequest: 'Demande d\'annulation',
      changeRequest: 'Demande de modification',
      validateCancel: 'Valider l\'annulation',
      validateChange: 'Valider la modification',
      rejectCancel: 'Refuser l\'annulation',
      rejectChange: 'Refuser la modification',
      reason: 'Raison',
      requestedChanges: 'Modifications demandées',
      message: 'Message',
      refundPolicy: 'Politique de remboursement',
      refundEstimate: 'Remboursement estimé',
      requestedAt: 'Demandé le',
      close: 'Fermer',
    },
    en: {
      title: 'Reservations',
      searchPlaceholder: 'Search by client, email, status...',
      noResults: 'No reservations found',
      customer: 'Client',
      dates: 'Dates',
      status: 'Status',
      total: 'Total',
      actions: 'Actions',
      view: 'View',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access reservations.',
      signIn: 'Sign in',
      reservationDetails: 'Reservation details',
      cancelRequest: 'Cancellation request',
      changeRequest: 'Change request',
      validateCancel: 'Validate cancellation',
      validateChange: 'Validate modification',
      rejectCancel: 'Reject cancellation',
      rejectChange: 'Reject modification',
      reason: 'Reason',
      requestedChanges: 'Requested changes',
      message: 'Message',
      refundPolicy: 'Refund policy',
      refundEstimate: 'Estimated refund',
      requestedAt: 'Requested on',
      close: 'Close',
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
        <div className="hidden lg:block flex-shrink-0 transition-all duration-300 w-64"></div>
        <AdminSidebar 
          language={language} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
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
              {reservations.length > 0 && (
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
                      {reservations.length} {reservations.length === 1 ? 'réservation' : 'réservations'} trouvée{reservations.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {!loadingReservations && !reservationsError && paginatedReservations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-16">
                    <Search className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                    <p className="text-gray-500 text-lg">{currentTexts.noResults}</p>
                  </CardContent>
                </Card>
              ) : !loadingReservations && !reservationsError ? (
                <>
                  <div className="space-y-4 mb-6">
                    {paginatedReservations.map((reservation) => {
                      const statusUI = getReservationStatusUI(reservation.status, language);
                      const dateRange = `${formatDate(reservation.start_date)} - ${formatDate(reservation.end_date)}`;
                      
                      // Couleurs du badge selon le statut
                      const getStatusBadgeColor = (status: string) => {
                        const upperStatus = status.toUpperCase();
                        if (upperStatus === 'CONFIRMED' || upperStatus === 'CONTRACT_SIGNED') {
                          return { bg: 'bg-green-100', dot: 'bg-green-500', text: 'text-green-800' };
                        } else if (upperStatus === 'PENDING' || upperStatus === 'CONTRACT_PENDING') {
                          return { bg: 'bg-orange-100', dot: 'bg-orange-500', text: 'text-orange-800' };
                        } else if (upperStatus === 'IN_PROGRESS' || upperStatus === 'COMPLETED') {
                          return { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-800' };
                        } else if (upperStatus === 'CANCELLED' || upperStatus === 'CANCELED') {
                          return { bg: 'bg-red-100', dot: 'bg-red-500', text: 'text-red-800' };
                        }
                        return { bg: 'bg-gray-100', dot: 'bg-gray-500', text: 'text-gray-800' };
                      };
                      
                      const badgeColors = getStatusBadgeColor(reservation.status);
                      
                      return (
                        <Card 
                          key={reservation.id} 
                          className="hover:shadow-md transition-all cursor-pointer"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Badge de statut avec point coloré */}
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className={`${badgeColors.bg} ${badgeColors.text} border-0 px-3 py-1`}>
                                    <span className={`w-2 h-2 rounded-full ${badgeColors.dot} mr-2 inline-block`}></span>
                                    {statusUI.label}
                                  </Badge>
                                </div>
                                
                                {/* Nom du client */}
                                <h3 className="font-bold text-gray-900 text-lg mb-2">
                                  {reservation.customerName || 'Client'}
                                </h3>
                                
                                {/* Email */}
                                {reservation.customerEmail && (
                                  <p className="text-sm text-gray-600 mb-3">{reservation.customerEmail}</p>
                                )}
                                
                                {/* Date avec icône calendrier */}
                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm">{dateRange}</span>
                                </div>
                                
                                {/* Lieu avec icône map pin */}
                                {reservation.address && (
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm truncate">{reservation.address}</span>
                                  </div>
                                )}
                                
                                {/* Heures de retrait et retour (si retrait sur place) */}
                                {reservation.pickup_time && reservation.return_time && (
                                  <div className="flex items-center gap-4 text-gray-600 mb-2 text-sm">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className="text-gray-600">
                                        {language === 'fr' ? 'Retrait' : 'Pickup'}: <span className="font-semibold text-gray-900">{reservation.pickup_time}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className="text-gray-600">
                                        {language === 'fr' ? 'Retour' : 'Return'}: <span className="font-semibold text-gray-900">{reservation.return_time}</span>
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Total */}
                                {(reservation.total_price || reservation.order?.total) && (
                                  <div className="text-sm font-semibold text-gray-900 mt-2">
                                    {reservation.total_price ? `${reservation.total_price}€` : `${reservation.order.total}€`}
                                  </div>
                                )}
                              </div>
                              
                              {/* Bouton circulaire orange avec chevron */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReservation(reservation);
                                  setIsDetailModalOpen(true);
                                }}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                                aria-label={currentTexts.view}
                              >
                                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
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
              ) : null}
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
      <Footer language={language} />

      {/* Modal de détails de réservation */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReservation && (
            <>
              <DialogHeader>
                <DialogTitle>{currentTexts.reservationDetails}</DialogTitle>
                <DialogDescription>
                  {selectedReservation.customerName} - {formatDate(selectedReservation.start_date)} au {formatDate(selectedReservation.end_date)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Informations générales */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">{currentTexts.customer}</label>
                    <p className="text-sm text-gray-900">{selectedReservation.customerName || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{selectedReservation.customerEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">{currentTexts.status}</label>
                    <div className="mt-1">
                      {(() => {
                        const statusUI = getReservationStatusUI(selectedReservation.status, language);
                        return (
                          <Badge 
                            variant={statusUI.badgeVariant}
                            className={statusUI.badgeClass}
                          >
                            {statusUI.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">{currentTexts.dates}</label>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedReservation.start_date)} - {formatDate(selectedReservation.end_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">{currentTexts.total}</label>
                    <p className="text-sm text-gray-900">
                      {selectedReservation.total_price ? `${selectedReservation.total_price}€` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Heures de retrait et retour (pour retrait sur place uniquement) */}
                {(() => {
                  // Vérifier si c'est un retrait sur place (NE PAS afficher pour les livraisons)
                  let isPickup = false;
                  let isDelivery = false;
                  
                  if (selectedReservation.notes) {
                    try {
                      const parsedNotes = typeof selectedReservation.notes === 'string' 
                        ? JSON.parse(selectedReservation.notes) 
                        : selectedReservation.notes;
                      
                      // Vérifier explicitement si c'est une livraison
                      const deliveryOption = parsedNotes?.deliveryOption;
                      isDelivery = deliveryOption === 'livraison' || 
                                   deliveryOption === 'paris' || 
                                   deliveryOption === 'idf' ||
                                   deliveryOption === 'delivery';
                      
                      // Vérifier si c'est un retrait sur place
                      const cartItems = parsedNotes?.cartItems || [];
                      const hasDeliveryItem = cartItems.some((item: any) => 
                        item.productId?.startsWith('delivery-') || 
                        item.metadata?.type === 'delivery'
                      );
                      
                      // C'est un retrait seulement si :
                      // 1. Ce n'est PAS une livraison
                      // 2. ET (deliveryOption est 'retrait' OU n'existe pas ET pas d'item de livraison)
                      isPickup = !isDelivery && 
                        (deliveryOption === 'retrait' || 
                         (!deliveryOption && !hasDeliveryItem));
                    } catch (e) {
                      // Ignorer les erreurs de parsing
                    }
                  }
                  
                  // Ne pas afficher si c'est une livraison ou si ce n'est pas un retrait
                  if (isDelivery || !isPickup) return null;
                  
                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {language === 'fr' ? 'Retrait sur place' : 'Pickup on site'}
                      </h3>
                      {selectedReservation.pickup_time && selectedReservation.return_time ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold text-gray-700">
                              {language === 'fr' ? 'Heure de retrait' : 'Pickup time'}
                            </label>
                            <p className="text-sm text-gray-900 mt-1">
                              {selectedReservation.pickup_time}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-700">
                              {language === 'fr' ? 'Heure de retour' : 'Return time'}
                            </label>
                            <p className="text-sm text-gray-900 mt-1">
                              {selectedReservation.return_time}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-800 font-medium">
                            {language === 'fr' 
                              ? 'Pour le retrait matériel, veuillez renseigner l\'heure de retrait et l\'heure de retour du matériel'
                              : 'For material pickup, please provide the pickup time and return time'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Demande d'annulation */}
                {selectedReservation.status === 'CANCEL_REQUESTED' && (() => {
                  let cancelRequest: any = null;
                  if (selectedReservation.notes) {
                    try {
                      const notesData = typeof selectedReservation.notes === 'string' 
                        ? JSON.parse(selectedReservation.notes) 
                        : selectedReservation.notes;
                      cancelRequest = notesData.cancelRequest;
                    } catch (e) {
                      // Ignorer
                    }
                  }

                  return cancelRequest ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {currentTexts.cancelRequest}
                      </h3>
                      <div className="space-y-2 text-sm">
                        {cancelRequest.requestedAt && (
                          <p>
                            <span className="font-semibold">{currentTexts.requestedAt}:</span>{' '}
                            {new Date(cancelRequest.requestedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        {cancelRequest.reason && (
                          <p>
                            <span className="font-semibold">{currentTexts.reason}:</span> {cancelRequest.reason}
                          </p>
                        )}
                        {cancelRequest.refundPolicyApplied && (
                          <p>
                            <span className="font-semibold">{currentTexts.refundPolicy}:</span>{' '}
                            {cancelRequest.refundPolicyApplied === 'FULL' ? 'Remboursement intégral' :
                             cancelRequest.refundPolicyApplied === 'HALF' ? 'Remboursement 50%' :
                             'Aucun remboursement'}
                          </p>
                        )}
                        {cancelRequest.refundEstimateAmount && (
                          <p>
                            <span className="font-semibold">{currentTexts.refundEstimate}:</span>{' '}
                            {cancelRequest.refundEstimateAmount}€
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={async () => {
                            setIsValidating(true);
                            try {
                              const response = await fetch(`/api/reservations/${selectedReservation.id}/validate-cancel`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'approve' })
                              });
                              if (response.ok) {
                                setIsDetailModalOpen(false);
                                // Recharger les réservations
                                window.location.reload();
                              } else {
                                alert('Erreur lors de la validation');
                              }
                            } catch (error) {
                              console.error('Erreur:', error);
                              alert('Erreur lors de la validation');
                            } finally {
                              setIsValidating(false);
                            }
                          }}
                          disabled={isValidating}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {currentTexts.validateCancel}
                        </Button>
                        <Button
                          onClick={async () => {
                            setIsValidating(true);
                            try {
                              const response = await fetch(`/api/reservations/${selectedReservation.id}/validate-cancel`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'reject' })
                              });
                              if (response.ok) {
                                setIsDetailModalOpen(false);
                                window.location.reload();
                              } else {
                                alert('Erreur lors du refus');
                              }
                            } catch (error) {
                              console.error('Erreur:', error);
                              alert('Erreur lors du refus');
                            } finally {
                              setIsValidating(false);
                            }
                          }}
                          disabled={isValidating}
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {currentTexts.rejectCancel}
                        </Button>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Demande de modification */}
                {selectedReservation.status === 'CHANGE_REQUESTED' && (() => {
                  let changeRequest: any = null;
                  if (selectedReservation.notes) {
                    try {
                      const notesData = typeof selectedReservation.notes === 'string' 
                        ? JSON.parse(selectedReservation.notes) 
                        : selectedReservation.notes;
                      changeRequest = notesData.changeRequest;
                    } catch (e) {
                      // Ignorer
                    }
                  }

                  return changeRequest ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {currentTexts.changeRequest}
                      </h3>
                      <div className="space-y-2 text-sm">
                        {changeRequest.requestedAt && (
                          <p>
                            <span className="font-semibold">{currentTexts.requestedAt}:</span>{' '}
                            {new Date(changeRequest.requestedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        {changeRequest.requestedChanges && Object.keys(changeRequest.requestedChanges).length > 0 && (
                          <div>
                            <span className="font-semibold">{currentTexts.requestedChanges}:</span>
                            <ul className="list-disc list-inside ml-2 mt-1">
                              {changeRequest.requestedChanges.nouveauLieu && (
                                <li>Nouveau lieu: {changeRequest.requestedChanges.nouveauLieu}</li>
                              )}
                              {changeRequest.requestedChanges.nouveauxHoraires && (
                                <li>Nouveaux horaires: {changeRequest.requestedChanges.nouveauxHoraires}</li>
                              )}
                            </ul>
                          </div>
                        )}
                        {changeRequest.message && (
                          <p>
                            <span className="font-semibold">{currentTexts.message}:</span> {changeRequest.message}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={async () => {
                            setIsValidating(true);
                            try {
                              const response = await fetch(`/api/reservations/${selectedReservation.id}/validate-change`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'approve' })
                              });
                              if (response.ok) {
                                setIsDetailModalOpen(false);
                                window.location.reload();
                              } else {
                                alert('Erreur lors de la validation');
                              }
                            } catch (error) {
                              console.error('Erreur:', error);
                              alert('Erreur lors de la validation');
                            } finally {
                              setIsValidating(false);
                            }
                          }}
                          disabled={isValidating}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {currentTexts.validateChange}
                        </Button>
                        <Button
                          onClick={async () => {
                            setIsValidating(true);
                            try {
                              const response = await fetch(`/api/reservations/${selectedReservation.id}/validate-change`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'reject' })
                              });
                              if (response.ok) {
                                setIsDetailModalOpen(false);
                                window.location.reload();
                              } else {
                                alert('Erreur lors du refus');
                              }
                            } catch (error) {
                              console.error('Erreur:', error);
                              alert('Erreur lors du refus');
                            } finally {
                              setIsValidating(false);
                            }
                          }}
                          disabled={isValidating}
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {currentTexts.rejectChange}
                        </Button>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Section Documents */}
                <div className="pt-4 border-t">
                  <DocumentsPanel
                    context="admin"
                    reservation={{
                      id: selectedReservation.id,
                      type: selectedReservation.start_at ? 'client_reservation' : 'reservation',
                      client_signature: selectedReservation.client_signature,
                      client_signed_at: selectedReservation.client_signed_at,
                      status: selectedReservation.status,
                    }}
                    orders={selectedReservationDocuments.orders}
                    etatLieux={selectedReservationDocuments.etatLieux}
                    language={language}
                  />
                </div>

                {/* Bouton Ajuster le pack (pour client_reservations uniquement) */}
                {selectedReservation.start_at && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => {
                        setReservationToAdjust(selectedReservation);
                        setIsAdjustModalOpen(true);
                      }}
                      className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {language === 'fr' ? 'Ajuster le pack' : 'Adjust pack'}
                    </Button>
                  </div>
                )}

                {/* Bouton fermer */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => setIsDetailModalOpen(false)}
                    variant="outline"
                  >
                    {currentTexts.close}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'ajustement */}
      <AdjustReservationModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setReservationToAdjust(null);
        }}
        reservation={reservationToAdjust}
        language={language}
        onSuccess={() => {
          // Recharger la page pour mettre à jour les données
          window.location.reload();
        }}
      />
    </div>
  );
}

