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
  Eye,
  Phone,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';

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

  useEffect(() => {
    if (!user || !supabase) return;

    const loadData = async () => {
      try {
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
        <div className="flex flex-1 pt-[112px]">
          <DashboardSidebar language={language} />
          <main className="flex-1 flex items-center justify-center">
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
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">♪</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SoundRush</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
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
              <div className="space-y-6 mb-6">
                {paginatedReservations.map((reservation) => {
                  const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
                  const { startTime, endTime } = getTimesFromNotes(reservation.notes);
                  
                  return (
                    <Card key={reservation.id} className="hover:shadow-lg transition-all">
                      {/* Header */}
                      <CardHeader className="bg-blue-50 border-b border-blue-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base sm:text-lg truncate">
                                {currentTexts.reservationNumber} #{reservationNumber}
                              </CardTitle>
                            </div>
                          </div>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <a href="tel:+33651084994">
                              <Phone className="w-4 h-4 mr-2" />
                              {language === 'fr' ? 'Contacter SoundRush' : 'Contact SoundRush'}
                            </a>
                          </Button>
                        </div>
                      </CardHeader>

                      {/* Contenu */}
                      <CardContent className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {/* Informations de livraison */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.deliveryDate}</h4>
                              <div className="flex items-center gap-2 text-gray-900">
                                <Calendar className="w-5 h-5 text-[#F2431E]" />
                                <span className="font-medium">{formatDate(reservation.start_date, startTime)}</span>
                              </div>
                            </div>

                            {reservation.end_date && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.returnDate}</h4>
                                <div className="flex items-center gap-2 text-gray-900">
                                  <Calendar className="w-5 h-5 text-[#F2431E]" />
                                  <span className="font-medium">{formatDate(reservation.end_date, endTime)}</span>
                                </div>
                              </div>
                            )}

                            {reservation.address && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.address}</h4>
                                <div className="flex items-start gap-2 text-gray-900">
                                  <MapPin className="w-5 h-5 text-[#F2431E] flex-shrink-0 mt-0.5" />
                                  <p className="text-gray-900">{reservation.address}</p>
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{language === 'fr' ? 'Type' : 'Type'}</h4>
                              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                {reservation.address ? (language === 'fr' ? 'Livraison' : 'Delivery') : (language === 'fr' ? 'Retrait' : 'Pickup')}
                              </Badge>
                            </div>
                          </div>

                          {/* Statut de livraison/récupération */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-3">{currentTexts.status}</h4>
                              <Card className="bg-gray-50 border-gray-200">
                                <CardContent className="p-4">
                                  <Badge 
                                    variant={reservation.delivery_status === 'termine' ? 'default' : reservation.delivery_status === 'en_cours' ? 'secondary' : 'outline'}
                                    className={
                                      reservation.delivery_status === 'termine'
                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                        : reservation.delivery_status === 'en_cours'
                                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                    }
                                  >
                                    {reservation.delivery_status === 'termine'
                                      ? (language === 'fr' ? 'Terminé' : 'Completed')
                                      : reservation.delivery_status === 'en_cours'
                                      ? (language === 'fr' ? 'En cours' : 'In progress')
                                      : (language === 'fr' ? 'En attente' : 'Pending')}
                                  </Badge>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
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
