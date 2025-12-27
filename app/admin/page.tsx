'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminApiClient';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  
  // Stats
  const [stats, setStats] = useState({
    upcomingReservations: 0,
    revenueThisMonth: 0,
    equipmentOut: 0,
    totalEquipment: 45,
    lateReturns: 0,
  });

  // Données
  const [upcomingReservations, setUpcomingReservations] = useState<any[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  // Données automatisation
  const [balanceDueReservations, setBalanceDueReservations] = useState<any[]>([]); // Solde à payer J-5
  const [depositDueReservations, setDepositDueReservations] = useState<any[]>([]); // Caution à demander J-2
  const [weekEvents, setWeekEvents] = useState<any[]>([]); // Événements de la semaine
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

  useEffect(() => {
    if (!user) return;
    // Attendre que la vérification admin soit terminée avant de charger les données
    if (checkingAdmin) {
      console.log('⏳ Vérification admin en cours, attente...');
      return;
    }
    
    // Si l'utilisateur n'est pas admin après vérification, ne pas charger les données
    if (!isAdmin) {
      console.log('⚠️ Utilisateur non admin, arrêt du chargement');
      return;
    }

    const loadAdminData = async () => {
      setLoadingDashboard(true);
      setDashboardError(null);

      try {
        const data = await adminFetch<{
          stats: {
            upcoming_30d: number;
            revenue_month: number;
            equipment_out: number;
            total_equipment: number;
            late_returns: number;
          };
          automation: {
            balance_due: any[];
            deposit_due: any[];
            week_events: any[];
          };
          upcoming: any[];
          equipment_status: any[];
          recent_clients: any[];
          calendar: { day: string; count: number }[];
        }>('/api/admin/dashboard');

        // Mettre à jour les stats
        setStats({
          upcomingReservations: data.stats?.upcoming_30d || 0,
          revenueThisMonth: data.stats?.revenue_month || 0,
          equipmentOut: data.stats?.equipment_out || 0,
          totalEquipment: data.stats?.total_equipment || 45,
          lateReturns: data.stats?.late_returns || 0,
        });

        // Adapter les réservations à venir pour compatibilité avec le rendu existant
        const adaptedUpcoming = (data.upcoming || []).map((r: any) => ({
          ...r,
          start_date: r.start_at,
          end_date: r.end_at,
          total_price: r.price_total,
          pack_id: r.pack_key,
        }));
        setUpcomingReservations(adaptedUpcoming);

        // Adapter l'équipement
        const adaptedEquipment = (data.equipment_status || []).map((item: any) => ({
          ...item,
          start_date: item.start_at,
          end_date: item.end_at,
          total_price: item.price_total || 0,
          pack_id: item.pack_key,
        }));
        setEquipmentStatus(adaptedEquipment);

        // Clients récents
        setRecentClients(data.recent_clients || []);

        // Calendrier (adapter pour le format attendu)
        const adaptedCalendar = (data.calendar || []).map((c: any) => ({
          start_at: c.day,
          end_at: c.day,
          status: 'CONFIRMED',
        }));
        setCalendarData(adaptedCalendar);

        // Automatisation
        setBalanceDueReservations(data.automation?.balance_due || []);
        setDepositDueReservations(data.automation?.deposit_due || []);
        setWeekEvents(data.automation?.week_events || []);

      } catch (error: unknown) {
        console.error('❌ Erreur chargement dashboard admin:', error);
        setDashboardError(error instanceof Error ? error.message : 'Erreur lors du chargement');
        // En cas d'erreur, initialiser les états vides pour éviter les crashes
        setUpcomingReservations([]);
        setStats({
          upcomingReservations: 0,
          revenueThisMonth: 0,
          equipmentOut: 0,
          totalEquipment: 45,
          lateReturns: 0,
        });
      } finally {
        setLoadingDashboard(false);
      }
    };

    loadAdminData();
  }, [user, checkingAdmin, isAdmin]);

  const texts = {
    fr: {
      upcomingReservations: 'Réservations à venir',
      revenueThisMonth: 'CA ce mois',
      equipmentOut: 'Matériel sorti',
      lateReturns: 'Retours en retard',
      upcomingReservationsList: 'Prochaines réservations',
      viewAll: 'Voir toutes',
      delivery: 'Livraison',
      installation: 'Installation',
      return: 'Retour prévu',
      confirmed: 'Confirmée',
      inProgress: 'En cours',
      returnStatus: 'Retour',
      quickActions: 'Actions rapides',
      addProduct: '+ Ajouter un produit',
      createPack: 'Créer un pack',
      manualReservation: 'Réservation manuelle',
      generateInvoice: 'Générer facture',
      equipmentStatus: 'Retour matériel',
      viewPlanning: 'Voir planning',
      contact: 'Contacter',
      lateReturn: 'Retour en retard',
      returnToday: 'Retour prévu aujourd\'hui',
      available: 'Disponible',
      stock: 'Stock',
      units: 'unités',
      recentClients: 'Clients récents',
      viewAllClients: 'Voir tous',
      reservations: 'réservations',
      reservationPlanning: 'Planning des réservations',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder au tableau de bord administrateur.',
      signIn: 'Se connecter',
    },
    en: {
      upcomingReservations: 'Upcoming reservations',
      revenueThisMonth: 'Revenue this month',
      equipmentOut: 'Equipment out',
      lateReturns: 'Late returns',
      upcomingReservationsList: 'Upcoming reservations',
      viewAll: 'View all',
      delivery: 'Delivery',
      installation: 'Installation',
      return: 'Return expected',
      confirmed: 'Confirmed',
      inProgress: 'In progress',
      returnStatus: 'Return',
      quickActions: 'Quick actions',
      addProduct: '+ Add a product',
      createPack: 'Create a pack',
      manualReservation: 'Manual reservation',
      generateInvoice: 'Generate invoice',
      equipmentStatus: 'Equipment Status',
      viewPlanning: 'View planning',
      contact: 'Contact',
      lateReturn: 'Late return',
      returnToday: 'Return expected today',
      available: 'Available',
      stock: 'Stock',
      units: 'units',
      recentClients: 'Recent Clients',
      viewAllClients: 'View all',
      reservations: 'reservations',
      reservationPlanning: 'Reservation Planning',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access the administrator dashboard.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];


  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'CONFIRMED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'En cours': 'bg-yellow-100 text-yellow-800',
      'Retour': 'bg-blue-100 text-blue-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string, endDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (status === 'CONFIRMED') {
      if (end < today) {
        return { text: currentTexts.lateReturn, color: 'bg-red-100 text-red-800' };
      }
      if (end.getTime() === today.getTime()) {
        return { text: currentTexts.returnToday, color: 'bg-yellow-100 text-yellow-800' };
      }
      return { text: currentTexts.inProgress, color: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: status, color: getStatusColor(status) };
  };

  const getPackName = (packId: string | null) => {
    if (!packId) return 'Réservation';
    const packNames: { [key: string]: string } = {
      '1': 'Pack Essentiel',
      '2': 'Pack Standard',
      '3': 'Pack Premium',
      '4': 'Pack Événement',
      'pack-1': 'Pack Essentiel',
      'pack-2': 'Pack Standard',
      'pack-3': 'Pack Premium',
      'pack-4': 'Pack Événement',
      // Nouveaux packs (client_reservations)
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage',
    };
    return packNames[packId] || `Pack ${packId}`;
  };

  // Générer le calendrier du mois
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // Marquer les jours avec réservations (depuis client_reservations)
    const daysWithReservations = new Set();
    calendarData.forEach((reservation: any) => {
      const start = new Date(reservation.start_at || reservation.start_date);
      const end = new Date(reservation.end_at || reservation.end_date);
      for (let d = start.getDate(); d <= end.getDate(); d++) {
        if (d <= daysInMonth) {
          daysWithReservations.add(d);
        }
      }
    });

    return { days, daysWithReservations, month, year };
  };

  const calendar = generateCalendar();
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const currentDay = new Date().getDate();

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas admin, ne rien afficher (redirection en cours)
  if (!isAdmin && !checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Accès refusé</h1>
          <p className="text-xl text-gray-600 mb-8">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <AdminSidebar language={language} />

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentTexts.signInRequired}</h1>
            <p className="text-xl text-gray-600 mb-8">{currentTexts.signInDescription}</p>
            <button
              onClick={() => router.push('/auth/admin/login')}
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.signIn}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Double vérification de sécurité avant d'afficher le contenu admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header language={language} onLanguageChange={setLanguage} />

      <div className="flex flex-1 lg:flex-row">
        {/* Sidebar - Fixed, ne prend pas d'espace dans le flux */}
        <div className="hidden lg:block flex-shrink-0 transition-all duration-300 w-64"></div>
        <AdminSidebar
          language={language}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
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
              onClick={() => setIsSidebarOpen((v) => !v)} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-expanded={isSidebarOpen}
              aria-controls="admin-sidebar"
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {/* Loading state */}
              {loadingDashboard && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
                </div>
              )}

              {/* Error state */}
              {dashboardError && !loadingDashboard && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 font-semibold">Erreur de chargement</p>
                  <p className="text-red-600 text-sm mt-1">{dashboardError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {/* Bouton Nouvelle réservation - Uniquement sur le tableau de bord */}
              {!loadingDashboard && !dashboardError && (
                <div className="mb-6 flex justify-end">
                  <Link
                    href="/admin/reservations/nouvelle"
                    className="bg-[#F2431E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors whitespace-nowrap"
                  >
                    + Nouvelle réservation
                  </Link>
                </div>
              )}
              {/* Stats Cards */}
              {!loadingDashboard && !dashboardError && (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.upcomingReservations}</div>
                  <div className="text-sm sm:text-base text-gray-600">{currentTexts.upcomingReservations}</div>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.revenueThisMonth.toLocaleString('fr-FR')}€</div>
                  <div className="text-sm sm:text-base text-gray-600">{currentTexts.revenueThisMonth}</div>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.equipmentOut}/{stats.totalEquipment}</div>
                  <div className="text-sm sm:text-base text-gray-600">{currentTexts.equipmentOut}</div>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.lateReturns}</div>
                  <div className="text-sm sm:text-base text-gray-600">{currentTexts.lateReturns}</div>
                </div>
              </div>

              {/* Sections Automatisation - Automation First */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Paiements à venir (J-5) */}
                {balanceDueReservations.length > 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        ⏳ Solde à payer (J-5)
                      </h2>
                      <Badge className="bg-yellow-500 text-white">
                        {balanceDueReservations.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {balanceDueReservations.slice(0, 3).map((reservation) => {
                        const packNames: Record<string, string> = {
                          'conference': 'Pack Conférence',
                          'soiree': 'Pack Soirée',
                          'mariage': 'Pack Mariage'
                        };
                        const packName = packNames[reservation.pack_key] || reservation.pack_key;
                        const balanceAmount = reservation.balance_amount 
                          ? parseFloat(reservation.balance_amount.toString())
                          : Math.round(parseFloat(reservation.price_total.toString()) * 0.7);
                        return (
                          <div key={reservation.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                            <p className="font-semibold text-sm text-gray-900">{packName}</p>
                            <p className="text-xs text-gray-600">{reservation.customer_email}</p>
                            <p className="text-sm font-bold text-yellow-600 mt-1">{balanceAmount.toFixed(2)}€</p>
                            {reservation.balance_due_at && (
                              <p className="text-xs text-gray-500">
                                Échéance: {new Date(reservation.balance_due_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cautions à demander (J-2) */}
                {depositDueReservations.length > 0 && (
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        🔒 Cautions à demander (J-2)
                      </h2>
                      <Badge className="bg-blue-500 text-white">
                        {depositDueReservations.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {depositDueReservations.slice(0, 3).map((reservation) => {
                        const packNames: Record<string, string> = {
                          'conference': 'Pack Conférence',
                          'soiree': 'Pack Soirée',
                          'mariage': 'Pack Mariage'
                        };
                        const packName = packNames[reservation.pack_key] || reservation.pack_key;
                        return (
                          <div key={reservation.id} className="bg-white rounded-lg p-3 border border-blue-200">
                            <p className="font-semibold text-sm text-gray-900">{packName}</p>
                            <p className="text-xs text-gray-600">{reservation.customer_email}</p>
                            <p className="text-sm font-bold text-blue-600 mt-1">
                              {reservation.deposit_amount ? parseFloat(reservation.deposit_amount.toString()).toFixed(2) : '0'}€
                            </p>
                            {reservation.deposit_requested_at && (
                              <p className="text-xs text-gray-500">
                                À demander: {new Date(reservation.deposit_requested_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Événements de la semaine */}
                {weekEvents.length > 0 && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        📅 Événements cette semaine
                      </h2>
                      <Badge className="bg-green-500 text-white">
                        {weekEvents.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {weekEvents.slice(0, 3).map((reservation) => {
                        const packNames: Record<string, string> = {
                          'conference': 'Pack Conférence',
                          'soiree': 'Pack Soirée',
                          'mariage': 'Pack Mariage'
                        };
                        const packName = packNames[reservation.pack_key] || reservation.pack_key;
                        return (
                          <div key={reservation.id} className="bg-white rounded-lg p-3 border border-green-200">
                            <p className="font-semibold text-sm text-gray-900">{packName}</p>
                            {reservation.start_at && (
                              <p className="text-xs text-gray-600">
                                {new Date(reservation.start_at).toLocaleDateString('fr-FR', { 
                                  weekday: 'short', 
                                  day: 'numeric', 
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                            {reservation.address && (
                              <p className="text-xs text-gray-500 mt-1">{reservation.address}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Réservations à venir */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{currentTexts.upcomingReservationsList}</h2>
                    <Link href="/admin/reservations" className="text-[#F2431E] font-semibold hover:underline text-xs sm:text-sm">
                      {currentTexts.viewAll}
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {upcomingReservations.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        {language === 'fr' 
                          ? 'Aucune réservation à venir' 
                          : 'No upcoming reservations'}
                      </p>
                    ) : (
                      upcomingReservations.slice(0, 3).map((reservation) => {
                        const order = reservation.order || {};
                        const endDate = reservation.end_date || reservation.end_at;
                        const statusInfo = getStatusText(reservation.status, endDate);
                        return (
                          <div key={reservation.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => router.push(`/admin/reservations?reservation=${reservation.id}`)}
                          >
                            <div className="w-10 h-10 bg-[#F2431E] rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 mb-1">
                                {getPackName(reservation.pack_id || reservation.pack_key)} - {order?.customer_name || reservation.customer_email?.split('@')[0] || 'Client'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {currentTexts.delivery} {formatTime(reservation.start_date || reservation.start_at)} - {reservation.address || 'Paris'}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {order?.total || reservation.total_price || reservation.price_total || 0}€
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                              {/* Accès rapide documents */}
                              <Link
                                href={`/admin/reservations?reservation=${reservation.id}`}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{currentTexts.quickActions}</h2>
                  <div className="space-y-3">
                    <Link
                      href="/admin/catalogue/nouveau"
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F2431E] rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900">{currentTexts.addProduct}</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/packs/nouveau"
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900">{currentTexts.createPack}</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* État du matériel */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{currentTexts.equipmentStatus}</h2>
                    <Link href="/admin/planning" className="text-[#F2431E] font-semibold hover:underline text-sm">
                      {currentTexts.viewPlanning}
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {equipmentStatus.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Aucun matériel sorti</p>
                    ) : (
                      equipmentStatus.map((item) => {
                        const order = item.order || {};
                        const statusInfo = getStatusText(item.status, item.end_date);
                        const isLate = new Date(item.end_date) < new Date();
                        return (
                          <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isLate ? 'bg-red-100' : statusInfo.text === currentTexts.returnToday ? 'bg-yellow-100' : 'bg-green-100'
                            }`}>
                              {isLate ? (
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 mb-1">
                                {getPackName(item.pack_id || item.pack_key)} - {order?.customer_name || item.customer_email?.split('@')[0] || 'Client'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {isLate 
                                  ? `${currentTexts.lateReturn} - Client: ${order?.customer_name || item.customer_email || 'N/A'}`
                                  : `${currentTexts.returnToday} ${formatTime(item.end_date || item.end_at)}`
                                }
                              </p>
                              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                            {isLate && (
                              <a 
                                href={`tel:${order?.customer_phone || item.customer_phone || ''}`}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors inline-block"
                              >
                                {currentTexts.contact}
                              </a>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Clients récents */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{currentTexts.recentClients}</h2>
                    <Link href="/admin/clients" className="text-[#F2431E] font-semibold hover:underline text-sm">
                      {currentTexts.viewAllClients}
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {recentClients.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Aucun client récent</p>
                    ) : (
                      recentClients.map((client, index) => (
                        <Link
                          key={index}
                          href={`/admin/clients/${client.email}`}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#F2431E] flex items-center justify-center text-white font-bold">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 mb-1">{client.name}</h3>
                            <p className="text-sm text-gray-600">
                              {client.reservations} {currentTexts.reservations} - {client.totalSpent.toLocaleString('fr-FR')}€
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Planning des réservations */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{currentTexts.reservationPlanning}</h2>
                  <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="font-semibold text-gray-900">
                      {monthNames[calendar.month]} {calendar.year}
                    </span>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {/* Jours de la semaine */}
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-1 sm:py-2">
                      {day}
                    </div>
                  ))}
                  {/* Jours du mois */}
                  {calendar.days.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="h-8 sm:h-12"></div>;
                    }
                    const hasReservation = calendar.daysWithReservations.has(day);
                    const isToday = day === currentDay;
                    return (
                      <div
                        key={day}
                        className={`h-8 sm:h-12 flex items-center justify-center rounded-lg text-xs sm:text-sm font-semibold ${
                          isToday
                            ? 'bg-[#F2431E] text-white'
                            : hasReservation
                            ? 'bg-blue-100 text-blue-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
              </>
              )}
            </div>
          </div>

          {/* Admin Footer */}
          <AdminFooter language={language} />
        </main>
      </div>

      {/* Footer principal */}
      <Footer language={language} />
    </div>
  );
}

