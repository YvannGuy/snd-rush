'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import EtatDesLieuxModal from '@/components/EtatDesLieuxModal';
// Icônes lucide-react
import { 
  Search, 
  X, 
  Calendar, 
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function AdminEtatsDesLieuxPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<any[]>([]);
  const [etatsLieuxMap, setEtatsLieuxMap] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // État pour le modal
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Marquer comme "viewé" quand le modal s'ouvre
    // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

useEffect(() => {
    if (!isModalOpen || !selectedReservation) return;

    const markAsViewed = () => {
      const reservationId = selectedReservation.id;
      const etatLieux = etatsLieuxMap[reservationId];
      
      if (etatLieux && etatLieux.id) {
        const viewed = JSON.parse(localStorage.getItem('admin_viewed_condition_reports') || '[]');
        if (!viewed.includes(etatLieux.id)) {
          viewed.push(etatLieux.id);
          localStorage.setItem('admin_viewed_condition_reports', JSON.stringify(viewed));
        }
      }

      // Dispatcher l'événement pour mettre à jour les compteurs
      window.dispatchEvent(new CustomEvent('pendingActionsUpdated'));
    };

    markAsViewed();
  }, [isModalOpen, selectedReservation, etatsLieuxMap]);

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
        // Charger les réservations confirmées
        if (!supabase) return;
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .in('status', ['confirmed', 'CONFIRMED', 'completed', 'COMPLETED'])
          .order('start_date', { ascending: false });

        if (reservationsError) throw reservationsError;
        setReservations(reservationsData || []);
        setFilteredReservations(reservationsData || []);

        // Charger les états des lieux existants
        if (reservationsData && reservationsData.length > 0) {
          if (!supabase) return;
          const reservationIds = reservationsData.map(r => r.id);
          const { data: etatsLieuxData } = await supabase
            .from('etat_lieux')
            .select('*')
            .in('reservation_id', reservationIds);

          if (etatsLieuxData) {
            const map: Record<string, any> = {};
            etatsLieuxData.forEach((etat) => {
              map[etat.reservation_id] = etat;
            });
            setEtatsLieuxMap(map);
          }
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    loadData();
  }, [user]);

  // Filtrer les réservations
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
      const address = (reservation.address || '').toLowerCase();

      return (
        reservationNumber.toLowerCase().includes(query) ||
        startDate.includes(query) ||
        endDate.includes(query) ||
        address.includes(query)
      );
    });

    setFilteredReservations(filtered);
    setCurrentPage(1);
  }, [searchQuery, reservations]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (reservationId: string) => {
    const etatLieux = etatsLieuxMap[reservationId];
    if (!etatLieux) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          {language === 'fr' ? 'À compléter' : 'To complete'}
        </Badge>
      );
    }
    
    if (etatLieux.status === 'reprise_complete') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {language === 'fr' ? 'Complet' : 'Complete'}
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        {language === 'fr' ? 'En cours' : 'In progress'}
      </Badge>
    );
  };

  const openModal = (reservation: any) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const handleModalSave = async () => {
    // Recharger les données de la liste
    if (!user || !supabase) return;

    try {
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('*')
        .in('status', ['confirmed', 'CONFIRMED', 'completed', 'COMPLETED'])
        .order('start_date', { ascending: false });

      if (reservationsData && reservationsData.length > 0) {
        if (!supabase) return;
        const reservationIds = reservationsData.map(r => r.id);
        const { data: etatsLieuxData } = await supabase
          .from('etat_lieux')
          .select('*')
          .in('reservation_id', reservationIds);

        if (etatsLieuxData) {
          const map: Record<string, any> = {};
          etatsLieuxData.forEach((etat) => {
            map[etat.reservation_id] = etat;
          });
          setEtatsLieuxMap(map);
        }
      }
    } catch (error) {
      console.error('Erreur rechargement données:', error);
    }
  };

  const texts = {
    fr: {
      title: 'États des lieux',
      searchPlaceholder: 'Rechercher par réservation, date, adresse...',
      reservation: 'Réservation',
      dates: 'Dates',
      address: 'Adresse',
      status: 'Statut',
      action: 'Action',
      view: 'Voir/Gérer',
      empty: 'Aucune réservation',
      emptyDescription: 'Aucune réservation confirmée trouvée.',
      page: 'Page',
      of: 'sur',
      previous: 'Précédent',
      next: 'Suivant',
    },
    en: {
      title: 'Condition reports',
      searchPlaceholder: 'Search by reservation, date, address...',
      reservation: 'Reservation',
      dates: 'Dates',
      address: 'Address',
      status: 'Status',
      action: 'Action',
      view: 'View/Manage',
      empty: 'No reservations',
      emptyDescription: 'No confirmed reservations found.',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
    },
  };

  const currentTexts = texts[language];

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
          <p className="mt-4 text-gray-600">{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        {/* Sidebar - Fixed, ne prend pas d'espace dans le flux */}
        <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>
        <AdminSidebar language={language} />
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{currentTexts.title}</h1>

          {/* Barre de recherche */}
          {reservations.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={currentTexts.searchPlaceholder}
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
                <FileText className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <CardTitle className="text-xl mb-2">{currentTexts.empty}</CardTitle>
                <CardDescription>{currentTexts.emptyDescription}</CardDescription>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {paginatedReservations.map((reservation) => {
                  const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
                  const dateRange = `${formatDate(reservation.start_date)} → ${formatDate(reservation.end_date)}`;
                  
                  return (
                    <Card 
                      key={reservation.id} 
                      className="hover:shadow-md transition-all cursor-pointer"
                      onClick={() => openModal(reservation)}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Numéro de réservation */}
                            <h3 className="font-bold text-gray-900 text-lg mb-3">
                              #{reservationNumber}
                            </h3>
                            
                            {/* Date avec icône calendrier */}
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm">{dateRange}</span>
                            </div>
                            
                            {/* Lieu avec icône map pin */}
                            {reservation.address && (
                              <div className="flex items-center gap-2 text-gray-600 mb-3">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm truncate">{reservation.address}</span>
                              </div>
                            )}
                            
                            {/* Statut */}
                            <div className="mt-3">
                              {getStatusBadge(reservation.id)}
                            </div>
                          </div>
                          
                          {/* Bouton circulaire orange avec chevron */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(reservation);
                            }}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                            aria-label={currentTexts.view}
                          >
                            <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
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
          )}
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
      <Footer language={language} />

      {/* Modal pour gérer l'état des lieux */}
      {selectedReservation && (
        <EtatDesLieuxModal
          isOpen={isModalOpen}
          onClose={closeModal}
          reservation={selectedReservation}
          language={language}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
