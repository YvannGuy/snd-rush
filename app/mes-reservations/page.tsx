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
  Menu
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PACKS } from '@/lib/packs';
import { getCatalogItemById } from '@/lib/catalog';
import CancelRequestModal from '@/components/reservations/CancelRequestModal';
import ChangeRequestModal from '@/components/reservations/ChangeRequestModal';
import { getReservationStatusUI, shouldShowActionButtons } from '@/lib/reservationStatus';
import { XCircle, Edit } from 'lucide-react';

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
        console.log('🔍 Chargement réservations pour user.id:', user.id);
        const { data, error } = await supabaseClient
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erreur chargement réservations:', error);
          throw error;
        }
        
        console.log('✅ Réservations trouvées:', data?.length || 0, data);
        setReservations(data || []);
        setFilteredReservations(data || []);
      } catch (error) {
        console.error('Erreur chargement réservations:', error);
      }
    };

    loadReservations();
  }, [user]);

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
    setIsDetailsModalOpen(true);
  };

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
                    <div className="space-y-6 mb-6">
                      {paginatedReservations.map((reservation) => {
                const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
                const isConfirmed = reservation.status === 'confirmed' || reservation.status === 'CONFIRMED';
                const isPending = reservation.status === 'pending' || reservation.status === 'PENDING';
                const isSigned = !!reservation.client_signature;
                const statusUI = getReservationStatusUI(reservation.status, language);
                const showActionButtons = shouldShowActionButtons(reservation);
                const isCancelRequested = reservation.status === 'CANCEL_REQUESTED' || reservation.status === 'cancel_requested';
                const isChangeRequested = reservation.status === 'CHANGE_REQUESTED' || reservation.status === 'change_requested';
                
                return (
                  <Card key={reservation.id} className="hover:shadow-lg transition-all">
                    {/* Header avec statut */}
                    <CardHeader className={`${
                      isConfirmed ? 'bg-green-50 border-b border-green-200' :
                      isPending ? 'bg-yellow-50 border-b border-yellow-200' :
                      'bg-gray-50 border-b border-gray-200'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isConfirmed ? 'bg-green-100' :
                            isPending ? 'bg-yellow-100' :
                            'bg-gray-100'
                          }`}>
                            <ClipboardList className={`w-5 h-5 sm:w-6 sm:h-6 ${
                              isConfirmed ? 'text-green-600' :
                              isPending ? 'text-yellow-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg truncate">
                              {currentTexts.reservationNumber} #{reservationNumber}
                            </CardTitle>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant={statusUI.badgeVariant || undefined}
                                className={statusUI.badgeClass}
                              >
                                {statusUI.label}
                              </Badge>
                              {statusUI.message && !isCancelRequested && !isChangeRequested && (
                                <CardDescription className="text-xs text-gray-600 mt-0">
                                  {statusUI.message}
                                </CardDescription>
                              )}
                              {!isSigned && isConfirmed && !isCancelRequested && !isChangeRequested && (
                                <CardDescription className="text-xs text-gray-600 mt-0">
                                  {language === 'fr' ? 'Signature requise pour finaliser la réservation.' : 'Signature required to finalize the reservation.'}
                                </CardDescription>
                              )}
                              {isSigned && reservation.client_signed_at && (
                                <CardDescription className="text-xs text-gray-600 mt-0">
                                  {language === 'fr' 
                                    ? `Contrat signé le ${new Date(reservation.client_signed_at).toLocaleDateString('fr-FR')}.`
                                    : `Contract signed on ${new Date(reservation.client_signed_at).toLocaleDateString('en-US')}.`}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          {/* Boutons d'action (annulation/modification) - affichés conditionnellement */}
                          {showActionButtons && !isCancelRequested && !isChangeRequested && (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                onClick={() => openCancelModal(reservation)}
                                className="border-red-300 text-red-700 hover:bg-red-50 flex-1 sm:flex-initial min-w-0 px-3 py-2.5 sm:px-4 sm:py-2"
                                title={language === 'fr' ? 'Demander annulation' : 'Request cancellation'}
                                aria-label={language === 'fr' ? 'Demander annulation' : 'Request cancellation'}
                              >
                                <XCircle className="w-6 h-6 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
                                <span className="hidden sm:inline truncate text-xs sm:text-sm">{language === 'fr' ? 'Demander annulation' : 'Request cancellation'}</span>
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => openChangeModal(reservation)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-initial min-w-0 px-3 py-2.5 sm:px-4 sm:py-2"
                                title={language === 'fr' ? 'Demander modification' : 'Request change'}
                                aria-label={language === 'fr' ? 'Demander modification' : 'Request change'}
                              >
                                <Edit className="w-6 h-6 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
                                <span className="hidden sm:inline truncate text-xs sm:text-sm">{language === 'fr' ? 'Demander modification' : 'Request change'}</span>
                              </Button>
                            </div>
                          )}
                          
                          {/* Message si demande déjà envoyée */}
                          {(isCancelRequested || isChangeRequested) && (
                            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                              {language === 'fr' 
                                ? 'Demande reçue. Nous revenons vers vous rapidement.'
                                : 'Request received. We will get back to you shortly.'}
                            </div>
                          )}

                          {/* Boutons existants (signature, téléchargement) - optimisés mobile */}
                          <div className="flex flex-wrap gap-2">
                            {isConfirmed && (
                              <>
                                {!isSigned ? (
                                  <Button
                                    asChild
                                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-initial min-w-0 px-3 py-2.5 sm:px-4 sm:py-2"
                                    title={currentTexts.signContract}
                                    aria-label={currentTexts.signContract}
                                  >
                                    <Link href={`/sign-contract?reservationId=${reservation.id}`}>
                                      <FilePenLine className="w-6 h-6 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
                                      <span className="hidden sm:inline truncate text-xs sm:text-sm">{currentTexts.signContract}</span>
                                    </Link>
                                  </Button>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-3 py-2.5 sm:px-3 sm:py-2 h-auto flex-1 sm:flex-initial justify-center">
                                    <CheckCircle2 className="w-6 h-6 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
                                    <span className="hidden sm:inline truncate text-xs sm:text-sm">{currentTexts.contractSigned}</span>
                                  </Badge>
                                )}
                                <Button
                                  asChild
                                  variant="default"
                                  className="bg-[#F2431E] hover:bg-[#E63A1A] text-white flex-1 sm:flex-initial min-w-0 px-3 py-2.5 sm:px-4 sm:py-2"
                                  title={currentTexts.downloadContract}
                                  aria-label={currentTexts.downloadContract}
                                >
                                  <a
                                    href={`/api/contract/download?reservationId=${reservation.id}`}
                                    download={`contrat-${reservationNumber}.pdf`}
                                  >
                                    <Download className="w-6 h-6 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
                                    <span className="hidden sm:inline truncate text-xs sm:text-sm">{currentTexts.downloadContract}</span>
                                  </a>
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => openDetailsModal(reservation)}
                              className="flex-1 sm:flex-initial min-w-0 px-3 py-2.5 sm:px-4 sm:py-2"
                              title={currentTexts.viewDetails}
                              aria-label={currentTexts.viewDetails}
                            >
                              <Eye className="w-6 h-6 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
                              <span className="hidden sm:inline truncate text-xs sm:text-sm">{currentTexts.viewDetails}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Contenu */}
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Informations principales */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.dates}</h4>
                            <div className="flex items-center gap-2 text-gray-900">
                              <Calendar className="w-5 h-5 text-[#F2431E]" />
                              <span className="font-medium">{formatDate(reservation.start_date)}</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium">{formatDate(reservation.end_date)}</span>
                            </div>
                          </div>

                          {reservation.address && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.address}</h4>
                              <div className="flex items-start gap-2 text-gray-900">
                                <MapPin className="w-5 h-5 text-[#F2431E] flex-shrink-0 mt-0.5" />
                                <p className="text-gray-900">{reservation.address}</p>
                              </div>
                            </div>
                          )}

                          {/* Produits réservés */}
                          {(() => {
                            // Extraire les cartItems depuis les notes
                            let cartItems: any[] = [];
                            
                            if (reservation.notes) {
                              try {
                                const parsedNotes = JSON.parse(reservation.notes);
                                if (parsedNotes && parsedNotes.cartItems && Array.isArray(parsedNotes.cartItems)) {
                                  cartItems = parsedNotes.cartItems;
                                }
                              } catch (e) {
                                // Ce n'est pas du JSON ou pas de cartItems
                              }
                            }
                            
                            if (cartItems.length > 0) {
                              return (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500 mb-3">{language === 'fr' ? 'Produits réservés' : 'Reserved products'}</h4>
                                  <div className="space-y-2">
                                    {cartItems.map((item: any, index: number) => {
                                      const dailyPrice = parseFloat(item.dailyPrice || 0);
                                      const quantity = parseInt(item.quantity || 1);
                                      const rentalDays = parseInt(item.rentalDays || 1);
                                      const itemTotal = dailyPrice * quantity * rentalDays;
                                      
                                      return (
                                        <Card key={index} className="bg-gray-50 border-gray-200">
                                          <CardContent className="p-3">
                                            <div className="flex justify-between items-start mb-2">
                                              <div className="flex-1">
                                                <p className="font-semibold text-gray-900 text-sm">{item.productName || 'Produit'}</p>
                                                {item.addons && item.addons.length > 0 && (
                                                  <div className="mt-1 space-y-1">
                                                    {item.addons.map((addon: any, addonIndex: number) => (
                                                      <p key={addonIndex} className="text-xs text-gray-600">
                                                        + {addon.name} (+{addon.price}€)
                                                      </p>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                              <p className="font-bold text-[#F2431E] text-sm ml-2">{itemTotal.toFixed(2)}€</p>
                                            </div>
                                            <div className="flex gap-4 text-xs text-gray-600">
                                              <span>Qté: {quantity}</span>
                                              <span>Prix/jour: {dailyPrice.toFixed(2)}€</span>
                                              <span>Durée: {rentalDays} jour{rentalDays > 1 ? 's' : ''}</span>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            
                            // Si pas de cartItems, afficher les notes normales si elles existent
                            let notesContent = reservation.notes;
                            if (notesContent) {
                              try {
                                const parsedNotes = JSON.parse(notesContent);
                                // Ne pas afficher si ce sont uniquement des métadonnées techniques
                                if (parsedNotes && typeof parsedNotes === 'object') {
                                  if (parsedNotes.cartItems || parsedNotes.sessionId) {
                                    // Si c'est juste des métadonnées (pas de message/notes), ne rien afficher
                                    if (!parsedNotes.message && !parsedNotes.notes) {
                                      notesContent = null;
                                    } else {
                                      // Afficher seulement message ou notes, pas les métadonnées
                                      notesContent = parsedNotes.message || parsedNotes.notes || null;
                                    }
                                  } else {
                                    // Pas de métadonnées techniques, afficher les autres champs
                                    notesContent = Object.entries(parsedNotes)
                                      .filter(([key]) => key !== 'sessionId')
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(', ') || null;
                                  }
                                }
                              } catch (e) {
                                // Ce n'est pas du JSON, afficher tel quel
                              }
                            }
                            
                            return notesContent ? (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.notes}</h4>
                                <p className="text-gray-700 text-sm">{notesContent}</p>
                              </div>
                            ) : null;
                          })()}
                        </div>

                        {/* Informations financières */}
                        <div className="space-y-4">
                          <Card className="bg-gray-50 border-gray-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-semibold text-gray-500">
                                {language === 'fr' ? 'Informations financières' : 'Financial information'}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0">
                              {reservation.total_price && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">{currentTexts.total}</span>
                                  <span className="text-lg font-bold text-gray-900">{parseFloat(reservation.total_price).toFixed(2)}€</span>
                                </div>
                              )}
                              {reservation.deposit_amount && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">{currentTexts.deposit}</span>
                                  <span className="font-semibold text-gray-900">{parseFloat(reservation.deposit_amount).toFixed(2)}€</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {reservation.pack_id && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{language === 'fr' ? 'Pack réservé' : 'Reserved pack'}</h4>
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-[#F2431E] rounded-lg flex items-center justify-center">
                                  <Music className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-semibold text-gray-900">
                                  Pack {getPackName(reservation.pack_id, language)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedReservation && (() => {
            const reservation = selectedReservation;
            const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
            const { startTime, endTime } = getTimesFromNotes(reservation.notes);
            
            // Extraire les cartItems depuis les notes
            let cartItems: any[] = [];
            if (reservation.notes) {
              try {
                const parsedNotes = JSON.parse(reservation.notes);
                if (parsedNotes && parsedNotes.cartItems && Array.isArray(parsedNotes.cartItems)) {
                  cartItems = parsedNotes.cartItems;
                }
              } catch (e) {
                // Ce n'est pas du JSON ou pas de cartItems
              }
            }

            return (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {currentTexts.reservationNumber} #{reservationNumber}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  {/* Dates et heures */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-500">
                          {language === 'fr' ? 'Date et heure de début' : 'Start date and time'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#F2431E]" />
                          <span className="font-medium">{formatDate(reservation.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-5 h-5 text-[#F2431E]" />
                          <span className="font-medium">{startTime || (language === 'fr' ? 'Non spécifiée' : 'Not specified')}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-500">
                          {language === 'fr' ? 'Date et heure de fin' : 'End date and time'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#F2431E]" />
                          <span className="font-medium">{formatDate(reservation.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-5 h-5 text-[#F2431E]" />
                          <span className="font-medium">{endTime || (language === 'fr' ? 'Non spécifiée' : 'Not specified')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Adresse */}
                  {reservation.address && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-500">
                          {currentTexts.address}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-[#F2431E] flex-shrink-0 mt-0.5" />
                          <p className="text-gray-900">{reservation.address}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Produits réservés */}
                  {cartItems.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-500">
                          {language === 'fr' ? 'Produits réservés' : 'Reserved products'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {cartItems.map((item: any, index: number) => {
                            const dailyPrice = parseFloat(item.dailyPrice || 0);
                            const quantity = parseInt(item.quantity || 1);
                            const rentalDays = parseInt(item.rentalDays || 1);
                            const itemTotal = dailyPrice * quantity * rentalDays;
                            
                            // Vérifier si c'est un pack
                            const isPack = item.productId?.startsWith('pack-') || item.productId?.startsWith('pack_');
                            let packEquipment: Array<{ name: string; qty: number }> = [];
                            
                            if (isPack) {
                              // Extraire le packId (pack_petit, pack_confort, etc.)
                              const packId = item.productId?.replace('pack-', '').replace('pack_', '');
                              const packKey = packId === 'petit' ? 'petit' : 
                                            packId === 'confort' ? 'confort' :
                                            packId === 'grand' ? 'grand' :
                                            packId === 'maxi' ? 'maxi' : null;
                              
                              if (packKey && PACKS[packKey]) {
                                // Utiliser la composition du pack
                                packEquipment = PACKS[packKey].composition.map(comp => ({ name: comp, qty: 1 }));
                              } else if (item.metadata?.breakdown && Array.isArray(item.metadata.breakdown)) {
                                // Utiliser le breakdown depuis metadata si disponible
                                packEquipment = item.metadata.breakdown.map((b: any) => ({
                                  name: b.name || b.productName || b,
                                  qty: b.quantity || b.qty || 1
                                }));
                              }
                            }
                            
                            return (
                              <Card key={index} className="bg-gray-50 border-gray-200">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">{item.productName || 'Produit'}</p>
                                      
                                      {/* Détails des équipements du pack */}
                                      {isPack && packEquipment.length > 0 && (
                                        <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-2">
                                          <p className="text-xs font-semibold text-gray-500 mb-1.5">
                                            {language === 'fr' ? 'Équipements inclus :' : 'Included equipment:'}
                                          </p>
                                          {packEquipment.map((equip, equipIndex) => (
                                            <p key={equipIndex} className="text-sm text-gray-700 flex items-center gap-2">
                                              <span className="text-[#F2431E]">•</span>
                                              <span>{equip.name}</span>
                                              {equip.qty > 1 && <span className="text-gray-500">(x{equip.qty})</span>}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Addons */}
                                      {item.addons && item.addons.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          <p className="text-xs font-semibold text-gray-500 mb-1">
                                            {language === 'fr' ? 'Options :' : 'Options:'}
                                          </p>
                                          {item.addons.map((addon: any, addonIndex: number) => (
                                            <p key={addonIndex} className="text-sm text-gray-600 flex items-center gap-2">
                                              <span className="text-[#F2431E]">+</span>
                                              <span>{addon.name} (+{addon.price}€)</span>
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <p className="font-bold text-[#F2431E] ml-2">{itemTotal.toFixed(2)}€</p>
                                  </div>
                                  <div className="flex gap-4 text-sm text-gray-600 mt-2">
                                    <span>Qté: {quantity}</span>
                                    <span>Prix/jour: {dailyPrice.toFixed(2)}€</span>
                                    <span>Durée: {rentalDays} jour{rentalDays > 1 ? 's' : ''}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Informations financières */}
                  <Card className="bg-gray-50 border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-500">
                        {language === 'fr' ? 'Informations financières' : 'Financial information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {reservation.total_price && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{currentTexts.total}</span>
                          <span className="text-lg font-bold text-gray-900">{parseFloat(reservation.total_price).toFixed(2)}€</span>
                        </div>
                      )}
                      {reservation.deposit_amount && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{currentTexts.deposit}</span>
                          <span className="font-semibold text-gray-900">{parseFloat(reservation.deposit_amount).toFixed(2)}€</span>
                        </div>
                      )}
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

