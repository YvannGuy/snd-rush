'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';

export default function AdminPlanningPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedReservations, setSelectedReservations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadReservations = async () => {
      try {
        const { data: reservationsData, error } = await supabase
          .from('reservations')
          .select('*')
          .order('start_date', { ascending: true });

        if (error) throw error;

        // Récupérer tous les orders pour enrichir les réservations
        const { data: allOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        // Récupérer tous les user_profiles pour enrichir avec les noms/prénoms
        const userIds = [...new Set((reservationsData || []).map((r: any) => r.user_id).filter(Boolean))];
        const { data: userProfiles } = userIds.length > 0 ? await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', userIds) : { data: [] };

        // Créer un map pour accès rapide aux profils utilisateur
        const userProfilesMap = new Map();
        (userProfiles || []).forEach((profile: any) => {
          userProfilesMap.set(profile.user_id, profile);
        });

        // Enrichir les réservations avec les noms des clients
        const enrichedReservations = (reservationsData || []).map((reservation) => {
          let customerName = 'Client';
          let customerEmail = '';
          let order = null;

          // D'abord, essayer de récupérer depuis user_profiles si user_id existe
          if (reservation.user_id && userProfilesMap.has(reservation.user_id)) {
            const profile = userProfilesMap.get(reservation.user_id);
            if (profile.first_name && profile.last_name) {
              customerName = `${profile.first_name} ${profile.last_name}`;
            } else if (profile.first_name) {
              customerName = profile.first_name;
            } else if (profile.last_name) {
              customerName = profile.last_name;
            }
            if (profile.email) {
              customerEmail = profile.email;
            }
          }

          // Chercher l'order associé via sessionId dans notes
          if (reservation.notes) {
            try {
              const notesData = JSON.parse(reservation.notes);
              if (notesData.sessionId && allOrders) {
                order = allOrders.find((o: any) => o.stripe_session_id === notesData.sessionId);
              }
              // Utiliser les infos du notes si disponibles et que le nom n'a pas été trouvé
              if (!customerName || customerName === 'Client') {
                if (notesData.customerName) customerName = notesData.customerName;
                if (notesData.customer_name) customerName = notesData.customer_name;
              }
              if (!customerEmail && notesData.customerEmail) {
                customerEmail = notesData.customerEmail;
              }
            } catch (e) {
              // Ignorer les erreurs de parsing
            }
          }

          // Si on a trouvé un order, utiliser ses infos (priorité moindre que user_profiles)
          if (order) {
            if (!customerName || customerName === 'Client') {
              customerName = order.customer_name || customerName;
            }
            if (!customerEmail) {
              customerEmail = order.customer_email || customerEmail;
            }
          }

          return {
            ...reservation,
            customerName,
            customerEmail,
            order,
          };
        });

        setReservations(enrichedReservations);
      } catch (error) {
        console.error('Erreur chargement réservations:', error);
      }
    };

    loadReservations();
  }, [user]);

  const generateCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // Créer une map des jours avec leurs réservations
    const daysWithReservations = new Map<number, any[]>();
    reservations.forEach((reservation) => {
      const start = new Date(reservation.start_date);
      const end = new Date(reservation.end_date);
      
      // Vérifier si la réservation est dans le mois actuel
      if (start.getMonth() === currentMonth && start.getFullYear() === currentYear) {
        const startDay = start.getDate();
        const endDay = Math.min(new Date(end.getTime() - 86400000).getDate(), daysInMonth); // end_date est exclusive
        
        for (let d = startDay; d <= endDay; d++) {
          if (!daysWithReservations.has(d)) {
            daysWithReservations.set(d, []);
          }
          daysWithReservations.get(d)!.push(reservation);
        }
      }
    });

    return { days, daysWithReservations };
  };

  const calendar = generateCalendar();
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const currentDay = new Date().getDate();
  const isCurrentMonth = currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

  const changeMonth = (direction: number) => {
    setCurrentMonth((prev) => {
      let newMonth = prev + direction;
      let newYear = currentYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      setCurrentYear(newYear);
      setCurrentPage(1); // Réinitialiser la page lors du changement de mois
      return newMonth;
    });
  };

  const handleDayClick = (day: number) => {
    const dayReservations = calendar.daysWithReservations.get(day) || [];
    if (dayReservations.length > 0) {
      setSelectedDay(day);
      setSelectedReservations(dayReservations);
      setIsModalOpen(true);
    }
  };

  const texts = {
    fr: {
      title: 'Planning & Disponibilités',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder au planning.',
      signIn: 'Se connecter',
      reservationsFor: 'Réservations du',
      noReservations: 'Aucune réservation',
      client: 'Client',
      dates: 'Dates',
      address: 'Adresse',
      status: 'Statut',
      close: 'Fermer',
      viewDetails: 'Voir les détails',
    },
    en: {
      title: 'Planning & Availabilities',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access planning.',
      signIn: 'Sign in',
      reservationsFor: 'Reservations for',
      noReservations: 'No reservations',
      client: 'Client',
      dates: 'Dates',
      address: 'Address',
      status: 'Status',
      close: 'Close',
      viewDetails: 'View details',
    },
  };

  const currentTexts = texts[language];

  // Charger l'état de la sidebar depuis localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === 'true');
    }
  }, []);

  // Sauvegarder l'état de la sidebar dans localStorage
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar language={language} />
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
          isAdmin={true}
          onSuccess={() => window.location.reload()}
          onOpenUserModal={() => router.push('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        <AdminSidebar 
          language={language} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{currentTexts.title}</h1>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="font-semibold text-gray-900 text-xl">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                  {calendar.days.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="h-20"></div>;
                    }
                    const dayReservations = calendar.daysWithReservations.get(day) || [];
                    const hasReservation = dayReservations.length > 0;
                    const isToday = isCurrentMonth && day === currentDay;
                    return (
                      <div
                        key={day}
                        onClick={() => hasReservation && handleDayClick(day)}
                        className={`h-20 flex flex-col items-center justify-center rounded-lg text-sm font-semibold relative ${
                          isToday
                            ? 'bg-[#F2431E] text-white'
                            : hasReservation
                            ? 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        title={hasReservation ? `${dayReservations.length} réservation(s) - Cliquez pour voir les détails` : ''}
                      >
                        <span>{day}</span>
                        {hasReservation && (
                          <span className="text-xs mt-1 font-bold">
                            {dayReservations.length}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Liste des réservations du mois */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Réservations de {monthNames[currentMonth]} {currentYear}
                </h2>
                {(() => {
                  const filteredReservations = reservations.filter((r) => {
                    const start = new Date(r.start_date);
                    return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
                  });

                  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
                  const paginatedReservations = filteredReservations.slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  );

                  return (
                    <>
                      {filteredReservations.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Aucune réservation ce mois-ci</p>
                      ) : (
                        <>
                          <div className="space-y-4 mb-6">
                            {paginatedReservations.map((reservation) => (
                              <div key={reservation.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-12 h-12 bg-[#F2431E] rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-900 mb-1">{reservation.customerName || 'Client'}</h3>
                                  <p className="text-sm text-gray-600">
                                    {new Date(reservation.start_date).toLocaleDateString('fr-FR')} - {new Date(reservation.end_date).toLocaleDateString('fr-FR')}
                                  </p>
                                  {reservation.address && (
                                    <p className="text-sm text-gray-500 mt-1">{reservation.address}</p>
                                  )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                  reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {reservation.status}
                                </span>
                              </div>
                            ))}
                          </div>

                          {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                              <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                              >
                                Précédent
                              </button>
                              <span className="px-4 py-2 text-gray-700">
                                Page {currentPage} sur {totalPages}
                              </span>
                              <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                              >
                                Suivant
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>

      {/* Footer principal */}
      <Footer language={language} />

      {/* Modal des détails de réservation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {currentTexts.reservationsFor} {selectedDay} {monthNames[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedReservations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{currentTexts.noReservations}</p>
              ) : (
                selectedReservations.map((reservation) => (
                  <div key={reservation.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">
                          {reservation.customerName || 'Client'}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-600">
                              <strong>{currentTexts.dates}:</strong>{' '}
                              {new Date(reservation.start_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })} - {new Date(reservation.end_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          {reservation.address && (
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-gray-600">
                                <strong>{currentTexts.address}:</strong> {reservation.address}
                              </span>
                            </div>
                          )}
                          {reservation.customerEmail && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-600">{reservation.customerEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reservation.status}
                        </span>
                        <Link
                          href={`/admin/reservations/${reservation.id}`}
                          className="text-[#F2431E] hover:text-[#E63A1A] text-sm font-semibold flex items-center gap-1"
                        >
                          {currentTexts.viewDetails}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
              >
                {currentTexts.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

