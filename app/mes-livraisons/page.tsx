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
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📦</div>
              <p className="text-xl text-gray-600 mb-2">{currentTexts.empty}</p>
              <p className="text-gray-500 mb-8">{currentTexts.emptyDescription}</p>
              <Link
                href="/mes-reservations"
                className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
              >
                {language === 'fr' ? 'Voir mes réservations' : 'View my reservations'}
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-6 mb-6">
                {paginatedReservations.map((reservation) => {
                  const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
                  
                  return (
                    <div
                      key={reservation.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 sm:px-6 py-4 bg-blue-50 border-b border-blue-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                                {currentTexts.reservationNumber} #{reservationNumber}
                              </h3>
                            </div>
                          </div>
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
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {/* Informations de livraison */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.deliveryDate}</h4>
                              <div className="flex items-center gap-2 text-gray-900">
                                <svg className="w-5 h-5 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">{formatDate(reservation.start_date)}</span>
                              </div>
                            </div>

                            {reservation.end_date && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.returnDate}</h4>
                                <div className="flex items-center gap-2 text-gray-900">
                                  <svg className="w-5 h-5 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-medium">{formatDate(reservation.end_date)}</span>
                                </div>
                              </div>
                            )}

                            {reservation.address && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.address}</h4>
                                <p className="text-gray-900">{reservation.address}</p>
                              </div>
                            )}
                          </div>

                          {/* Statut de livraison/récupération */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-3">{currentTexts.status}</h4>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className={`font-semibold ${
                                      reservation.delivery_status === 'termine'
                                        ? 'text-green-800'
                                        : reservation.delivery_status === 'en_cours'
                                        ? 'text-yellow-800'
                                        : 'text-gray-600'
                                    }`}>
                                      {reservation.delivery_status === 'termine'
                                        ? (language === 'fr' ? '✅ Terminé' : '✅ Completed')
                                        : reservation.delivery_status === 'en_cours'
                                        ? (language === 'fr' ? '🔄 En cours' : '🔄 In progress')
                                        : (language === 'fr' ? '⏳ En attente' : '⏳ Pending')}
                                    </p>
                                  </div>
                                </div>
                              </div>
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
