'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import SignModal from '@/components/auth/SignModal';
import DashboardSidebar from '@/components/DashboardSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Icônes lucide-react
import { 
  Menu, 
  CheckCircle2, 
  DollarSign, 
  ClipboardList, 
  Calendar, 
  MapPin, 
  Download,
  Plus,
  Headphones,
  FileText,
  Settings,
  Phone,
  MessageCircle,
  Music
} from 'lucide-react';

export default function DashboardPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { signOut } = useAuth();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();
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
            <Button
              onClick={() => setIsSignModalOpen(true)}
              className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
            >
              {currentTexts.signIn}
            </Button>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header language={language} onLanguageChange={setLanguage} />

      <div className="flex flex-1 pt-[112px]">
        {/* Sidebar */}
        <DashboardSidebar 
          language={language} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Mobile-First */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Bouton menu hamburger mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
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
          </div>

          {/* Stats Cards - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.signedContracts}</div>
                <div className="text-sm sm:text-base text-gray-600">{currentTexts.signedContracts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalDeposit.toLocaleString('fr-FR')}€</div>
                <div className="text-sm sm:text-base text-gray-600">{currentTexts.totalDeposit}</div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-[#F2431E]" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalRentals}</div>
                <div className="text-sm sm:text-base text-gray-600">{currentTexts.totalRentals}</div>
              </CardContent>
            </Card>
          </div>

          {/* Prochaine réservation */}
          {nextReservation && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{currentTexts.nextReservation}</h2>
              <Card className="bg-gradient-to-r from-[#F2431E] to-[#E63A1A] border-0 text-white relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 relative">
                  <Badge className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/20">
                    {currentTexts.inDays} {getDaysUntilReservation(nextReservation.start_date)} {currentTexts.days}
                  </Badge>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center pr-16 sm:pr-20">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Music className="w-8 h-8 sm:w-12 sm:h-12" />
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
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span className="truncate">{formatDate(nextReservation.start_date)} - {formatDate(nextReservation.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span className="truncate">Paris 11ème - Livraison incluse</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span>{nextReservation.total_price || 420}€ TTC</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="secondary"
                      className="w-full sm:w-auto bg-white text-[#F2431E] hover:bg-gray-100"
                    >
                      <Link href={`/mes-reservations/${nextReservation.id}`}>
                        {currentTexts.viewReservation}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                  <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Music className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
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
                          <Badge 
                            variant={reservation.status === 'pending' ? 'secondary' : 'default'}
                            className={
                              reservation.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                : 'bg-green-100 text-green-800 hover:bg-green-100'
                            }
                          >
                            {reservation.status === 'pending' ? currentTexts.pending : currentTexts.confirmed}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-red-100 flex-shrink-0">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                            {currentTexts.invoice} #{orderNumber}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm truncate">
                            {formattedDate} - {order.total}€
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                    <p>{language === 'fr' ? 'Aucun document récent' : 'No recent documents'}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{currentTexts.quickActions}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: Plus, label: currentTexts.newReservation, color: 'orange', href: '/packs' },
                { icon: Headphones, label: currentTexts.contactSupport, color: 'blue', href: 'tel:+33651084994' },
                { icon: FileText, label: currentTexts.myInvoices, color: 'green', href: '/mes-factures' },
                { icon: Settings, label: currentTexts.settings, color: 'purple', href: '/mes-informations' },
              ].map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <Link href={action.href} className="block">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl flex items-center justify-center ${
                          action.color === 'orange' ? 'bg-orange-100' :
                          action.color === 'blue' ? 'bg-blue-100' :
                          action.color === 'green' ? 'bg-green-100' :
                          'bg-purple-100'
                        }`}>
                          <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${
                            action.color === 'orange' ? 'text-[#F2431E]' :
                            action.color === 'blue' ? 'text-blue-600' :
                            action.color === 'green' ? 'text-green-600' :
                            'text-purple-600'
                          }`} />
                        </div>
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">{action.label}</p>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Besoin d'aide */}
          <Card className="bg-gray-900 border-0 text-white">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-white">{currentTexts.needHelp}</CardTitle>
              <CardDescription className="text-gray-400">{currentTexts.helpText}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <a 
                  href="tel:+33651084994"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors text-sm sm:text-base"
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>06 51 08 49 94</span>
                </a>
                <a 
                  href="https://wa.me/33651084994"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors text-sm sm:text-base"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{currentTexts.whatsappAvailable}</span>
                </a>
              </div>
              <Button
                asChild
                variant="secondary"
                className="bg-white text-gray-900 hover:bg-gray-100 whitespace-nowrap"
              >
                <a href="tel:+33651084994">
                  {currentTexts.contactSoundRush}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Sign Modal */}
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
      />
      </div>

      {/* Footer */}
      <Footer language={language} />
    </div>
  );
}

