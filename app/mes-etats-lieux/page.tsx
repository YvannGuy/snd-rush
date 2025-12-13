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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// Icônes lucide-react
import { 
  FileText, 
  Download,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight
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
        <div className="flex flex-1 pt-[112px]">
          <DashboardSidebar language={language} />
          <main className="flex-1 flex items-center justify-center">
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
                  
                  // Parser les items JSONB
                  let items: any[] = [];
                  try {
                    if (etatLieux.items && typeof etatLieux.items === 'string') {
                      items = JSON.parse(etatLieux.items);
                    } else if (Array.isArray(etatLieux.items)) {
                      items = etatLieux.items;
                    }
                  } catch (e) {
                    console.error('Erreur parsing items:', e);
                  }

                  // Détecter les anomalies (matériel endommagé)
                  const hasAnomalies = items.some((item: any) => 
                    item.etatApres?.etat === 'endommage' || 
                    item.etatApres?.etat === 'casse' ||
                    item.commentaires?.toLowerCase().includes('dommage') ||
                    item.commentaires?.toLowerCase().includes('casse')
                  );

                  return (
                    <Card key={etatLieux.id} className="hover:shadow-lg transition-all">
                      {/* Header */}
                      <CardHeader className="bg-purple-50 border-b border-purple-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base sm:text-lg truncate">
                                {currentTexts.reservationNumber} #{reservationNumber}
                              </CardTitle>
                            </div>
                          </div>
                          {reservation && (
                            <Button
                              asChild
                              variant="default"
                              className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                            >
                              <Link href={`/mes-reservations/${reservation.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                {currentTexts.viewDetails}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardHeader>

                      {/* Contenu */}
                      <CardContent className="p-4 sm:p-6">
                        {/* Alert si anomalies */}
                        {hasAnomalies && (
                          <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>{language === 'fr' ? 'Anomalie détectée' : 'Anomaly detected'}</AlertTitle>
                            <AlertDescription>
                              {language === 'fr' 
                                ? 'Du matériel présente des dommages. Cela peut impacter le dépôt de garantie.'
                                : 'Some equipment shows damage. This may impact the deposit.'}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {/* Informations */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.status}</h4>
                              <Badge 
                                variant={etatLieux.status === 'reprise_complete' ? 'default' : 'secondary'}
                                className={
                                  etatLieux.status === 'reprise_complete'
                                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                }
                              >
                                {etatLieux.status === 'reprise_complete' ? (
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                ) : (
                                  <Clock className="w-3 h-3 mr-1" />
                                )}
                                {getStatusText(etatLieux.status)}
                              </Badge>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.createdAt}</h4>
                              <div className="flex items-center gap-2 text-gray-900">
                                <Calendar className="w-5 h-5 text-[#F2431E]" />
                                <span className="font-medium">{formatDate(etatLieux.created_at)}</span>
                              </div>
                            </div>

                            {/* Matériel avec photos */}
                            {items.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-3">{language === 'fr' ? 'Matériel vérifié' : 'Verified equipment'}</h4>
                                <div className="space-y-2">
                                  {items.slice(0, 3).map((item: any, idx: number) => (
                                    <Card key={idx} className="p-3 bg-gray-50 border-gray-200">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm text-gray-900">{item.nom || item.id}</p>
                                          {item.etatAvant && (
                                            <p className="text-xs text-gray-600 mt-1">
                                              {language === 'fr' ? 'État avant:' : 'State before:'} {item.etatAvant.etat || 'N/A'}
                                            </p>
                                          )}
                                          {item.etatApres && (
                                            <p className="text-xs text-gray-600">
                                              {language === 'fr' ? 'État après:' : 'State after:'} {item.etatApres.etat || 'N/A'}
                                            </p>
                                          )}
                                        </div>
                                        {(item.photosAvant?.length > 0 || item.photosApres?.length > 0) && (
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <ImageIcon className="w-4 h-4" />
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                              <DialogHeader>
                                                <DialogTitle>{item.nom || item.id}</DialogTitle>
                                              </DialogHeader>
                                              <div className="grid grid-cols-2 gap-4 mt-4">
                                                {item.photosAvant?.length > 0 && (
                                                  <div>
                                                    <h5 className="font-semibold mb-2">{language === 'fr' ? 'Photos avant' : 'Photos before'}</h5>
                                                    <div className="grid grid-cols-2 gap-2">
                                                      {item.photosAvant.map((photo: any, pIdx: number) => (
                                                        <img key={pIdx} src={photo.url} alt={photo.label || 'Photo avant'} className="rounded-lg w-full" />
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                                {item.photosApres?.length > 0 && (
                                                  <div>
                                                    <h5 className="font-semibold mb-2">{language === 'fr' ? 'Photos après' : 'Photos after'}</h5>
                                                    <div className="grid grid-cols-2 gap-2">
                                                      {item.photosApres.map((photo: any, pIdx: number) => (
                                                        <img key={pIdx} src={photo.url} alt={photo.label || 'Photo après'} className="rounded-lg w-full" />
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        )}
                                      </div>
                                    </Card>
                                  ))}
                                  {items.length > 3 && (
                                    <p className="text-xs text-gray-500 text-center">
                                      {language === 'fr' ? `+ ${items.length - 3} autre(s) matériel(s)` : `+ ${items.length - 3} other item(s)`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Téléchargement PDF */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-3">{currentTexts.downloadPDF}</h4>
                              <Button
                                asChild
                                variant="default"
                                className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                              >
                                <a
                                  href={`/api/etat-lieux/download?reservationId=${etatLieux.reservation_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {currentTexts.downloadPDF}
                                </a>
                              </Button>
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
