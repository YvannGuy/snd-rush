'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import SignModal from '@/components/auth/SignModal';
import DashboardSidebar from '@/components/DashboardSidebar';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function DashboardPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { signOut } = useAuth();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    signedContracts: 0,
    totalDeposit: 0,
    totalRentals: 0,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false);

  // Rediriger vers l'accueil si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (loading) return; // Attendre que le chargement soit terminé
    
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  // Vider le panier si demandé (après paiement principal)
  useEffect(() => {
    const clearCartParam = searchParams.get('clear_cart');
    if (clearCartParam === 'true' && typeof window !== 'undefined') {
      // Vider le localStorage du panier
      localStorage.removeItem('sndrush_cart');
      sessionStorage.setItem('cart_cleared', 'true');
      // Dispatcher un événement pour mettre à jour le badge du header
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: [], total: 0, depositTotal: 0 } }));
    }
  }, [searchParams]);

  // Confirmer la caution si on vient du succès du paiement
  useEffect(() => {
    const deposit = searchParams.get('deposit');
    const sessionId = searchParams.get('session_id');
    const reservationId = searchParams.get('reservation_id');

    if (deposit === 'success' && sessionId && reservationId && !isConfirmingDeposit) {
      setIsConfirmingDeposit(true);
      
      const confirmDeposit = async () => {
        try {
          console.log('💰 Confirmation de la caution via API:', { sessionId, reservationId });
          
          const response = await fetch('/api/deposit/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              reservationId,
            }),
          });

          const data = await response.json();

          if (data.success) {
            console.log('✅ Caution confirmée avec succès');
            // Recharger les données du dashboard
            if (user && supabase) {
              const loadDashboardData = async () => {
                const { data: reservationsData } = await supabase
                  .from('reservations')
                  .select('*')
                  .eq('user_id', user.id)
                  .order('start_date', { ascending: true });
                setReservations(reservationsData || []);
              };
              loadDashboardData();
            }
            // Nettoyer l'URL
            router.replace('/dashboard');
          } else {
            console.error('❌ Erreur confirmation caution:', data.error);
          }
        } catch (error) {
          console.error('❌ Erreur lors de la confirmation de la caution:', error);
        } finally {
          setIsConfirmingDeposit(false);
        }
      };

      confirmDeposit();
    }
  }, [searchParams, user, router, isConfirmingDeposit]);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadDashboardData = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      try {
        // Charger les réservations
        console.log('🔍 Chargement réservations pour user.id:', user.id);
        const { data: reservationsData, error: reservationsError } = await supabaseClient
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: true });

        if (reservationsError) {
          console.error('❌ Erreur chargement réservations:', reservationsError);
          throw reservationsError;
        }

        console.log('✅ Réservations trouvées:', reservationsData?.length || 0, reservationsData);
        setReservations(reservationsData || []);

        // Charger les commandes (factures)
        if (user.email) {
          try {
            const { data: ordersData, error: ordersError } = await supabaseClient
              .from('orders')
              .select('*')
              .eq('customer_email', user.email)
              .order('created_at', { ascending: false })
              .limit(5);

            if (ordersError) {
              // Logger l'erreur complète pour le débogage
              console.error('Erreur chargement commandes:', {
                message: ordersError.message || 'Erreur inconnue',
                details: ordersError.details || null,
                hint: ordersError.hint || null,
                code: ordersError.code || null,
                fullError: JSON.stringify(ordersError, Object.getOwnPropertyNames(ordersError))
              });
              // Ne pas bloquer l'affichage du dashboard si les commandes ne peuvent pas être chargées
              setOrders([]);
            } else {
              setOrders(ordersData || []);
            }
          } catch (error) {
            // Capturer les erreurs de sérialisation ou autres erreurs inattendues
            console.error('Erreur inattendue lors du chargement des commandes:', error);
            setOrders([]);
          }
        } else {
          // Si pas d'email, pas de commandes à charger
          setOrders([]);
        }

        // Calculer les stats
        const total = (reservationsData || []).length;
        
        // Calculer le nombre de contrats signés
        const signedContracts = (reservationsData || []).filter(
          (r) => r.client_signature && r.client_signature.trim() !== ''
        ).length;
        
        // Calculer le dépôt de garantie total (somme des dépôts de toutes les réservations)
        const totalDeposit = (reservationsData || []).reduce((sum, r) => {
          return sum + (parseFloat(r.deposit_amount) || 0);
        }, 0);

        setStats({
          signedContracts: signedContracts,
          totalDeposit: totalDeposit,
          totalRentals: total,
        });
      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
      }
    };

    loadDashboardData();
  }, [user]);

  const texts = {
    fr: {
      dashboard: 'Tableau de bord',
      hello: 'Bonjour',
      welcome: 'Bienvenue sur votre espace client SoundRush',
      signedContracts: 'Contrats signés',
      totalDeposit: 'Dépôt de garantie total',
      totalRentals: 'Locations totales',
      nextReservation: 'Prochaine réservation',
      inDays: 'Dans',
      days: 'jours',
      viewReservation: 'Voir ma réservation',
      upcomingReservations: 'Réservations à venir',
      viewAll: 'Voir tout',
      pending: 'En attente',
      confirmed: 'Confirmée',
      recentDocuments: 'Documents récents',
      invoice: 'Facture',
      contract: 'Contrat location',
      quickActions: 'Actions rapides',
      newReservation: 'Nouvelle réservation',
      contactSupport: 'Contacter le support',
      myInvoices: 'Mes factures',
      settings: 'Paramètres',
      needHelp: 'Besoin d\'aide ?',
      helpText: 'Notre équipe est disponible 7j/7 pour vous accompagner',
      whatsappAvailable: 'WhatsApp disponible',
      contactSoundRush: 'Contacter SoundRush',
      myReservations: 'Mes réservations',
      documentsInvoices: 'Documents & Factures',
      myInfo: 'Mes informations',
      logout: 'Déconnexion',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder à votre tableau de bord.',
      signIn: 'Se connecter',
    },
    en: {
      dashboard: 'Dashboard',
      hello: 'Hello',
      welcome: 'Welcome to your SoundRush client area',
      signedContracts: 'Signed contracts',
      totalDeposit: 'Total deposit',
      totalRentals: 'Total rentals',
      nextReservation: 'Next reservation',
      inDays: 'In',
      days: 'days',
      viewReservation: 'View my reservation',
      upcomingReservations: 'Upcoming reservations',
      viewAll: 'View all',
      pending: 'Pending',
      confirmed: 'Confirmed',
      recentDocuments: 'Recent documents',
      invoice: 'Invoice',
      contract: 'Rental contract',
      quickActions: 'Quick actions',
      newReservation: 'New reservation',
      contactSupport: 'Contact support',
      myInvoices: 'My invoices',
      settings: 'Settings',
      needHelp: 'Need help?',
      helpText: 'Our team is available 7/7 to assist you',
      whatsappAvailable: 'WhatsApp available',
      contactSoundRush: 'Contact SoundRush',
      myReservations: 'My reservations',
      documentsInvoices: 'Documents & Invoices',
      myInfo: 'My information',
      logout: 'Logout',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access your dashboard.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  // Obtenir le prénom de l'utilisateur depuis l'email
  const getUserFirstName = () => {
    if (!user?.email) return '';
    const emailParts = user.email.split('@')[0];
    return emailParts.split('.')[0].charAt(0).toUpperCase() + emailParts.split('.')[0].slice(1);
  };

  // Obtenir la prochaine réservation
  const getNextReservation = () => {
    const upcoming = reservations
      .filter((r) => r.status === 'confirmed' && new Date(r.start_date) >= new Date())
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return upcoming[0] || null;
  };

  // Obtenir les réservations à venir (sans la prochaine)
  const getUpcomingReservations = () => {
    const next = getNextReservation();
    return reservations
      .filter((r) => r.status !== 'cancelled' && r.id !== next?.id)
      .slice(0, 2);
  };

  // Calculer les jours jusqu'à la prochaine réservation
  const getDaysUntilReservation = (startDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Formater une date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Obtenir le nom d'un pack à partir de son ID
  const getPackName = (packId: string | null, language: 'fr' | 'en' = 'fr') => {
    if (!packId) return null;
    
    // Mapping des IDs de packs vers leurs noms
    const packNames: { [key: string]: { fr: string; en: string } } = {
      '1': { fr: 'Essentiel', en: 'Essential' },
      '2': { fr: 'Standard', en: 'Standard' },
      '3': { fr: 'Premium', en: 'Premium' },
      '4': { fr: 'Événement', en: 'Event' },
      'pack-1': { fr: 'Essentiel', en: 'Essential' },
      'pack-2': { fr: 'Standard', en: 'Standard' },
      'pack-3': { fr: 'Premium', en: 'Premium' },
      'pack-4': { fr: 'Événement', en: 'Event' },
    };

    return packNames[packId]?.[language] || `Pack ${packId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
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
        </div>
        <SignModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          language={language}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
        />
        <SignModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          language={language}
          isAdmin={true}
          onSuccess={() => {
            setIsAdminModalOpen(false);
            router.push('/admin');
          }}
          onOpenUserModal={() => {
            setIsAdminModalOpen(false);
            setIsSignModalOpen(true);
          }}
        />
      </div>
    );
  }

  const nextReservation = getNextReservation();
  const upcomingReservations = getUpcomingReservations();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar 
        language={language} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full lg:w-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Mobile-First */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Bouton menu hamburger mobile */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                  {currentTexts.dashboard}
                </h1>
                <p className="text-base sm:text-lg lg:text-2xl text-gray-900 mb-0.5 sm:mb-1 truncate">
                  {currentTexts.hello} {getUserFirstName()} 👋
                </p>
                <p className="text-sm sm:text-base text-gray-600 hidden sm:block">{currentTexts.welcome}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F2431E] flex items-center justify-center text-white font-bold text-sm sm:text-base">
                {getUserFirstName().charAt(0)}
              </div>
            </div>
          </div>

          {/* Stats Cards - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.signedContracts}</div>
              <div className="text-sm sm:text-base text-gray-600">{currentTexts.signedContracts}</div>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalDeposit.toLocaleString('fr-FR')}€</div>
              <div className="text-sm sm:text-base text-gray-600">{currentTexts.totalDeposit}</div>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalRentals}</div>
              <div className="text-sm sm:text-base text-gray-600">{currentTexts.totalRentals}</div>
            </div>
          </div>

          {/* Prochaine réservation */}
          {nextReservation && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{currentTexts.nextReservation}</h2>
              <div className="bg-gradient-to-r from-[#F2431E] to-[#E63A1A] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/20 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                  {currentTexts.inDays} {getDaysUntilReservation(nextReservation.start_date)} {currentTexts.days}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center pr-16 sm:pr-20">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3 truncate">
                      {nextReservation.pack_id 
                        ? `Pack ${getPackName(nextReservation.pack_id, language) || nextReservation.pack_id}` 
                        : nextReservation.product_id 
                        ? `Réservation #${nextReservation.id.slice(0, 8)}`
                        : 'Réservation'
                      }
                    </h3>
                    <div className="space-y-1.5 sm:space-y-2 text-white/90 text-sm sm:text-base">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{formatDate(nextReservation.start_date)} - {formatDate(nextReservation.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">Paris 11ème - Livraison incluse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl">€</span>
                        <span>{nextReservation.total_price || 420}€ TTC</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/mes-reservations/${nextReservation.id}`}
                    className="w-full sm:w-auto bg-white text-[#F2431E] px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors text-center sm:text-left"
                  >
                    {currentTexts.viewReservation}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Réservations à venir */}
          {upcomingReservations.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{currentTexts.upcomingReservations}</h2>
                <Link href="/mes-reservations" className="text-sm sm:text-base text-[#F2431E] font-semibold hover:underline">
                  {currentTexts.viewAll}
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingReservations.map((reservation) => (
                  <div key={reservation.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                          {reservation.pack_id 
                            ? `Pack ${getPackName(reservation.pack_id, language) || reservation.pack_id}` 
                            : reservation.product_id 
                            ? `Réservation #${reservation.id.slice(0, 8)}`
                            : 'Réservation'
                          }
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {formatDate(reservation.start_date)} - {formatDate(reservation.end_date)}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          reservation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {reservation.status === 'pending' ? currentTexts.pending : currentTexts.confirmed}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents récents */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{currentTexts.recentDocuments}</h2>
              <Link href="/mes-factures" className="text-sm sm:text-base text-[#F2431E] font-semibold hover:underline">
                {currentTexts.viewAll}
              </Link>
            </div>
            <div className="space-y-3">
              {orders.length > 0 ? (
                orders.map((order) => {
                  const orderDate = new Date(order.created_at);
                  const formattedDate = orderDate.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  });
                  const orderNumber = order.id.slice(0, 8).toUpperCase();
                  
                  return (
                    <div key={order.id} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-red-100 flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                          {currentTexts.invoice} #{orderNumber}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm truncate">
                          {formattedDate} - {order.total}€
                        </p>
                      </div>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                  <p>{language === 'fr' ? 'Aucun document récent' : 'No recent documents'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{currentTexts.quickActions}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: 'plus', label: currentTexts.newReservation, color: 'orange', href: '/packs' },
                { icon: 'headset', label: currentTexts.contactSupport, color: 'blue', href: 'tel:+33651084994' },
                { icon: 'document', label: currentTexts.myInvoices, color: 'green', href: '/mes-factures' },
                { icon: 'settings', label: currentTexts.settings, color: 'purple', href: '/mes-informations' },
              ].map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl flex items-center justify-center ${
                    action.color === 'orange' ? 'bg-orange-100' :
                    action.color === 'blue' ? 'bg-blue-100' :
                    action.color === 'green' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    {action.icon === 'plus' && (
                      <svg className={`w-6 h-6 sm:w-8 sm:h-8 text-[#F2431E]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    {action.icon === 'headset' && (
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                    {action.icon === 'document' && (
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {action.icon === 'settings' && (
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">{action.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Besoin d'aide */}
          <div className="bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{currentTexts.needHelp}</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">{currentTexts.helpText}</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <a 
                  href="tel:+33651084994"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>06 51 08 49 94</span>
                </a>
                <a 
                  href="https://wa.me/33651084994"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{currentTexts.whatsappAvailable}</span>
                </a>
              </div>
              <a
                href="tel:+33651084994"
                className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                {currentTexts.contactSoundRush}
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Sign Modal */}
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
      />
    </div>
  );
}

