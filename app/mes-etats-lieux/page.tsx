'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/hooks/useUser';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
      <DashboardSidebar language={language} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 overflow-y-auto w-full lg:w-auto">
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
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📄</div>
              <p className="text-xl text-gray-600 mb-2">{currentTexts.empty}</p>
              <p className="text-gray-500 mb-8">{currentTexts.emptyDescription}</p>
            </div>
          ) : (
            <>
              <div className="space-y-6 mb-6">
                {paginatedEtatsLieux.map((etatLieux) => {
                  const reservation = reservations[etatLieux.reservation_id];
                  const reservationNumber = reservation?.id ? reservation.id.slice(0, 8).toUpperCase() : 'N/A';
                  
                  return (
                    <div
                      key={etatLieux.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 sm:px-6 py-4 bg-purple-50 border-b border-purple-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                                {currentTexts.reservationNumber} #{reservationNumber}
                              </h3>
                            </div>
                          </div>
                          {reservation && (
                            <Link
                              href={`/mes-reservations/${reservation.id}`}
                              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors text-sm sm:text-base whitespace-nowrap"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {currentTexts.viewDetails}
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {/* Informations */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.status}</h4>
                              <div className="flex items-center gap-2 text-gray-900">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  etatLieux.status === 'reprise_complete'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {getStatusText(etatLieux.status)}
                                </span>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.createdAt}</h4>
                              <div className="flex items-center gap-2 text-gray-900">
                                <svg className="w-5 h-5 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">{formatDate(etatLieux.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Téléchargement PDF */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-3">{currentTexts.downloadPDF}</h4>
                              <a
                                href={`/api/etat-lieux/download?reservationId=${etatLieux.reservation_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {currentTexts.downloadPDF}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {currentTexts.previous}
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {currentTexts.next}
                    </button>
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
