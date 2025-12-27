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
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Icônes lucide-react
import { 
  Calendar, 
  MapPin, 
  Package,
  Phone,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Menu,
  Truck,
  Music
} from 'lucide-react';
import { PACKS } from '@/lib/packs';

export default function MesLivraisonsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();

  // Rediriger vers l'accueil si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  // Marquer les livraisons comme consultées quand la page est visitée
  useEffect(() => {
    if (!user || !supabase || typeof window === 'undefined') return;
    
    const markAsViewed = async () => {
      if (!supabase) return;
      try {
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['confirmed', 'CONFIRMED', 'completed', 'COMPLETED']);
        
        if (reservationsData && reservationsData.length > 0) {
          const viewedIds = reservationsData.map(r => r.id);
          localStorage.setItem('viewed_deliveries', JSON.stringify(viewedIds));
          // Dispatcher un événement pour mettre à jour les compteurs du dashboard
          window.dispatchEvent(new CustomEvent('pendingActionsUpdated'));
        }
      } catch (error) {
        console.error('Erreur marquage livraisons comme consultées:', error);
      }
    };
    
    markAsViewed();
  }, [user, supabase]);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadData = async () => {
      try {
        if (!supabase) return;
        // Charger les réservations confirmées de l'utilisateur
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['confirmed', 'CONFIRMED', 'completed', 'COMPLETED'])
          .order('start_date', { ascending: false });

        if (reservationsError) {
          console.error('Erreur chargement réservations:', reservationsError);
          return;
        }

        setReservations(reservationsData || []);
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    loadData();
  }, [user]);

  const formatDate = (dateString: string, timeString?: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
    
    // Si une heure est fournie, l'utiliser, sinon utiliser l'heure de la date
    if (timeString) {
      return `${dateFormatted} à ${timeString}`;
    }
    
    return dateFormatted;
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

  // Fonction pour obtenir le titre de la livraison
  const getDeliveryTitle = (reservation: any, lang: 'fr' | 'en' = 'fr'): string => {
    if (reservation.pack_id) {
      const packName = getPackName(String(reservation.pack_id), lang);
      if (packName) {
        return `Pack ${packName}`;
      }
    }
    if (reservation.notes) {
      try {
        const parsedNotes = JSON.parse(reservation.notes);
        if (parsedNotes?.cartItems && Array.isArray(parsedNotes.cartItems) && parsedNotes.cartItems.length > 0) {
          const firstItem = parsedNotes.cartItems[0];
          if (firstItem.productId?.startsWith('pack-') || firstItem.productId?.startsWith('pack_')) {
            const packId = firstItem.productId.replace('pack-', '').replace('pack_', '');
            const packName = getPackName(packId, lang);
            if (packName) {
              return `Pack ${packName}`;
            }
          }
          if (firstItem.productName) {
            return firstItem.productName;
          }
        }
      } catch (e) {
        // Ignorer
      }
    }
    return lang === 'fr' ? 'Livraison' : 'Delivery';
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
    if (status === 'termine') {
      return { bg: 'bg-green-100', dot: 'bg-green-500', text: 'text-green-800' };
    } else if (status === 'en_cours') {
      return { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-800' };
    }
    return { bg: 'bg-orange-100', dot: 'bg-orange-500', text: 'text-orange-800' };
  };


  const texts = {
    fr: {
      title: 'Mes livraisons',
      empty: 'Aucune livraison',
      emptyDescription: 'Vous n\'avez pas encore de livraisons confirmées.',
      reservationNumber: 'Réservation',
      deliveryDate: 'Date de livraison',
      returnDate: 'Date de récupération',
      address: 'Adresse de livraison',
      status: 'Statut',
      viewDetails: 'Voir les détails',
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page',
      of: 'sur',
    },
    en: {
      title: 'My deliveries',
      empty: 'No deliveries',
      emptyDescription: 'You don\'t have any confirmed deliveries yet.',
      reservationNumber: 'Reservation',
      deliveryDate: 'Delivery date',
      returnDate: 'Return date',
      address: 'Delivery address',
      status: 'Status',
      viewDetails: 'View details',
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="flex flex-1">
          <DashboardSidebar language={language} />
          <main className="flex-1 flex items-center justify-center lg:ml-64">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="text-6xl mb-6">🔒</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Connexion requise</h1>
              <p className="text-xl text-gray-600 mb-8">Connectez-vous pour voir vos livraisons.</p>
              <button
                onClick={() => setIsSignModalOpen(true)}
                className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
              >
                Se connecter
              </button>
            </div>
          </main>
          <SignModal
            isOpen={isSignModalOpen}
            onClose={() => setIsSignModalOpen(false)}
            language={language}
          />
        </div>
        <Footer language={language} />
      </div>
    );
  }

  const totalPages = Math.ceil(reservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = reservations.slice(startIndex, endIndex);

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

          {reservations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Package className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <CardTitle className="text-xl mb-2">{currentTexts.empty}</CardTitle>
                <CardDescription className="mb-8">{currentTexts.emptyDescription}</CardDescription>
                <Button asChild className="bg-[#F2431E] hover:bg-[#E63A1A] text-white">
                  <Link href="/mes-reservations">
                    {language === 'fr' ? 'Voir mes réservations' : 'View my reservations'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {paginatedReservations.map((reservation) => {
                  const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
                  const { startTime } = getTimesFromNotes(reservation.notes);
                  const isDelivery = !!reservation.address;
                  const deliveryStatus = reservation.delivery_status || 'en_attente';
                  const deliveryTitle = getDeliveryTitle(reservation, language);
                  const deliveryDate = formatDateShort(reservation.start_date);
                  const badgeColors = getStatusBadgeColor(deliveryStatus);
                  
                  return (
                    <Card 
                      key={reservation.id} 
                      className="hover:shadow-md transition-all"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Badge de statut avec point coloré */}
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={`${badgeColors.bg} ${badgeColors.text} border-0 px-3 py-1`}>
                                <span className={`w-2 h-2 rounded-full ${badgeColors.dot} mr-2 inline-block`}></span>
                                {deliveryStatus === 'termine'
                                  ? (language === 'fr' ? 'Terminé' : 'Completed')
                                  : deliveryStatus === 'en_cours'
                                  ? (language === 'fr' ? 'En cours' : 'In progress')
                                  : (language === 'fr' ? 'En attente' : 'Pending')}
                              </Badge>
                              {isDelivery && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-xs">
                                  {language === 'fr' ? 'Livraison' : 'Delivery'}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Titre de la livraison */}
                            <h3 className="font-bold text-gray-900 text-lg mb-3">
                              {deliveryTitle}
                            </h3>
                            
                            {/* Date de livraison */}
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm">
                                {language === 'fr' ? 'Livraison le' : 'Delivery on'} {deliveryDate}
                                {startTime && ` à ${startTime}`}
                              </span>
                            </div>
                            
                            {/* Lieu */}
                            {reservation.address && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm truncate">{reservation.address}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Bouton contact */}
                          <a
                            href="tel:+33651084994"
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                            title={language === 'fr' ? 'Contacter SoundRush' : 'Contact SoundRush'}
                          >
                            <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
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
          )}
        </div>
      </main>
      </div>
      <Footer language={language} />
    </div>
  );
}
