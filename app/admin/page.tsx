'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    reservationsToday: 0,
    revenueThisWeek: 0,
    equipmentOut: 0,
    totalEquipment: 45,
    lateReturns: 0,
  });

  // Données
  const [todayReservations, setTodayReservations] = useState<any[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadAdminData = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Calculer le début de la semaine (lundi)
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

        // 1. Réservations du jour
        const { data: reservationsData, error: reservationsError } = await supabaseClient
          .from('reservations')
          .select('*')
          .eq('start_date', todayStr)
          .order('created_at', { ascending: false });

        // Récupérer tous les orders pour enrichir les réservations
        const { data: allOrdersForReservations } = await supabaseClient
          .from('orders')
          .select('customer_email, customer_name, total, status, created_at, stripe_session_id, metadata')
          .order('created_at', { ascending: false });

        // Associer les orders aux réservations via sessionId dans notes
        let reservationsWithOrders = [];
        if (reservationsData) {
          reservationsWithOrders = reservationsData.map((reservation) => {
            let matchingOrder = null;
            
            // Chercher l'order via sessionId dans notes
            if (reservation.notes && allOrdersForReservations) {
              try {
                const notesData = JSON.parse(reservation.notes);
                if (notesData.sessionId) {
                  matchingOrder = allOrdersForReservations.find(
                    (o: any) => o.stripe_session_id === notesData.sessionId
                  );
                }
              } catch (e) {
                // Ignorer les erreurs de parsing
              }
            }

            return {
              ...reservation,
              order: matchingOrder,
            };
          });
        }

        if (reservationsError) {
          console.error('Erreur chargement réservations:', reservationsError);
        } else {
          setTodayReservations(reservationsWithOrders || []);
        }

        // 2. Statistiques - Réservations aujourd'hui
        const { count: reservationsTodayCount } = await supabaseClient
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('start_date', todayStr);

        // 3. Statistiques - CA cette semaine (depuis lundi)
        const { data: ordersThisWeek, error: ordersError } = await supabaseClient
          .from('orders')
          .select('total, status')
          .gte('created_at', startOfWeekStr)
          .eq('status', 'PAID');

        let revenueThisWeek = 0;
        if (ordersThisWeek) {
          revenueThisWeek = ordersThisWeek.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        }

        // 4. Statistiques - Matériel sorti (réservations actives)
        const { data: activeReservations, error: activeError } = await supabaseClient
          .from('reservations')
          .select('quantity')
          .lte('start_date', todayStr)
          .gte('end_date', todayStr)
          .eq('status', 'CONFIRMED');

        let equipmentOut = 0;
        if (activeReservations) {
          equipmentOut = activeReservations.reduce((sum, r) => sum + (r.quantity || 1), 0);
        }

        // 5. Retours en retard (réservations où end_date < aujourd'hui et status = CONFIRMED)
        const { data: lateReturns, error: lateError } = await supabaseClient
          .from('reservations')
          .select('id')
          .lt('end_date', todayStr)
          .eq('status', 'CONFIRMED');

        // 6. Clients récents (dernières commandes)
        const { data: recentOrders, error: clientsError } = await supabaseClient
          .from('orders')
          .select('customer_email, customer_name, total, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        // Grouper par client et calculer les stats
        const clientsMap = new Map();
        if (recentOrders) {
          recentOrders.forEach((order: any) => {
            const email = order.customer_email;
            if (!clientsMap.has(email)) {
              clientsMap.set(email, {
                email,
                name: order.customer_name || email.split('@')[0],
                reservations: 0,
                totalSpent: 0,
                lastOrder: order.created_at,
              });
            }
            const client = clientsMap.get(email);
            client.reservations += 1;
            client.totalSpent += parseFloat(order.total) || 0;
          });
        }

        // Compter les réservations par client
        const { data: allReservations } = await supabaseClient
          .from('reservations')
          .select('user_id');

        // Récupérer les emails des utilisateurs pour compter les réservations
        const clientsArray = Array.from(clientsMap.values()).slice(0, 3);

        // 7. État du matériel (réservations actives avec détails)
        const { data: equipmentData, error: equipmentError } = await supabaseClient
          .from('reservations')
          .select('*')
          .lte('start_date', todayStr)
          .gte('end_date', todayStr)
          .eq('status', 'CONFIRMED')
          .order('end_date', { ascending: true })
          .limit(5);

        // Enrichir avec les données des orders récents
        let equipmentWithOrders = [];
        if (equipmentData) {
          equipmentWithOrders = equipmentData.map((item) => {
            // Utiliser le premier order récent comme approximation
            const matchingOrder = recentOrdersForReservations?.[0] || null;
            return {
              ...item,
              order: matchingOrder,
            };
          });
        }

        // 8. Planning - Réservations pour le mois
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const { data: calendarReservations, error: calendarError } = await supabaseClient
          .from('reservations')
          .select('start_date, end_date, status')
          .gte('start_date', startOfMonth.toISOString().split('T')[0])
          .lte('start_date', endOfMonth.toISOString().split('T')[0]);

        setStats({
          reservationsToday: reservationsTodayCount || 0,
          revenueThisWeek: revenueThisWeek,
          equipmentOut: equipmentOut,
          totalEquipment: 45, // Valeur fixe pour l'instant
          lateReturns: lateReturns?.length || 0,
        });

        setEquipmentStatus(equipmentWithOrders || []);
        setRecentClients(clientsArray);
        setCalendarData(calendarReservations || []);

      } catch (error) {
        console.error('Erreur chargement dashboard admin:', error);
      }
    };

    loadAdminData();
  }, [user]);

  const texts = {
    fr: {
      reservationsToday: 'Réservations aujourd\'hui',
      revenueThisWeek: 'CA cette semaine',
      equipmentOut: 'Matériel sorti',
      lateReturns: 'Retours en retard',
      reservationsOfDay: 'Réservations du jour',
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
      equipmentStatus: 'État du matériel',
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
      reservationsToday: 'Reservations today',
      revenueThisWeek: 'Revenue this week',
      equipmentOut: 'Equipment out',
      lateReturns: 'Late returns',
      reservationsOfDay: 'Reservations of the day',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

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

    // Marquer les jours avec réservations
    const daysWithReservations = new Set();
    calendarData.forEach((reservation: any) => {
      const start = new Date(reservation.start_date);
      const end = new Date(reservation.end_date);
      for (let d = start.getDate(); d < end.getDate(); d++) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
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
          onSuccess={() => {
            setIsSignModalOpen(false);
            // Recharger la page pour afficher le dashboard admin
            window.location.reload();
          }}
          onOpenUserModal={() => {
            setIsSignModalOpen(false);
            // Rediriger vers le dashboard utilisateur pour ouvrir le modal utilisateur
            router.push('/dashboard');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar */}
        <AdminSidebar language={language} />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <AdminHeader language={language} />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.reservationsToday}</div>
                  <div className="text-gray-600">{currentTexts.reservationsToday}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.revenueThisWeek.toLocaleString('fr-FR')}€</div>
                  <div className="text-gray-600">{currentTexts.revenueThisWeek}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.equipmentOut}/{stats.totalEquipment}</div>
                  <div className="text-gray-600">{currentTexts.equipmentOut}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.lateReturns}</div>
                  <div className="text-gray-600">{currentTexts.lateReturns}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Réservations du jour */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{currentTexts.reservationsOfDay}</h2>
                    <Link href="/admin/reservations" className="text-[#F2431E] font-semibold hover:underline text-sm">
                      {currentTexts.viewAll}
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {todayReservations.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Aucune réservation aujourd'hui</p>
                    ) : (
                      todayReservations.slice(0, 3).map((reservation) => {
                        const order = reservation.order || {};
                        const statusInfo = getStatusText(reservation.status, reservation.end_date);
                        return (
                          <div key={reservation.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-[#F2431E] rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 mb-1">
                                {getPackName(reservation.pack_id)} - {order.customer_name || 'Client'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {currentTexts.delivery} {formatTime(reservation.start_date)} - Paris 11ème
                              </p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {order.total || reservation.total_price || 0}€
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{currentTexts.quickActions}</h2>
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
                    <Link
                      href="/admin/reservations/nouvelle"
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900">{currentTexts.manualReservation}</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/factures/nouvelle"
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900">{currentTexts.generateInvoice}</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* État du matériel */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{currentTexts.equipmentStatus}</h2>
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
                                {getPackName(item.pack_id)} - {order.customer_name || 'Client'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {isLate 
                                  ? `${currentTexts.lateReturn} - Client: ${order.customer_name || 'N/A'}`
                                  : `${currentTexts.returnToday} ${formatTime(item.end_date)}`
                                }
                              </p>
                              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                            {isLate && (
                              <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
                                {currentTexts.contact}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Clients récents */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{currentTexts.recentClients}</h2>
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
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{currentTexts.reservationPlanning}</h2>
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
                <div className="grid grid-cols-7 gap-2">
                  {/* Jours de la semaine */}
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                  {/* Jours du mois */}
                  {calendar.days.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="h-12"></div>;
                    }
                    const hasReservation = calendar.daysWithReservations.has(day);
                    const isToday = day === currentDay;
                    return (
                      <div
                        key={day}
                        className={`h-12 flex items-center justify-center rounded-lg text-sm font-semibold ${
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
            </div>
          </div>

          {/* Footer */}
          <AdminFooter language={language} />
        </main>
      </div>
    </div>
  );
}

