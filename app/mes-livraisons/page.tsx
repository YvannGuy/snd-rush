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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Icônes lucide-react
import { 
  Calendar, 
  MapPin, 
  Package,
  Phone,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Menu
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
              <div className="mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{currentTexts.reservationNumber}</TableHead>
                      <TableHead>{currentTexts.deliveryDate}</TableHead>
                      <TableHead>{currentTexts.returnDate}</TableHead>
                      <TableHead>{currentTexts.address}</TableHead>
                      <TableHead>{language === 'fr' ? 'Type' : 'Type'}</TableHead>
                      <TableHead>{currentTexts.status}</TableHead>
                      <TableHead className="text-right">{language === 'fr' ? 'Action' : 'Action'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReservations.map((reservation) => {
                      const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
                      const { startTime, endTime } = getTimesFromNotes(reservation.notes);
                      const isDelivery = !!reservation.address;
                      const deliveryStatus = reservation.delivery_status || 'en_attente';
                      
                      return (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-semibold">
                            #{reservationNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{formatDate(reservation.start_date, startTime)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{reservation.end_date ? formatDate(reservation.end_date, endTime) : '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {reservation.address ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm max-w-xs truncate">{reservation.address}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                              {isDelivery ? (language === 'fr' ? 'Livraison' : 'Delivery') : (language === 'fr' ? 'Retrait' : 'Pickup')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={deliveryStatus === 'termine' ? 'default' : deliveryStatus === 'en_cours' ? 'secondary' : 'outline'}
                              className={
                                deliveryStatus === 'termine'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : deliveryStatus === 'en_cours'
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                              }
                            >
                              {deliveryStatus === 'termine'
                                ? (language === 'fr' ? 'Terminé' : 'Completed')
                                : deliveryStatus === 'en_cours'
                                ? (language === 'fr' ? 'En cours' : 'In progress')
                                : (language === 'fr' ? 'En attente' : 'Pending')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href="tel:+33651084994" title={language === 'fr' ? 'Contacter SoundRush' : 'Contact SoundRush'}>
                                <Phone className="w-4 h-4" />
                              </a>
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
          )}
        </div>
      </main>
      </div>
      <Footer language={language} />
    </div>
  );
}
