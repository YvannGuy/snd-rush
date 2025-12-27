'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/hooks/useUser';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// Icônes lucide-react
import { 
  Search, 
  X, 
  Calendar, 
  MapPin, 
  ClipboardList, 
  Download, 
  FilePenLine,
  CheckCircle2,
  Package,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Music,
  Eye,
  Clock,
  Menu,
  XCircle,
  Edit,
  Truck,
  Headphones
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PACKS } from '@/lib/packs';
import { getCatalogItemById } from '@/lib/catalog';
import CancelRequestModal from '@/components/reservations/CancelRequestModal';
import ChangeRequestModal from '@/components/reservations/ChangeRequestModal';
import { getReservationStatusUI, shouldShowActionButtons } from '@/lib/reservationStatus';

export default function MesReservationsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [reservationForAction, setReservationForAction] = useState<any | null>(null);
  const [pickupTime, setPickupTime] = useState<string>('');
  const [returnTime, setReturnTime] = useState<string>('');
  const [isSavingTimes, setIsSavingTimes] = useState(false);

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

    const loadReservations = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      try {
        // Charger toutes les réservations sauf PENDING (inclure CANCELLED pour l'historique)
        const { data: reservationsData, error: reservationsError } = await supabaseClient
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .not('status', 'eq', 'PENDING')
          .not('status', 'eq', 'pending')
          // Ne plus filtrer CANCELLED pour afficher toutes les réservations dans l'historique
          .order('created_at', { ascending: false });

        if (reservationsError) {
          throw reservationsError;
        }

        // Charger aussi les client_reservations avec statut PAID ou CONFIRMED
        const { data: clientReservationsData, error: clientReservationsError } = await supabaseClient
          .from('client_reservations')
          .select('*')
          .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
          .in('status', ['PAID', 'CONFIRMED', 'paid', 'confirmed'])
          .order('created_at', { ascending: false });

        if (clientReservationsError) {
          console.error('Erreur chargement client_reservations:', clientReservationsError);
        }

        // Combiner les deux listes en adaptant les client_reservations au format des réservations
        const adaptedClientReservations = (clientReservationsData || []).map(cr => ({
          ...cr,
          // Adapter les champs pour compatibilité
          start_date: cr.start_at || cr.created_at,
          end_date: cr.end_at || cr.created_at,
          total_price: cr.price_total,
          pack_id: cr.pack_key,
          type: 'client_reservation', // Marqueur pour identifier les nouvelles réservations
        }));

        const allReservations = [
          ...(reservationsData || []),
          ...adaptedClientReservations
        ].sort((a, b) => {
          const dateA = new Date(a.created_at || a.start_date).getTime();
          const dateB = new Date(b.created_at || b.start_date).getTime();
          return dateB - dateA; // Plus récent en premier
        });
        
        setReservations(allReservations);
        setFilteredReservations(allReservations);
      } catch (error) {
        console.error('Erreur chargement réservations:', error);
      }
    };

    loadReservations();
  }, [user]);

  // Marquer les réservations avec contrats à signer comme "viewées" quand on visite la page
  useEffect(() => {
    if (!reservations.length) return;

    const reservationsWithContractsToSign = reservations.filter(
      (r) => {
        const status = r.status?.toUpperCase();
        const isConfirmed = status === 'CONFIRMED' || status === 'CONTRACT_PENDING' || status === 'CONFIRMED';
        const isNotSigned = !r.client_signature || r.client_signature.trim() === '';
        // Pour client_reservations, vérifier aussi CONFIRMED ou AWAITING_BALANCE
        const isClientReservationConfirmed = r.type === 'client_reservation' && 
          (status === 'CONFIRMED' || status === 'AWAITING_BALANCE');
        return (isConfirmed || isClientReservationConfirmed) && isNotSigned;
      }
    );

    if (reservationsWithContractsToSign.length > 0) {
      const viewedReservationsWithContracts = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('viewed_reservations_with_contracts') || '[]')
        : [];

      const newViewedIds = reservationsWithContractsToSign
        .map(r => r.id)
        .filter(id => !viewedReservationsWithContracts.includes(id));

      if (newViewedIds.length > 0) {
        const updated = [...viewedReservationsWithContracts, ...newViewedIds];
        localStorage.setItem('viewed_reservations_with_contracts', JSON.stringify(updated));
        
        // Dispatcher l'événement pour mettre à jour les compteurs
        window.dispatchEvent(new CustomEvent('pendingActionsUpdated'));
      }
    }
  }, [reservations]);

  // Filtrer les réservations selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReservations(reservations);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = reservations.filter((reservation) => {
      const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
      const startDate = new Date(reservation.start_date).toLocaleDateString('fr-FR');
      const endDate = new Date(reservation.end_date).toLocaleDateString('fr-FR');
      const totalPrice = parseFloat(reservation.total_price || 0).toFixed(2);
      const status = getStatusText(reservation.status.toLowerCase(), language).toLowerCase();
      const address = (reservation.address || '').toLowerCase();

      return (
        reservationNumber.toLowerCase().includes(query) ||
        startDate.includes(query) ||
        endDate.includes(query) ||
        totalPrice.includes(query) ||
        status.includes(query) ||
        address.includes(query)
      );
    });

    setFilteredReservations(filtered);
    setCurrentPage(1);
  }, [searchQuery, reservations, language]);

  // Fonction pour obtenir le nom d'un pack
  const getPackName = (packId: string | null, lang: 'fr' | 'en' = 'fr') => {
    if (!packId) return null;
    const packNames: { [key: string]: { fr: string; en: string } } = {
      '1': { fr: 'Essentiel', en: 'Essential' },
      '2': { fr: 'Standard', en: 'Standard' },
      '3': { fr: 'Premium', en: 'Premium' },
      '4': { fr: 'Événement', en: 'Event' },
      'pack-1': { fr: 'Essentiel', en: 'Essential' },
      'pack-2': { fr: 'Standard', en: 'Standard' },
      'pack-3': { fr: 'Premium', en: 'Premium' },
      'pack-4': { fr: 'Événement', en: 'Event' },
    };
    return packNames[packId]?.[lang] || `Pack ${packId}`;
  };

  // Fonction pour obtenir le nom principal de la réservation (pack ou équipement)
  const getReservationTitle = (reservation: any, lang: 'fr' | 'en' = 'fr'): string => {
    // Essayer d'abord depuis pack_id
    if (reservation.pack_id) {
      const packName = getPackName(String(reservation.pack_id), lang);
      if (packName) {
        return `Pack ${packName}`;
      }
    }

    // Essayer depuis les notes (cartItems)
    if (reservation.notes) {
      try {
        const parsedNotes = JSON.parse(reservation.notes);
        if (parsedNotes?.cartItems && Array.isArray(parsedNotes.cartItems) && parsedNotes.cartItems.length > 0) {
          const firstItem = parsedNotes.cartItems[0];
          // Si c'est un pack
          if (firstItem.productId?.startsWith('pack-') || firstItem.productId?.startsWith('pack_')) {
            const packId = firstItem.productId.replace('pack-', '').replace('pack_', '');
            const packName = getPackName(packId, lang);
            if (packName) {
              return `Pack ${packName}`;
            }
          }
          // Sinon utiliser le nom du produit
          if (firstItem.productName) {
            return firstItem.productName;
          }
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }

    // Fallback
    return lang === 'fr' ? 'Réservation' : 'Reservation';
  };

  // Fonction pour formater la date au format court (15-16 Juin 2024)
  const formatDateShort = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString('fr-FR', { month: 'short' });
    const year = start.getFullYear();
    
    if (startDay === endDay) {
      return `${startDay} ${startMonth} ${year}`;
    }
    return `${startDay}-${endDay} ${startMonth} ${year}`;
  };

  // Formater une date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Extraire les heures depuis les notes JSON
  const getTimesFromNotes = (notes: string | null) => {
    if (!notes) return { startTime: null, endTime: null };
    try {
      const parsed = JSON.parse(notes);
      return {
        startTime: parsed.startTime || null,
        endTime: parsed.endTime || null,
      };
    } catch (e) {
      return { startTime: null, endTime: null };
    }
  };

  // Ouvrir le modal de détails
  const openDetailsModal = (reservation: any) => {
    setSelectedReservation(reservation);
    setPickupTime(reservation.pickup_time || '');
    setReturnTime(reservation.return_time || '');
    setIsDetailsModalOpen(true);
  };
  
  // Réinitialiser les heures quand le modal se ferme
  useEffect(() => {
    if (!isDetailsModalOpen) {
      setPickupTime('');
      setReturnTime('');
    }
  }, [isDetailsModalOpen]);

  // Obtenir le statut traduit (utilise le nouveau système)
  const getStatusText = (status: string, lang: 'fr' | 'en') => {
    return getReservationStatusUI(status, lang).label;
  };

  // Ouvrir modal d'annulation
  const openCancelModal = (reservation: any) => {
    setReservationForAction(reservation);
    setIsCancelModalOpen(true);
  };

  // Ouvrir modal de modification
  const openChangeModal = (reservation: any) => {
    setReservationForAction(reservation);
    setIsChangeModalOpen(true);
  };

  // Recharger les réservations après action
  const handleActionSuccess = async () => {
    if (!user || !supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReservations(data || []);
      setFilteredReservations(data || []);
    } catch (error) {
      console.error('Erreur rechargement réservations:', error);
    }
  };

  const texts = {
    fr: {
      title: 'Mes réservations',
      empty: 'Aucune réservation',
      emptyDescription: 'Vous n\'avez pas encore de réservations.',
      explorePacks: 'Voir les packs',
      status: 'Statut',
      dates: 'Dates',
      total: 'Total',
      deposit: 'Dépôt de garantie',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour voir vos réservations.',
      signIn: 'Se connecter',
      downloadContract: 'Télécharger le contrat',
      signContract: 'Signer le contrat',
      contractSigned: 'Contrat signé',
      viewDetails: 'Voir les détails',
      reservationNumber: 'Réservation',
      from: 'Du',
      to: 'au',
      address: 'Adresse',
      notes: 'Notes',
      noAddress: 'Non spécifiée',
      noNotes: 'Aucune note',
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page',
      of: 'sur',
    },
    en: {
      title: 'My reservations',
      empty: 'No reservations',
      emptyDescription: 'You don\'t have any reservations yet.',
      explorePacks: 'View packs',
      status: 'Status',
      dates: 'Dates',
      total: 'Total',
      deposit: 'Deposit',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to view your reservations.',
      signIn: 'Sign in',
      downloadContract: 'Download contract',
      signContract: 'Sign contract',
      contractSigned: 'Contract signed',
      viewDetails: 'View details',
      reservationNumber: 'Reservation',
      from: 'From',
      to: 'to',
      address: 'Address',
      notes: 'Notes',
      noAddress: 'Not specified',
      noNotes: 'No notes',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar language={language} />
        <main className="flex-1 flex items-center justify-center lg:ml-64">
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
        <main className="flex-1 flex items-center justify-center lg:ml-64">
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
      <div className="flex flex-1 lg:flex-row">
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

          {/* Message persistant pour les réservations payées non signées */}
          {(() => {
            const unpaidSignedReservations = reservations.filter(
              (r) => (r.status === 'CONFIRMED' || r.status === 'confirmed' || r.status === 'CONTRACT_PENDING') 
                && (!r.client_signature || r.client_signature.trim() === '')
            );
            
            if (unpaidSignedReservations.length > 0) {
              return (
                <Card className="mb-6 border-2 border-orange-500 bg-orange-50">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-orange-900 mb-2">
                          {language === 'fr' 
                            ? `⚠️ ${unpaidSignedReservations.length} contrat${unpaidSignedReservations.length > 1 ? 's' : ''} à signer`
                            : `⚠️ ${unpaidSignedReservations.length} contract${unpaidSignedReservations.length > 1 ? 's' : ''} to sign`}
                        </h3>
                        <p className="text-orange-800 mb-3">
                          {language === 'fr'
                            ? 'Vous avez des réservations payées qui nécessitent votre signature. Veuillez signer le contrat pour finaliser votre réservation.'
                            : 'You have paid reservations that require your signature. Please sign the contract to finalize your reservation.'}
                        </p>
                        <Link
                          href="/mes-contrats"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          {language === 'fr' ? 'Voir mes contrats à signer' : 'View contracts to sign'}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Barre de recherche */}
          {reservations.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={language === 'fr' ? 'Rechercher par date, prix, numéro, statut, adresse...' : 'Search by date, price, number, status, address...'}
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
                    ? `${filteredReservations.length} réservation${filteredReservations.length > 1 ? 's' : ''} trouvée${filteredReservations.length > 1 ? 's' : ''}`
                    : `${filteredReservations.length} reservation${filteredReservations.length > 1 ? 's' : ''} found`}
                </p>
              )}
            </div>
          )}

          {filteredReservations.length === 0 && reservations.length > 0 ? (
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
          ) : filteredReservations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Calendar className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <CardTitle className="text-xl mb-2">{currentTexts.empty}</CardTitle>
                <CardDescription className="mb-8">{currentTexts.emptyDescription}</CardDescription>
                <Button asChild className="bg-[#F2431E] hover:bg-[#E63A1A] text-white">
                  <Link href="/packs">
                    {currentTexts.explorePacks}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {(() => {
                const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedReservations = filteredReservations.slice(startIndex, endIndex);
                
                return (
                  <>
                    <div className="space-y-4 mb-6">
                      {paginatedReservations.map((reservation) => {
                const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
                const statusUI = getReservationStatusUI(reservation.status, language);
                const reservationTitle = getReservationTitle(reservation, language);
                const dateRange = formatDateShort(reservation.start_date, reservation.end_date);
                
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
                    onClick={() => openDetailsModal(reservation)}
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
                          
                          {/* Titre de la réservation */}
                          <h3 className="font-bold text-gray-900 text-lg mb-3">
                            {reservationTitle}
                          </h3>
                          
                          {/* Date avec icône calendrier */}
                          <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm">{dateRange}</span>
                          </div>
                          
                          {/* Lieu avec icône map pin */}
                          {reservation.address && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm truncate">{reservation.address}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Bouton circulaire orange avec chevron */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailsModal(reservation);
                          }}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                          aria-label={currentTexts.viewDetails}
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
                    {(() => {
                      const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
                      return totalPages > 1 ? (
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
                      ) : null;
                    })()}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </main>
      </div>
      <Footer language={language} />

      {/* Modals d'annulation et modification */}
      {reservationForAction && (
        <>
          <CancelRequestModal
            isOpen={isCancelModalOpen}
            onClose={() => {
              setIsCancelModalOpen(false);
              setReservationForAction(null);
            }}
            reservation={reservationForAction}
            language={language}
            onSuccess={handleActionSuccess}
          />
          <ChangeRequestModal
            isOpen={isChangeModalOpen}
            onClose={() => {
              setIsChangeModalOpen(false);
              setReservationForAction(null);
            }}
            reservation={reservationForAction}
            language={language}
            onSuccess={handleActionSuccess}
          />
        </>
      )}

      {/* Modal de détails de la réservation */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {selectedReservation && (() => {
            const reservation = selectedReservation;
            const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
            const { startTime, endTime } = getTimesFromNotes(reservation.notes);
            const dateRange = formatDateShort(reservation.start_date, reservation.end_date);
            const status = reservation.status?.toUpperCase();
            const isConfirmed = status === 'CONFIRMED' || status === 'CONTRACT_PENDING' || 
              (reservation.type === 'client_reservation' && (status === 'CONFIRMED' || status === 'AWAITING_BALANCE'));
            const isSigned = !!reservation.client_signature;
            const statusUI = getReservationStatusUI(reservation.status, language);
            const showActionButtons = shouldShowActionButtons(reservation);
            const isCancelRequested = reservation.status === 'CANCEL_REQUESTED' || reservation.status === 'cancel_requested';
            const isChangeRequested = reservation.status === 'CHANGE_REQUESTED' || reservation.status === 'change_requested';
            
            // Extraire les cartItems depuis les notes
            let cartItems: any[] = [];
            let deliveryInfo: any = null;
            let isPickup = false; // Retrait sur place
            if (reservation.notes) {
              try {
                const parsedNotes = JSON.parse(reservation.notes);
                if (parsedNotes && parsedNotes.cartItems && Array.isArray(parsedNotes.cartItems)) {
                  cartItems = parsedNotes.cartItems;
                  // Vérifier si aucun item de livraison n'est présent
                  const hasDelivery = cartItems.some((item: any) => 
                    item.productId?.startsWith('delivery-') || 
                    item.metadata?.type === 'delivery'
                  );
                  isPickup = !hasDelivery && (parsedNotes.deliveryOption === 'retrait' || !parsedNotes.deliveryOption);
                }
                // Extraire les infos de livraison
                if (parsedNotes.deliveryOptions || parsedNotes.installationDate) {
                  deliveryInfo = {
                    deliveryIncluded: parsedNotes.deliveryOptions?.includes('livraison') || false,
                    installationDate: parsedNotes.installationDate || null,
                    installationTime: parsedNotes.installationTime || null,
                  };
                }
                // Vérifier aussi via deliveryOption dans les notes
                if (parsedNotes.deliveryOption === 'retrait' || (!parsedNotes.deliveryOption && !deliveryInfo?.deliveryIncluded)) {
                  isPickup = true;
                }
              } catch (e) {
                // Ce n'est pas du JSON ou pas de cartItems
              }
            }
            
            // Vérifier si la réservation n'a pas encore commencé (pour permettre l'édition)
            const reservationStartDate = new Date(reservation.start_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const canEditTimes = reservationStartDate >= today;

            // Calculer le breakdown financier
            let financialBreakdown: Array<{ label: string; amount: number }> = [];
            let totalAmount = 0;
            if (cartItems.length > 0) {
              cartItems.forEach((item: any) => {
                const dailyPrice = parseFloat(item.dailyPrice || 0);
                const quantity = parseInt(item.quantity || 1);
                const rentalDays = parseInt(item.rentalDays || 1);
                const itemTotal = dailyPrice * quantity * rentalDays;
                totalAmount += itemTotal;
                
                financialBreakdown.push({
                  label: `${item.productName || 'Produit'} (${rentalDays} jour${rentalDays > 1 ? 's' : ''})`,
                  amount: itemTotal,
                });
                
                // Ajouter les addons
                if (item.addons && item.addons.length > 0) {
                  item.addons.forEach((addon: any) => {
                    financialBreakdown.push({
                      label: addon.name,
                      amount: parseFloat(addon.price || 0),
                    });
                    totalAmount += parseFloat(addon.price || 0);
                  });
                }
              });
              
              // Ajouter la livraison si incluse
              if (deliveryInfo?.deliveryIncluded) {
                financialBreakdown.push({
                  label: language === 'fr' ? 'Livraison' : 'Delivery',
                  amount: 80, // Prix par défaut, à ajuster selon la zone
                });
                totalAmount += 80;
              }
            }

            return (
              <>
                {/* Header mobile-style */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsDetailsModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <DialogTitle className="text-lg font-bold">
                      {language === 'fr' ? 'Réservation' : 'Reservation'}
                    </DialogTitle>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-4">
                  {/* Section 1: Contrat */}
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500 mb-3">
                        {language === 'fr' ? `Référence #SR-${reservationNumber}` : `Reference #SR-${reservationNumber}`}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`${statusUI.badgeClass} border-0`}>
                          {statusUI.label}
                        </Badge>
                      </div>
                      {!isSigned && isConfirmed && (
                        <>
                          <p className="text-sm text-gray-600 mb-4">
                            {language === 'fr' ? 'Votre contrat est prêt à être signé' : 'Your contract is ready to be signed'}
                          </p>
                          <Button
                            asChild
                            className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                          >
                            <Link href={reservation.type === 'client_reservation'
                              ? `/sign-contract?clientReservationId=${reservation.id}`
                              : `/sign-contract?reservationId=${reservation.id}`}>
                              <FilePenLine className="w-4 h-4 mr-2" />
                              {language === 'fr' ? 'Signer le contrat' : 'Sign the contract'}
                            </Link>
                          </Button>
                        </>
                      )}
                      {isSigned && (
                        <p className="text-sm text-gray-600">
                          {language === 'fr' 
                            ? `Contrat signé le ${new Date(reservation.client_signed_at).toLocaleDateString('fr-FR')}`
                            : `Contract signed on ${new Date(reservation.client_signed_at).toLocaleDateString('en-US')}`}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 2: Détails de la réservation */}
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-gray-900 mb-4">
                        {getReservationTitle(reservation, language)}
                      </h3>
                      
                      {/* Date */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{dateRange}</span>
                        </div>
                        {(startTime || endTime) && (
                          <p className="text-sm text-gray-600 ml-6">
                            {startTime && endTime 
                              ? `${startTime} - ${endTime}`
                              : startTime || endTime || ''}
                          </p>
                        )}
                      </div>
                      
                      {/* Lieu */}
                      {reservation.address && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {reservation.address.split(',')[0]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">
                            {reservation.address.split(',').slice(1).join(',').trim()}
                          </p>
                        </div>
                      )}
                      
                      {/* Livraison */}
                      {deliveryInfo?.deliveryIncluded && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {language === 'fr' ? 'Livraison incluse' : 'Delivery included'}
                            </span>
                          </div>
                          {deliveryInfo.installationDate && (
                            <p className="text-sm text-gray-600 ml-6">
                              {language === 'fr' 
                                ? `Installation le ${new Date(deliveryInfo.installationDate).toLocaleDateString('fr-FR')}${deliveryInfo.installationTime ? ` à ${deliveryInfo.installationTime}` : ''}`
                                : `Installation on ${new Date(deliveryInfo.installationDate).toLocaleDateString('en-US')}${deliveryInfo.installationTime ? ` at ${deliveryInfo.installationTime}` : ''}`}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 3: Matériel réservé */}
                  {cartItems.length > 0 && (
                    <Card className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-gray-900">
                          {language === 'fr' ? 'Matériel réservé' : 'Reserved material'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {cartItems.map((item: any, index: number) => {
                          const quantity = parseInt(item.quantity || 1);
                          return (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                              <span className="text-sm text-gray-700">{item.productName || 'Produit'}</span>
                              <span className="text-sm text-gray-600">{quantity}x</span>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* Section 4: Informations financières */}
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold text-gray-900">
                        {language === 'fr' ? 'Informations financières' : 'Financial information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {financialBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{item.label}</span>
                          <span className="text-sm text-gray-900">{item.amount.toFixed(2)}€</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                        <span className="font-bold text-gray-900">{language === 'fr' ? 'Total' : 'Total'}</span>
                        <span className="text-lg font-bold text-gray-900">
                          {reservation.total_price 
                            ? parseFloat(reservation.total_price).toFixed(2)
                            : totalAmount.toFixed(2)}€
                        </span>
                      </div>
                      {reservation.deposit_amount && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-gray-600">
                            {language === 'fr' ? 'Dépôt de garantie' : 'Security deposit'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {parseFloat(reservation.deposit_amount).toFixed(2)}€
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 5: Actions */}
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold text-gray-900">
                        {language === 'fr' ? 'Actions' : 'Actions'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      {showActionButtons && !isCancelRequested && !isChangeRequested && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsDetailsModalOpen(false);
                              openChangeModal(reservation);
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              <Edit className="w-5 h-5 text-gray-600" />
                              <span className="text-sm text-gray-900">
                                {language === 'fr' ? 'Demander une modification' : 'Request a modification'}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsDetailsModalOpen(false);
                              openCancelModal(reservation);
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              <XCircle className="w-5 h-5 text-gray-600" />
                              <span className="text-sm text-gray-900">
                                {language === 'fr' ? 'Demander une annulation' : 'Request a cancellation'}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </button>
                        </>
                      )}
                      
                      {/* Section Retrait sur place - Heures de retrait et retour */}
                      {isPickup && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          {!reservation.pickup_time || !reservation.return_time ? (
                            <div className="mb-3">
                              <p className="text-sm text-amber-600 mb-3 font-medium">
                                {language === 'fr' 
                                  ? 'Pour le retrait matériel, veuillez renseigner l\'heure de retrait et l\'heure de retour du matériel'
                                  : 'For material pickup, please provide the pickup time and return time'}
                              </p>
                              {canEditTimes && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {language === 'fr' ? 'Heure de retrait' : 'Pickup time'}
                                    </label>
                                    <Input
                                      type="time"
                                      value={pickupTime || reservation.pickup_time || ''}
                                      onChange={(e) => setPickupTime(e.target.value)}
                                      className="w-full"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {language === 'fr' ? 'Heure de retour' : 'Return time'}
                                    </label>
                                    <Input
                                      type="time"
                                      value={returnTime || reservation.return_time || ''}
                                      onChange={(e) => setReturnTime(e.target.value)}
                                      className="w-full"
                                    />
                                  </div>
                                  <Button
                                    onClick={async () => {
                                      if (!pickupTime && !reservation.pickup_time) {
                                        alert(language === 'fr' ? 'Veuillez renseigner l\'heure de retrait' : 'Please provide pickup time');
                                        return;
                                      }
                                      if (!returnTime && !reservation.return_time) {
                                        alert(language === 'fr' ? 'Veuillez renseigner l\'heure de retour' : 'Please provide return time');
                                        return;
                                      }
                                      
                                      setIsSavingTimes(true);
                                      try {
                                        if (!supabase) return;
                                        const { error } = await supabase
                                          .from('reservations')
                                          .update({
                                            pickup_time: pickupTime || reservation.pickup_time,
                                            return_time: returnTime || reservation.return_time,
                                          })
                                          .eq('id', reservation.id);
                                        
                                        if (error) throw error;
                                        
                                        // Mettre à jour la réservation locale
                                        setSelectedReservation({
                                          ...reservation,
                                          pickup_time: pickupTime || reservation.pickup_time,
                                          return_time: returnTime || reservation.return_time,
                                        });
                                        
                                        // Mettre à jour la liste des réservations
                                        setReservations(reservations.map(r => 
                                          r.id === reservation.id 
                                            ? { ...r, pickup_time: pickupTime || reservation.pickup_time, return_time: returnTime || reservation.return_time }
                                            : r
                                        ));
                                        
                                        alert(language === 'fr' ? 'Heures enregistrées avec succès' : 'Times saved successfully');
                                      } catch (error) {
                                        console.error('Erreur sauvegarde heures:', error);
                                        alert(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving times');
                                      } finally {
                                        setIsSavingTimes(false);
                                      }
                                    }}
                                    disabled={isSavingTimes || (!pickupTime && !reservation.pickup_time) || (!returnTime && !reservation.return_time)}
                                    className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                                  >
                                    {isSavingTimes 
                                      ? (language === 'fr' ? 'Enregistrement...' : 'Saving...')
                                      : (language === 'fr' ? 'Enregistrer les heures' : 'Save times')
                                    }
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {language === 'fr' ? 'Heure de retrait' : 'Pickup time'}
                                </span>
                                <span className="text-sm text-gray-600 ml-auto">
                                  {reservation.pickup_time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {language === 'fr' ? 'Heure de retour' : 'Return time'}
                                </span>
                                <span className="text-sm text-gray-600 ml-auto">
                                  {reservation.return_time}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <a
                        href="https://wa.me/33651084994"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Headphones className="w-5 h-5 text-gray-600" />
                          <span className="text-sm text-gray-900">
                            {language === 'fr' ? 'Contacter SoundRush' : 'Contact SoundRush'}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

