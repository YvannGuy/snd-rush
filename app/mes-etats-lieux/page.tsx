'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/hooks/useUser';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import SignModal from '@/components/auth/SignModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// Icônes lucide-react
import { 
  FileText, 
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  AlertTriangle,
  X
} from 'lucide-react';

export default function MesEtatsLieuxPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [etatsLieux, setEtatsLieux] = useState<any[]>([]);
  const [reservations, setReservations] = useState<Record<string, any>>({});
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();
  
  // États pour le carrousel de photos
  const [carouselState, setCarouselState] = useState<{
    phase: 'before' | 'after' | null;
    index: number;
    photos: string[];
  }>({ phase: null, index: 0, photos: [] });

  // Rediriger vers l'accueil si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  // Marquer les états des lieux comme consultés quand la page est visitée
  useEffect(() => {
    if (!user || !supabase || typeof window === 'undefined') return;
    
    const markAsViewed = async () => {
      try {
        if (!supabase) return;
        // D'abord charger les réservations de l'utilisateur
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('id')
          .eq('user_id', user.id);
        
        if (!reservationsData || reservationsData.length === 0) return;
        
        // Ensuite charger les états des lieux associés
        const { data: etatsLieuxData } = await supabase
          .from('etat_lieux')
          .select('id')
          .in('reservation_id', reservationsData.map(r => r.id));
        
        if (etatsLieuxData && etatsLieuxData.length > 0) {
          const viewedIds = etatsLieuxData.map(el => el.id);
          localStorage.setItem('viewed_condition_reports', JSON.stringify(viewedIds));
          // Dispatcher un événement pour mettre à jour les compteurs du dashboard
          window.dispatchEvent(new CustomEvent('pendingActionsUpdated'));
        }
      } catch (error) {
        console.error('Erreur marquage états des lieux comme consultés:', error);
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

        // Créer un map reservation_id -> reservation
        const reservationsMap: Record<string, any> = {};
        (reservationsData || []).forEach((r) => {
          reservationsMap[r.id] = r;
        });
        setReservations(reservationsMap);

        // Charger uniquement les états des lieux avec PDF (status = livraison_complete ou reprise_complete)
        if (reservationsData && reservationsData.length > 0) {
          const reservationIds = reservationsData.map(r => r.id);
          
          const { data: etatsLieuxData, error: etatsLieuxError } = await supabase
            .from('etat_lieux')
            .select('*')
            .in('reservation_id', reservationIds)
            .in('status', ['livraison_complete', 'reprise_complete'])
            .order('created_at', { ascending: false });

          if (etatsLieuxError) {
            console.error('Erreur chargement états des lieux:', etatsLieuxError);
          } else if (etatsLieuxData) {
            // Garder seulement le plus récent par réservation
            const etatsLieuxMap: Record<string, any> = {};
            etatsLieuxData.forEach((etat) => {
              if (!etatsLieuxMap[etat.reservation_id] || 
                  new Date(etat.created_at) > new Date(etatsLieuxMap[etat.reservation_id].created_at)) {
                etatsLieuxMap[etat.reservation_id] = etat;
              }
            });
            setEtatsLieux(Object.values(etatsLieuxMap));
          }
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    loadData();
  }, [user]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { fr: string; en: string }> = {
      'livraison_complete': { fr: 'Livraison effectuée', en: 'Delivery completed' },
      'reprise_complete': { fr: 'Reprise effectuée', en: 'Return completed' },
    };
    return statusMap[status]?.[language] || status;
  };

  const texts = {
    fr: {
      title: 'États des lieux',
      empty: 'Aucun état des lieux',
      emptyDescription: 'Vous n\'avez pas encore d\'états des lieux validés.',
      reservationNumber: 'Réservation',
      status: 'Statut',
      downloadPDF: 'Télécharger le PDF',
      viewDetails: 'Voir les détails',
      createdAt: 'Date de création',
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page',
      of: 'sur',
    },
    en: {
      title: 'Condition reports',
      empty: 'No condition reports',
      emptyDescription: 'You don\'t have any validated condition reports yet.',
      reservationNumber: 'Reservation',
      status: 'Status',
      downloadPDF: 'Download PDF',
      viewDetails: 'View details',
      createdAt: 'Creation date',
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
              <p className="text-xl text-gray-600 mb-8">Connectez-vous pour voir vos états des lieux.</p>
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

  const totalPages = Math.ceil(etatsLieux.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEtatsLieux = etatsLieux.slice(startIndex, endIndex);

  // Fonctions pour le carrousel de photos
  const openCarousel = (phase: 'before' | 'after', photos: string[]) => {
    setCarouselState({ phase, index: 0, photos });
  };

  const closeCarousel = () => {
    setCarouselState({ phase: null, index: 0, photos: [] });
  };

  const nextPhoto = () => {
    setCarouselState(prev => ({
      ...prev,
      index: prev.index < prev.photos.length - 1 ? prev.index + 1 : 0
    }));
  };

  const prevPhoto = () => {
    setCarouselState(prev => ({
      ...prev,
      index: prev.index > 0 ? prev.index - 1 : prev.photos.length - 1
    }));
  };

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

          {etatsLieux.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <CardTitle className="text-xl mb-2">{currentTexts.empty}</CardTitle>
                <CardDescription className="mb-8">{currentTexts.emptyDescription}</CardDescription>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-6 mb-6">
                {paginatedEtatsLieux.map((etatLieux) => {
                  const reservation = reservations[etatLieux.reservation_id];
                  const reservationNumber = reservation?.id ? reservation.id.slice(0, 8).toUpperCase() : 'N/A';
                  
                  // Parser les items JSONB (nouvelle structure avec zones)
                  let itemsData: any = {};
                  try {
                    if (etatLieux.items && typeof etatLieux.items === 'string') {
                      itemsData = JSON.parse(etatLieux.items);
                    } else if (etatLieux.items) {
                      itemsData = etatLieux.items;
                    }
                  } catch (e) {
                    console.error('Erreur parsing items:', e);
                  }

                  // Extraire les photos de toutes les zones (nouvelle structure)
                  const extractPhotosFromZones = (zones: any) => {
                    if (!zones || typeof zones !== 'object') return [];
                    const allPhotos: string[] = [];
                    Object.values(zones).forEach((zone: any) => {
                      if (zone && Array.isArray(zone.photos)) {
                        zone.photos.forEach((photo: any) => {
                          if (typeof photo === 'string') {
                            allPhotos.push(photo);
                          } else if (photo && photo.url) {
                            allPhotos.push(photo.url);
                          }
                        });
                      }
                    });
                    return allPhotos;
                  };

                  // Compatibilité avec ancienne structure
                  let photosAvant: string[] = [];
                  let photosApres: string[] = [];
                  let commentaireAvant = '';
                  let commentaireApres = '';
                  let detectedDamages: Array<{ phase: 'before' | 'after'; type: string; note?: string }> = [];

                  if (itemsData.before && itemsData.after) {
                    // Nouvelle structure avec zones
                    photosAvant = extractPhotosFromZones(itemsData.before);
                    photosApres = extractPhotosFromZones(itemsData.after);
                    commentaireAvant = itemsData.globalCommentBefore || '';
                    commentaireApres = itemsData.globalCommentAfter || '';
                    detectedDamages = itemsData.detectedDamages || [];
                  } else if (itemsData.photos_avant || itemsData.photos_apres) {
                    // Ancienne structure
                    photosAvant = Array.isArray(itemsData.photos_avant) ? itemsData.photos_avant : [];
                    photosApres = Array.isArray(itemsData.photos_apres) ? itemsData.photos_apres : [];
                    commentaireAvant = itemsData.commentaire_avant || '';
                    commentaireApres = itemsData.commentaire_apres || '';
                  }

                  // Déterminer le statut et les couleurs
                  const status = etatLieux.status || 'brouillon';
                  const getStatusBadgeColor = (status: string) => {
                    if (status === 'reprise_complete' || status === 'livraison_complete') {
                      return { bg: 'bg-green-100', dot: 'bg-green-500', text: 'text-green-800' };
                    } else if (status === 'livraison_complete') {
                      return { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-800' };
                    }
                    return { bg: 'bg-gray-100', dot: 'bg-gray-500', text: 'text-gray-800' };
                  };
                  const badgeColors = getStatusBadgeColor(status);
                  const statusLabel = status === 'reprise_complete' 
                    ? (language === 'fr' ? 'Reprise complète' : 'Pickup complete')
                    : status === 'livraison_complete'
                    ? (language === 'fr' ? 'Livraison complète' : 'Delivery complete')
                    : (language === 'fr' ? 'Brouillon' : 'Draft');
                  
                  const createdAt = new Date(etatLieux.created_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  });
                  
                  return (
                    <Card key={etatLieux.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Badge de statut avec point coloré */}
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={`${badgeColors.bg} ${badgeColors.text} border-0 px-3 py-1`}>
                                <span className={`w-2 h-2 rounded-full ${badgeColors.dot} mr-2 inline-block`}></span>
                                {statusLabel}
                              </Badge>
                            </div>
                            
                            {/* Titre */}
                            <h3 className="font-bold text-gray-900 text-lg mb-3">
                              {language === 'fr' ? 'État des lieux' : 'Condition report'} #{reservationNumber}
                            </h3>
                            
                            {/* Date de création */}
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm">
                                {language === 'fr' ? 'Créé le' : 'Created on'} {createdAt}
                              </span>
                            </div>
                            
                            {/* Photos */}
                            <div className="flex items-center gap-4 text-gray-600">
                              {photosAvant.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <ImageIcon className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">
                                    {photosAvant.length} {language === 'fr' ? 'avant' : 'before'}
                                  </span>
                                </div>
                              )}
                              {photosApres.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <ImageIcon className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">
                                    {photosApres.length} {language === 'fr' ? 'après' : 'after'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Boutons d'action */}
                          <div className="flex items-center gap-2">
                            {/* Bouton télécharger PDF */}
                            <a
                              href={`/api/etat-lieux/download?reservationId=${etatLieux.reservation_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                              title={language === 'fr' ? 'Télécharger le PDF' : 'Download PDF'}
                            >
                              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                            </a>
                            
                            {/* Bouton voir détails */}
                            <button
                              onClick={() => {
                                // Ouvrir un modal ou rediriger vers les détails
                                // Pour l'instant, on peut ouvrir le carrousel si des photos existent
                                if (photosAvant.length > 0) {
                                  openCarousel('before', photosAvant);
                                } else if (photosApres.length > 0) {
                                  openCarousel('after', photosApres);
                                }
                              }}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                              title={language === 'fr' ? 'Voir les détails' : 'View details'}
                            >
                              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
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

      {/* Carrousel de photos */}
      {carouselState.phase && carouselState.photos.length > 0 && (
        <Dialog open={true} onOpenChange={closeCarousel}>
          <DialogContent className="max-w-5xl max-h-[95vh] p-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>
                {carouselState.phase === 'before' 
                  ? (language === 'fr' ? 'Photos avant' : 'Photos before')
                  : (language === 'fr' ? 'Photos après' : 'Photos after')}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {carouselState.index + 1} / {carouselState.photos.length}
              </p>
            </DialogHeader>
            <div className="relative px-6 pb-6">
              <div className="relative w-full h-[70vh] flex items-center justify-center bg-black rounded-lg overflow-hidden">
                <img
                  src={carouselState.photos[carouselState.index]}
                  alt={`Photo ${carouselState.index + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Bouton précédent */}
                {carouselState.photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevPhoto}
                      className="absolute left-4 h-12 w-12 bg-black/50 hover:bg-black/70 text-white border-0"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    
                    {/* Bouton suivant */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextPhoto}
                      className="absolute right-4 h-12 w-12 bg-black/50 hover:bg-black/70 text-white border-0"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Indicateurs de navigation */}
              {carouselState.photos.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {carouselState.photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselState(prev => ({ ...prev, index: idx }))}
                      className={`h-2 rounded-full transition-all ${
                        idx === carouselState.index
                          ? 'w-8 bg-[#F2431E]'
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Photo ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
