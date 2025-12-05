'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SignModal from '@/components/auth/SignModal';

export default function AdminPlanningPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user || !supabase) return;

    const loadReservations = async () => {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .order('start_date', { ascending: true });

        if (error) throw error;
        setReservations(data || []);
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
      return newMonth;
    });
  };

  const texts = {
    fr: {
      title: 'Planning & Disponibilités',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder au planning.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Planning & Availabilities',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access planning.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

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
      <div className="flex flex-1">
        <AdminSidebar language={language} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader language={language} />
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{currentTexts.title}</h1>
              
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
                        className={`h-20 flex flex-col items-center justify-center rounded-lg text-sm font-semibold relative ${
                          isToday
                            ? 'bg-[#F2431E] text-white'
                            : hasReservation
                            ? 'bg-blue-100 text-blue-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        title={hasReservation ? `${dayReservations.length} réservation(s)` : ''}
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
                <div className="space-y-4">
                  {reservations.filter((r) => {
                    const start = new Date(r.start_date);
                    return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
                  }).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucune réservation ce mois-ci</p>
                  ) : (
                    reservations
                      .filter((r) => {
                        const start = new Date(r.start_date);
                        return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
                      })
                      .map((reservation) => {
                        // Récupérer les infos client depuis notes
                        let customerName = 'Client';
                        let customerEmail = '';
                        if (reservation.notes) {
                          try {
                            const notesData = JSON.parse(reservation.notes);
                            customerName = notesData.customer_name || 'Client';
                            customerEmail = notesData.customer_email || '';
                          } catch (e) {
                            // Ignorer
                          }
                        }

                        return (
                          <div key={reservation.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-[#F2431E] rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 mb-1">{customerName}</h3>
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
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
    </div>
  );
}

