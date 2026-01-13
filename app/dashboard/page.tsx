'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
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
  Music,
  RefreshCw
} from 'lucide-react';
import DocumentsPanel from '@/components/DocumentsPanel';
import { loadDashboardData } from '@/lib/dashboardDataLoader';
import { pickNextReservation, isOrderRelatedToReservation } from '@/lib/reservationViewMapper';
import { ReservationView } from '@/types/reservationView';
import PasswordSetupModal from '@/components/PasswordSetupModal';

function DashboardContent() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { signOut } = useAuth();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();
  const [reservationViews, setReservationViews] = useState<ReservationView[]>([]);
  const [nextView, setNextView] = useState<ReservationView | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [etatLieuxList, setEtatLieuxList] = useState<any[]>([]);
  const [nextReservationDocuments, setNextReservationDocuments] = useState<{
    orders: any[];
    etatLieux: any | null;
  }>({ orders: [], etatLieux: null });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentReservationId, setPaymentReservationId] = useState<string | null>(null);

  // Gérer l'authentification et les paramètres URL
  useEffect(() => {
    if (loading) return; // Attendre que le chargement soit terminé
    
    const reservationParam = searchParams.get('reservation');
    
    // Si pas connecté mais qu'il y a une réservation dans l'URL, ouvrir le modal de connexion (onglet signin)
    if (!user && reservationParam) {
      setIsSignModalOpen(true);
      return;
    }
    
    // Si pas connecté et pas de réservation, rediriger vers l'accueil
    if (!user) {
      router.push('/');
      return;
    }
    
    // Si connecté et qu'il y a une réservation dans l'URL, nettoyer l'URL (les données seront chargées normalement)
    if (user && reservationParam) {
      // Nettoyer l'URL après un court délai pour garder l'historique propre
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1000);
    }
  }, [user, loading, router, searchParams]);

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

  // Gérer le retour de paiement Stripe avec polling et vérification directe du statut Stripe
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);

  useEffect(() => {
    // Vérifier si on doit afficher le modal de création de mot de passe
    const setupPassword = searchParams.get('setup_password');
    const newUser = searchParams.get('new_user');
    
    if (setupPassword === 'true' && newUser === 'true' && user) {
      setShowPasswordSetup(true);
      // Retirer les paramètres de l'URL
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('setup_password');
      newSearchParams.delete('new_user');
      const newUrl = newSearchParams.toString() 
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, user]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const reservationId = searchParams.get('reservation_id');
    
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const inFlightRef = { current: false };
    let isMounted = true;

    if (payment === 'success' && reservationId && user && supabase) {
      setPaymentSuccess(true);
      setPaymentReservationId(reservationId);
      
      let attempts = 0;
      const maxAttempts = 15; // 15 tentatives sur 30 secondes
      
      const pollReservationStatus = async () => {
        if (!isMounted || !supabase) return;
        if (inFlightRef.current) return; // Guard contre appels concurrents
        if (document.hidden) {
          // Si onglet caché, réessayer plus tard
          timeoutId = setTimeout(pollReservationStatus, 2000);
          return;
        }
        
        inFlightRef.current = true;
        try {
          console.log(`🔄 Tentative ${attempts + 1}/${maxAttempts} - Vérification statut réservation ${reservationId}`);
          
          const { data: reservationData, error: fetchError } = await supabase
            .from('client_reservations')
            .select('status, stripe_session_id')
            .eq('id', reservationId)
            .single();
          
          if (fetchError) {
            console.error('❌ Erreur récupération réservation:', fetchError);
          }
          
          console.log('📊 Statut actuel:', reservationData?.status);
          console.log('📊 Session Stripe ID:', reservationData?.stripe_session_id);
          
          // Si le statut est PAID ou CONFIRMED, recharger toutes les données
          const status = reservationData?.status?.toUpperCase();
          if (status === 'PAID' || status === 'CONFIRMED') {
            console.log('✅ Statut mis à jour à PAID/CONFIRMED, rechargement des données...');
            
            // Recharger toutes les données avec le nouveau système unifié
            const data = await loadDashboardData(user);
            setReservationViews(data.reservationViews);
            setOrders(data.orders);
            setEtatLieuxList(data.etatLieuxList);
            const next = pickNextReservation(data.reservationViews);
            setNextView(next);
            
            if (next) {
              const relatedOrders = data.orders.filter(order => 
                isOrderRelatedToReservation(order, next.id, next.source)
              );
              const relatedEtatLieux = next.source === 'reservation'
                ? data.etatLieuxList.find(el => el.reservation_id === next.id)
                : null;
              setNextReservationDocuments({
                orders: relatedOrders,
                etatLieux: relatedEtatLieux || null,
              });
            }
            
            console.log('✅ Données rechargées avec succès');
            
            // Masquer le message de succès après 3 secondes
            setTimeout(() => {
              setPaymentSuccess(false);
              setPaymentReservationId(null);
            }, 3000);
            
            // Nettoyer l'URL
            router.replace('/dashboard');
            return; // Arrêter le polling
          }
          
          // Si le statut n'est toujours pas PAID et qu'on a une session Stripe, vérifier directement avec Stripe
          // On fait cette vérification dès la première tentative si on a une session_id
          if (status === 'AWAITING_PAYMENT' && reservationData?.stripe_session_id) {
            console.log('🔍 Vérification directe du statut Stripe (tentative', attempts + 1, ')...');
            try {
              // Appeler notre API pour vérifier le statut Stripe
              const checkResponse = await fetch(`/api/payments/verify-session?session_id=${reservationData.stripe_session_id}&reservation_id=${reservationId}`);
              if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                console.log('📊 Résultat vérification Stripe:', checkData);
                if (checkData.paid) {
                  console.log('✅ Paiement confirmé via vérification Stripe directe');
                  
                  // Attendre un peu pour que la mise à jour soit propagée
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Recharger les données avec le nouveau système unifié
                  const data = await loadDashboardData(user);
                  setReservationViews(data.reservationViews);
                  setOrders(data.orders);
                  setEtatLieuxList(data.etatLieuxList);
                  const next = pickNextReservation(data.reservationViews);
                  setNextView(next);
                  
                  if (next) {
                    const relatedOrders = data.orders.filter(order => 
                      isOrderRelatedToReservation(order, next.id, next.source)
                    );
                    const relatedEtatLieux = next.source === 'reservation'
                      ? data.etatLieuxList.find(el => el.reservation_id === next.id)
                      : null;
                    setNextReservationDocuments({
                      orders: relatedOrders,
                      etatLieux: relatedEtatLieux || null,
                    });
                  }
                  
                  console.log('✅ Données rechargées après vérification Stripe');
                  
                  setTimeout(() => {
                    setPaymentSuccess(false);
                    setPaymentReservationId(null);
                  }, 3000);
                  
                  router.replace('/dashboard');
                  return; // Arrêter le polling
                }
              } else {
                const errorData = await checkResponse.json().catch(() => ({}));
                console.error('❌ Erreur réponse vérification Stripe:', errorData);
              }
            } catch (stripeError) {
              console.error('❌ Erreur vérification Stripe:', stripeError);
            }
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            // Réessayer après 2 secondes
            timeoutId = setTimeout(pollReservationStatus, 2000);
          } else {
            // Après maxAttempts tentatives, recharger quand même les données
            console.warn('⚠️ Timeout polling après', maxAttempts, 'tentatives, rechargement forcé');
            const data = await loadDashboardData(user);
            setReservationViews(data.reservationViews);
            setOrders(data.orders);
            setEtatLieuxList(data.etatLieuxList);
            const next = pickNextReservation(data.reservationViews);
            setNextView(next);
            
            if (next) {
              const relatedOrders = data.orders.filter(order => 
                isOrderRelatedToReservation(order, next.id, next.source)
              );
              const relatedEtatLieux = next.source === 'reservation'
                ? data.etatLieuxList.find(el => el.reservation_id === next.id)
                : null;
              setNextReservationDocuments({
                orders: relatedOrders,
                etatLieux: relatedEtatLieux || null,
              });
            }
            
            setTimeout(() => {
              setPaymentSuccess(false);
              setPaymentReservationId(null);
            }, 3000);
            
            router.replace('/dashboard');
          }
        } catch (error) {
          console.error('❌ Erreur polling statut:', error);
          inFlightRef.current = false;
          attempts++;
          if (attempts < maxAttempts) {
            timeoutId = setTimeout(pollReservationStatus, 2000);
          } else {
            setTimeout(() => {
              if (isMounted) {
                setPaymentSuccess(false);
                setPaymentReservationId(null);
              }
            }, 3000);
            if (isMounted) {
              router.replace('/dashboard');
            }
          }
        } finally {
          inFlightRef.current = false;
        }
      };
      
      // Démarrer le polling après 1 seconde
      timeoutId = setTimeout(pollReservationStatus, 1000);
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams, user?.id, router, supabase]); // Stabiliser user avec user?.id

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const data = await loadDashboardData(user);
        setReservationViews(data.reservationViews);
        setOrders(data.orders);
        setEtatLieuxList(data.etatLieuxList);
        
        // Calculer la prochaine réservation
        const next = pickNextReservation(data.reservationViews);
        setNextView(next);
        
        // Charger les documents de la prochaine réservation
        if (next) {
          const relatedOrders = data.orders.filter(order => 
            isOrderRelatedToReservation(order, next.id, next.source)
          );
          
          const relatedEtatLieux = next.source === 'reservation'
            ? data.etatLieuxList.find(el => el.reservation_id === next.id)
            : null;
          
          setNextReservationDocuments({
            orders: relatedOrders,
            etatLieux: relatedEtatLieux || null,
          });
        }
      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);


  const texts = {
    fr: {
      dashboard: 'Tableau de bord',
      hello: 'Bonjour',
      welcome: 'Bienvenue sur votre espace client SoundRush',
      welcomeDescription: 'Suivez votre prestation, consultez vos paiements, téléchargez vos documents et contactez notre support depuis cet espace dédié.',
      signedContracts: 'Contrats signés',
      totalDeposit: 'Caution totale',
      totalRentals: 'Prestations totales',
      nextReservation: 'Ma prochaine prestation',
      inDays: 'Dans',
      days: 'jours',
      viewReservation: 'Voir ma prestation',
      upcomingReservations: 'Prestations à venir',
      viewAll: 'Voir tout',
      pending: 'En attente',
      confirmed: 'Confirmée',
      recentDocuments: 'Documents récents',
      invoice: 'Facture',
      contract: 'Contrat location',
      quickActions: 'Actions rapides',
      newReservation: 'Nouvelle réservation',
      myContracts: 'Mes contrats',
      myConditionReports: 'États des lieux',
      myInvoices: 'Mes factures',
      settings: 'Paramètres',
      needHelp: 'Besoin d\'aide ?',
      helpText: 'Notre équipe est disponible 7j/7 pour vous accompagner',
      whatsappAvailable: 'WhatsApp disponible',
      contactSoundRush: 'Contacter SoundRush',
      myReservations: 'Mes prestations',
      documentsInvoices: 'Documents & Factures',
      myInfo: 'Mes informations',
      myNextService: 'Ma prochaine prestation',
      payments: 'Paiements',
      documents: 'Documents',
      support: 'Support',
      logout: 'Déconnexion',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder à votre tableau de bord.',
      signIn: 'Se connecter',
    },
    en: {
      dashboard: 'Dashboard',
      hello: 'Hello',
      welcome: 'Welcome to your SoundRush client area',
      welcomeDescription: 'Manage your reservations, track your deliveries, view your condition reports, sign your contracts, cancel or modify your reservations, and much more from this dedicated space.',
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
      myContracts: 'My contracts',
      myConditionReports: 'Condition reports',
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

  // État pour stocker le prénom
  const [userFirstName, setUserFirstName] = useState<string>('');

  // Récupérer le prénom de l'utilisateur depuis user_profiles ou user_metadata
  useEffect(() => {
    const fetchUserFirstName = async () => {
      if (!user?.id || !supabase) {
        setUserFirstName('');
        return;
      }

      try {
        // Essayer de récupérer depuis user_profiles
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('first_name')
          .eq('user_id', user.id)
          .maybeSingle(); // Utiliser maybeSingle() pour éviter les erreurs 400

        // Ignorer les erreurs PGRST116 (no rows returned) qui sont normales
        if (error && error.code !== 'PGRST116') {
          console.warn('⚠️ Dashboard - Erreur récupération user_profiles:', error.code);
        }

        if (profile?.first_name) {
          // Capitaliser la première lettre
          const firstName = profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1).toLowerCase();
          setUserFirstName(firstName);
        } else if (user.user_metadata?.first_name) {
          const firstName = user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1).toLowerCase();
          setUserFirstName(firstName);
        } else if (user.email) {
          // Fallback: utiliser la partie avant @ de l'email
          const emailPart = user.email.split('@')[0];
          setUserFirstName(emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase());
        }
      } catch (error: any) {
        // Ne logger que les vraies erreurs (pas les erreurs 400 normales)
        if (error?.code !== 'PGRST116' && error?.code !== '42P01') {
          console.error('Erreur récupération prénom:', error);
        }
        console.error('Erreur récupération prénom:', error);
        // Fallback vers user_metadata ou email
        if (user.user_metadata?.first_name) {
          const firstName = user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1).toLowerCase();
          setUserFirstName(firstName);
        } else if (user.email) {
          const emailPart = user.email.split('@')[0];
          setUserFirstName(emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase());
        }
      }
    };

    if (user) {
      fetchUserFirstName();
    } else {
      setUserFirstName('');
    }
  }, [user]);

  // Obtenir le prénom de l'utilisateur (utilise l'état)
  const getUserFirstName = () => {
    return userFirstName || '';
  };


  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos données...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Si pas connecté mais qu'il y a une réservation dans l'URL, le modal s'ouvrira automatiquement
    // Sinon afficher l'écran de connexion
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
          onClose={() => {
            setIsSignModalOpen(false);
            // Rediriger vers l'accueil si l'utilisateur ferme le modal sans se connecter
            if (!user) {
              router.push('/');
            }
          }}
          language={language}
          onSuccess={() => {
            setIsSignModalOpen(false);
            // Recharger la page pour afficher le dashboard
            window.location.reload();
          }}
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

  return (
    <>
      <PasswordSetupModal
        isOpen={showPasswordSetup}
        onClose={() => setShowPasswordSetup(false)}
        onSuccess={() => {
          console.log('Mot de passe créé avec succès');
        }}
        language={language}
      />
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header language={language} onLanguageChange={setLanguage} />

      <div className="flex flex-1">
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
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(v => !v)}
              className="lg:hidden"
              aria-expanded={isSidebarOpen}
              aria-controls="dashboard-sidebar"
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
          {/* Header Desktop */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                    {currentTexts.dashboard}
                  </h1>
                  <p className="text-base sm:text-lg lg:text-2xl text-gray-900 mb-0.5 sm:mb-1 truncate">
                    {currentTexts.hello} {getUserFirstName()} 👋
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-2 sm:mb-3">
              <p className="text-sm sm:text-base text-gray-900 font-semibold mb-1">{currentTexts.welcome}</p>
              <p className="text-xs sm:text-sm text-gray-600">{currentTexts.welcomeDescription}</p>
            </div>
          </div>

          {/* Message de succès après paiement */}
          {paymentSuccess && (
            <Card className="mb-6 border-2 border-green-500 bg-green-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-900 mb-2">
                      ✅ Paiement confirmé !
                    </h3>
                    <p className="text-green-800 mb-2">
                      Votre paiement a été traité avec succès. Nous mettons à jour votre réservation...
                    </p>
                    <p className="text-sm text-green-700">
                      Si le statut ne se met pas à jour automatiquement, veuillez rafraîchir la page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* BLOC A: Prochaine étape */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              {language === 'fr' ? 'Prochaine étape' : 'Next step'}
            </h2>
            <Card className="border-2 border-orange-500">
              <CardContent className="p-6">
                {nextView ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{nextView.packLabel}</h3>
                        {nextView.summary && (
                          <p className="text-sm text-gray-600 mt-1 italic">{nextView.summary}</p>
                        )}
                      </div>
                    </div>
                    {nextView.cta.action !== 'NONE' ? (
                      <Button
                        onClick={async () => {
                          if (nextView.cta.action === 'PAY_DEPOSIT' || nextView.cta.action === 'PAY_BALANCE') {
                            try {
                              const { supabase } = await import('@/lib/supabase');
                              let authHeader = '';
                              if (supabase) {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (session?.access_token) {
                                  authHeader = `Bearer ${session.access_token}`;
                                }
                              }
                              const apiEndpoint = nextView.cta.action === 'PAY_DEPOSIT'
                                ? '/api/payments/create-checkout-session'
                                : '/api/payments/create-balance-session';
                              const response = await fetch(apiEndpoint, {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  ...(authHeader ? { 'Authorization': authHeader } : {}),
                                },
                                body: JSON.stringify({ reservation_id: nextView.id }),
                              });
                              if (response.ok) {
                                const data = await response.json();
                                if (data.url) window.location.href = data.url;
                              }
                            } catch (error) {
                              console.error('Erreur:', error);
                            }
                          } else if (nextView.cta.action === 'SIGN_CONTRACT' && nextView.cta.href) {
                            window.location.href = nextView.cta.href;
                          } else if (nextView.cta.href) {
                            window.location.href = nextView.cta.href;
                          }
                        }}
                        className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                      >
                        {nextView.cta.label}
                      </Button>
                    ) : (
                      <p className="text-gray-600 text-center py-4">{nextView.cta.label}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    {language === 'fr' ? 'Rien à faire pour le moment' : 'Nothing to do at the moment'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* BLOC B: Ma prestation */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              {language === 'fr' ? 'Ma prestation' : 'My service'}
            </h2>
            {nextView ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{nextView.packLabel}</h3>
                      {nextView.startAt && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(nextView.startAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                      {nextView.address && (
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          {nextView.address}
                        </p>
                      )}
                      {nextView.summary && (
                        <p className="text-sm text-gray-700 mt-3 italic bg-blue-50 p-3 rounded-lg border border-blue-200">
                          {nextView.summary}
                        </p>
                      )}
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/prestation">
                        {language === 'fr' ? 'Voir détails' : 'View details'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <p>{language === 'fr' ? 'Aucune prestation à venir' : 'No upcoming service'}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* BLOC C: Mes documents */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              {language === 'fr' ? 'Mes Documents' : 'My Documents'}
            </h2>
            {nextView ? (
              <>
                <DocumentsPanel
                  context="user"
                  reservation={{
                    id: nextView.id,
                    type: nextView.source === 'client_reservation' ? 'client_reservation' : 'reservation',
                    client_signature: nextView.raw?.client_signature || null,
                    client_signed_at: nextView.raw?.client_signed_at || null,
                    status: nextView.status,
                  }}
                  orders={nextReservationDocuments.orders}
                  etatLieux={nextReservationDocuments.etatLieux || undefined}
                  language={language}
                />
                <div className="mt-4">
                  <Link href="/dashboard/documents" className="text-[#F2431E] hover:underline text-sm">
                    {language === 'fr' ? 'Voir tous mes documents →' : 'View all my documents →'}
                  </Link>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <p>{language === 'fr' ? 'Aucun document disponible' : 'No documents available'}</p>
                </CardContent>
              </Card>
            )}
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

      {/* Footer */}
      <Footer language={language} />
    </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

