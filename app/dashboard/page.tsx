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
  Music,
  RefreshCw
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
  const [clientReservations, setClientReservations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    signedContracts: 0,
    totalDeposit: 0,
    totalRentals: 0,
  });
  const [pendingActions, setPendingActions] = useState({
    contractsToSign: 0,
    conditionReportsToReview: 0,
    deliveriesNotReturned: 0,
    newInvoices: 0,
    reservationsWithContractsToSign: 0,
  });
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
  useEffect(() => {
    const payment = searchParams.get('payment');
    const reservationId = searchParams.get('reservation_id');

    if (payment === 'success' && reservationId && user && supabase) {
      setPaymentSuccess(true);
      setPaymentReservationId(reservationId);
      
      let attempts = 0;
      const maxAttempts = 15; // 15 tentatives sur 30 secondes
      
      const pollReservationStatus = async () => {
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
            
            // Recharger toutes les client_reservations
            const { data: clientReservationsData, error: reloadError } = await supabase
              .from('client_reservations')
              .select('*')
              .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
              .order('created_at', { ascending: false });
            
            if (reloadError) {
              console.error('❌ Erreur rechargement:', reloadError);
            } else if (clientReservationsData) {
              setClientReservations(clientReservationsData);
              console.log('✅ Données rechargées avec succès');
              console.log('📊 Nombre total de réservations:', clientReservationsData.length);
              const paidCount = clientReservationsData.filter(r => {
                const status = r.status?.toUpperCase();
                return status === 'PAID' || status === 'CONFIRMED';
              }).length;
              console.log('📊 Réservations payées après rechargement:', paidCount);
              
              // Masquer le message de succès après 3 secondes
              setTimeout(() => {
                setPaymentSuccess(false);
                setPaymentReservationId(null);
              }, 3000);
              
              // Nettoyer l'URL
              router.replace('/dashboard');
              return; // Arrêter le polling
            }
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
                  
                  // Recharger les données
                  const { data: clientReservationsData, error: reloadError } = await supabase
                    .from('client_reservations')
                    .select('*')
                    .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
                    .order('created_at', { ascending: false });
                  
                  if (reloadError) {
                    console.error('❌ Erreur rechargement après vérification Stripe:', reloadError);
                  } else if (clientReservationsData) {
                    setClientReservations(clientReservationsData);
                    console.log('✅ Données rechargées après vérification Stripe');
                    console.log('📊 Nombre total de réservations:', clientReservationsData.length);
                    const paidCount = clientReservationsData.filter(r => {
                      const status = r.status?.toUpperCase();
                      return status === 'PAID' || status === 'CONFIRMED';
                    }).length;
                    console.log('📊 Réservations payées après vérification Stripe:', paidCount);
                  }
                  
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
            setTimeout(pollReservationStatus, 2000);
          } else {
            // Après maxAttempts tentatives, recharger quand même les données
            console.warn('⚠️ Timeout polling après', maxAttempts, 'tentatives, rechargement forcé');
            const { data: clientReservationsData } = await supabase
              .from('client_reservations')
              .select('*')
              .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
              .order('created_at', { ascending: false });
            
            if (clientReservationsData) {
              setClientReservations(clientReservationsData);
            }
            
            setTimeout(() => {
              setPaymentSuccess(false);
              setPaymentReservationId(null);
            }, 3000);
            
            router.replace('/dashboard');
          }
        } catch (error) {
          console.error('❌ Erreur polling statut:', error);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollReservationStatus, 2000);
          } else {
            setTimeout(() => {
              setPaymentSuccess(false);
              setPaymentReservationId(null);
            }, 3000);
            router.replace('/dashboard');
          }
        }
      };
      
      // Démarrer le polling après 1 seconde
      setTimeout(pollReservationStatus, 1000);
    }
  }, [searchParams, user, router, supabase]);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadDashboardData = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      console.time('⏱️ Dashboard - Chargement total');
      setIsLoadingData(true);
      
      try {
        // OPTIMISATION CRITIQUE: Ne sélectionner QUE les colonnes nécessaires au lieu de '*'
        // Cela réduit drastiquement la taille des données transférées
        console.time('⏱️ Dashboard - Requête réservations');
        // Essayer d'abord avec select('*') pour voir si le problème vient des colonnes spécifiques
        console.log('🔍 User ID pour requête:', user.id);
        console.log('🔍 User Email:', user.email);
        
        // Charger les réservations actives (pas PENDING)
        // Inclure CANCELLED pour afficher l'historique complet
        const reservationsPromise = supabaseClient
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .not('status', 'eq', 'PENDING')
          .not('status', 'eq', 'pending')
          // Ne plus filtrer CANCELLED pour afficher toutes les réservations
          .order('start_date', { ascending: true });
        
        // Charger aussi les client_reservations (demandes de réservation)
        console.time('⏱️ Dashboard - Requête client_reservations');
        const clientReservationsPromise = supabaseClient
          .from('client_reservations')
          .select('*')
          .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
          .order('created_at', { ascending: false });

        console.time('⏱️ Dashboard - Requête orders');
        // OPTIMISATION: Ne sélectionner que les colonnes nécessaires
        const ordersPromise = user.email
          ? supabaseClient
              .from('orders')
              .select('id, customer_email, total, created_at, status')
              .eq('customer_email', user.email)
              .order('created_at', { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [], error: null });

        // Exécuter les premières requêtes en parallèle
        const [
          { data: reservationsData, error: reservationsError },
          { data: ordersData, error: ordersError },
          { data: clientReservationsData, error: clientReservationsError }
        ] = await Promise.all([
          reservationsPromise,
          ordersPromise,
          clientReservationsPromise
        ]);

        console.timeEnd('⏱️ Dashboard - Requête réservations');
        console.timeEnd('⏱️ Dashboard - Requête orders');
        console.timeEnd('⏱️ Dashboard - Requête client_reservations');
        console.log('✅ Données chargées:', { 
          reservations: reservationsData?.length || 0, 
          orders: ordersData?.length || 0,
          clientReservations: clientReservationsData?.length || 0,
          userId: user?.id,
          userEmail: user?.email
        });
        console.log('📊 Réservations brutes:', reservationsData);
        console.log('📊 Orders bruts:', ordersData);

        // Mettre à jour les données immédiatement pour un rendu rapide (SANS attendre etat_lieux)
        // Gérer les erreurs sans bloquer le chargement
        if (reservationsError) {
          // Afficher l'erreur complète pour debug
          const errorDetails = {
            message: (reservationsError as any)?.message,
            code: (reservationsError as any)?.code,
            details: (reservationsError as any)?.details,
            hint: (reservationsError as any)?.hint,
            status: (reservationsError as any)?.status,
            statusCode: (reservationsError as any)?.statusCode,
          };
          
          console.error('❌ Erreur chargement réservations:', errorDetails);
          console.error('❌ Erreur complète (raw):', reservationsError);
          
          // Si c'est une erreur 400, c'est probablement un problème de RLS ou de colonnes
          if ((reservationsError as any)?.code === 'PGRST301' || (reservationsError as any)?.statusCode === 400) {
            console.warn('⚠️ Erreur 400 - Vérifier les politiques RLS ou les colonnes de la table reservations');
          }
          
          setReservations([]);
        } else {
          setReservations(reservationsData || []);
        }
        
        if (ordersError) {
          console.error('❌ Erreur chargement orders:', JSON.stringify(ordersError, null, 2));
          setOrders([]);
        } else {
          setOrders(ordersData || []);
        }
        
        if (clientReservationsError) {
          console.error('❌ Erreur chargement client_reservations:', JSON.stringify(clientReservationsError, null, 2));
          setClientReservations([]);
        } else {
          const clientReservationsList = clientReservationsData || [];
          setClientReservations(clientReservationsList);
          console.log('📊 Client reservations chargées:', clientReservationsList.length);
          console.log('📊 Réservations PAID:', clientReservationsList.filter(r => {
            const status = r.status?.toUpperCase();
            return status === 'PAID' || status === 'CONFIRMED';
          }).length);
        }
        
        // Libérer le rendu IMMÉDIATEMENT après avoir les données principales
        console.timeEnd('⏱️ Dashboard - Chargement total');
        setIsLoadingData(false);
        
        // Calculer les stats immédiatement
        // Filtrer les CANCELLED pour les stats (mais les garder pour l'affichage)
        const activeReservations = (reservationsData || []).filter(
          (r) => r.status !== 'CANCELLED' && r.status !== 'cancelled'
        );
        const total = activeReservations.length;
        const signedContracts = activeReservations.filter(
          (r) => r.client_signature && r.client_signature.trim() !== ''
        ).length;
        const totalDeposit = activeReservations.reduce((sum, r) => {
          return sum + (parseFloat(r.deposit_amount) || 0);
        }, 0);

        setStats({
          signedContracts: signedContracts,
          totalDeposit: totalDeposit,
          totalRentals: total,
        });

        // Calculer les actions en attente (sans etat_lieux pour l'instant)
        const viewedContracts = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_contracts') || '[]')
          : [];
        
        const contractsToSign = (reservationsData || []).filter(
          (r) => (r.status === 'CONFIRMED' || r.status === 'CONTRACT_PENDING' || r.status === 'confirmed') 
            && (!r.client_signature || r.client_signature.trim() === '')
            && !viewedContracts.includes(r.id)
        ).length;

        const viewedDeliveries = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_deliveries') || '[]')
          : [];
        
        const deliveriesNotReturned = (reservationsData || []).filter(
          (r) => (r.status === 'CONFIRMED' || r.status === 'confirmed' || r.status === 'IN_PROGRESS' || r.status === 'in_progress')
            && r.delivery_status 
            && r.delivery_status !== 'termine'
            && !viewedDeliveries.includes(r.id)
        ).length;

        const viewedInvoices = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_invoices') || '[]')
          : [];
        
        const newInvoices = (ordersData || []).filter(
          (o) => !viewedInvoices.includes(o.id)
        ).length;

        const viewedReservationsWithContracts = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_reservations_with_contracts') || '[]')
          : [];
        
        const reservationsWithContractsToSign = (reservationsData || []).filter(
          (r) => (r.status === 'CONFIRMED' || r.status === 'CONTRACT_PENDING' || r.status === 'confirmed') 
            && (!r.client_signature || r.client_signature.trim() === '')
            && !viewedReservationsWithContracts.includes(r.id)
        ).length;

        // Mettre à jour les actions en attente (sans conditionReportsToReview pour l'instant)
        setPendingActions({
          contractsToSign,
          conditionReportsToReview: 0, // Sera mis à jour plus tard
          deliveriesNotReturned,
          newInvoices,
          reservationsWithContractsToSign,
        });

        // 2. États des lieux à regarder : charger EN ARRIÈRE-PLAN après le rendu initial
        // Cette requête ne bloque plus le chargement de la page
        if (reservationsData && reservationsData.length > 0) {
          // Charger en arrière-plan sans bloquer (IIFE - Immediately Invoked Function Expression)
          (async () => {
            try {
              const reservationIds = reservationsData.map(r => r.id);
              let etatsLieuxData = null;
              
              // OPTIMISATION: Limiter à 50 IDs pour éviter les requêtes trop longues
              const limitedIds = reservationIds.slice(0, 50);
              const { data } = await supabaseClient
                .from('etat_lieux')
                .select('id, status, reservation_id')
                .in('reservation_id', limitedIds);
              etatsLieuxData = data;
              
              // Récupérer les IDs consultés depuis localStorage
              const viewedConditionReports = typeof window !== 'undefined' 
                ? JSON.parse(localStorage.getItem('viewed_condition_reports') || '[]')
                : [];
              
              const count = (etatsLieuxData || []).filter(
                (el) => (el.status === 'livraison_complete' || el.status === 'reprise_complete')
                  && !viewedConditionReports.includes(el.id)
              ).length;
              
              // Mettre à jour seulement le compteur
              setPendingActions(prev => ({
                ...prev,
                conditionReportsToReview: count
              }));
            } catch (error) {
              console.error('Erreur chargement etat_lieux:', error);
            }
          })();
        }
      } catch (error: any) {
        console.error('Erreur chargement dashboard:', {
          message: error?.message || 'Erreur inconnue',
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          fullError: error
        });
        setIsLoadingData(false);
      }
    };

    // Démarrer le chargement immédiatement
    loadDashboardData();
  }, [user, supabase]);

  // Écouter les changements de localStorage pour mettre à jour les compteurs
  useEffect(() => {
    if (!user || !supabase) return;
    
    const handleStorageChange = () => {
      // OPTIMISATION: Recalculer seulement les compteurs depuis les données déjà chargées
      // Ne pas recharger toutes les données depuis la base
      if (reservations.length > 0 || orders.length > 0) {
        // Recalculer les actions en attente depuis les données déjà en mémoire
        const viewedContracts = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_contracts') || '[]')
          : [];
        
        const contractsToSign = reservations.filter(
          (r) => (r.status === 'CONFIRMED' || r.status === 'CONTRACT_PENDING' || r.status === 'confirmed') 
            && (!r.client_signature || r.client_signature.trim() === '')
            && !viewedContracts.includes(r.id)
        ).length;

        const viewedConditionReports = typeof window !== 'undefined' 
          ? JSON.parse(localStorage.getItem('viewed_condition_reports') || '[]')
          : [];
        
        // Note: On ne peut pas recalculer conditionReportsToReview sans recharger etat_lieux
        // Mais c'est acceptable car cette donnée change rarement
        
        const viewedDeliveries = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_deliveries') || '[]')
          : [];
        
        const deliveriesNotReturned = reservations.filter(
          (r) => (r.status === 'CONFIRMED' || r.status === 'confirmed' || r.status === 'IN_PROGRESS' || r.status === 'in_progress')
            && r.delivery_status 
            && r.delivery_status !== 'termine'
            && !viewedDeliveries.includes(r.id)
        ).length;

        const viewedInvoices = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_invoices') || '[]')
          : [];
        
        const newInvoices = orders.filter(
          (o) => !viewedInvoices.includes(o.id)
        ).length;

        const viewedReservationsWithContracts = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_reservations_with_contracts') || '[]')
          : [];
        
        const reservationsWithContractsToSign = reservations.filter(
          (r) => (r.status === 'CONFIRMED' || r.status === 'CONTRACT_PENDING' || r.status === 'confirmed') 
            && (!r.client_signature || r.client_signature.trim() === '')
            && !viewedReservationsWithContracts.includes(r.id)
        ).length;

        setPendingActions({
          contractsToSign,
          conditionReportsToReview: pendingActions.conditionReportsToReview, // Garder la valeur précédente
          deliveriesNotReturned,
          newInvoices,
          reservationsWithContractsToSign,
        });
        return;
      }
      
      // Si pas de données en mémoire, recharger (mais sans limite)
      if (supabase) {
        const loadDashboardData = async () => {
          try {
            const { data: reservationsData } = await supabase
              .from('reservations')
              .select('*')
              .eq('user_id', user.id)
              .not('status', 'eq', 'PENDING')
              .not('status', 'eq', 'pending')
              .not('status', 'eq', 'CANCELLED')
              .not('status', 'eq', 'cancelled')
              .order('start_date', { ascending: true });

            if (!reservationsData) return;

            // Recalculer les actions en attente
            const viewedContracts = typeof window !== 'undefined'
              ? JSON.parse(localStorage.getItem('viewed_contracts') || '[]')
              : [];
            
            const contractsToSign = (reservationsData || []).filter(
              (r) => (r.status === 'CONFIRMED' || r.status === 'CONTRACT_PENDING' || r.status === 'confirmed') 
                && (!r.client_signature || r.client_signature.trim() === '')
                && !viewedContracts.includes(r.id)
            ).length;

            // OPTIMISATION: Charger seulement si on a des réservations
            let etatsLieuxData = null;
            if (reservationsData && reservationsData.length > 0) {
              const reservationIds = reservationsData.map(r => r.id);
              // Charger par batch si beaucoup de réservations
              if (reservationIds.length <= 100) {
                const { data } = await supabase
                  .from('etat_lieux')
                  .select('id, status, reservation_id')
                  .in('reservation_id', reservationIds);
                etatsLieuxData = data;
              } else {
                const batches = [];
                for (let i = 0; i < reservationIds.length; i += 100) {
                  batches.push(reservationIds.slice(i, i + 100));
                }
                const batchPromises = batches.map(batch =>
                  supabase
                    .from('etat_lieux')
                    .select('id, status, reservation_id')
                    .in('reservation_id', batch)
                );
                const batchResults = await Promise.all(batchPromises);
                etatsLieuxData = batchResults.flatMap(result => result.data || []);
              }
            }
            
            const viewedConditionReports = typeof window !== 'undefined' 
              ? JSON.parse(localStorage.getItem('viewed_condition_reports') || '[]')
              : [];
            
            const conditionReportsToReview = (etatsLieuxData || []).filter(
              (el) => (el.status === 'livraison_complete' || el.status === 'reprise_complete')
                && !viewedConditionReports.includes(el.id)
            ).length;

            const viewedDeliveries = typeof window !== 'undefined'
              ? JSON.parse(localStorage.getItem('viewed_deliveries') || '[]')
              : [];
            
            const deliveriesNotReturned = (reservationsData || []).filter(
              (r) => (r.status === 'CONFIRMED' || r.status === 'confirmed' || r.status === 'IN_PROGRESS' || r.status === 'in_progress')
                && r.delivery_status 
                && r.delivery_status !== 'termine'
                && !viewedDeliveries.includes(r.id)
            ).length;

            // Recalculer les nouvelles factures (recharger les orders)
            const { data: ordersData } = await supabase
              .from('orders')
              .select('*')
              .eq('customer_email', user.email)
              .order('created_at', { ascending: false })
              .limit(5);
            
            const viewedInvoices = typeof window !== 'undefined'
              ? JSON.parse(localStorage.getItem('viewed_invoices') || '[]')
              : [];
            
            const newInvoices = (ordersData || []).filter(
              (o) => !viewedInvoices.includes(o.id)
            ).length;

            setPendingActions({
              contractsToSign,
              conditionReportsToReview,
              deliveriesNotReturned,
              newInvoices,
            });
          } catch (error) {
            console.error('Erreur mise à jour compteurs:', error);
          }
        };
        loadDashboardData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Écouter aussi les changements dans le même onglet via un événement personnalisé
    window.addEventListener('pendingActionsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pendingActionsUpdated', handleStorageChange);
    };
  }, [user, supabase]);

  const texts = {
    fr: {
      dashboard: 'Tableau de bord',
      hello: 'Bonjour',
      welcome: 'Bienvenue sur votre espace client SoundRush',
      welcomeDescription: 'Gérez vos réservations, suivez vos livraisons, consultez vos états des lieux, signez vos contrats, annulez ou modifiez vos réservations, et bien plus encore depuis cet espace dédié.',
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
      myContracts: 'Mes contrats',
      myConditionReports: 'États des lieux',
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
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name')
          .eq('user_id', user.id)
          .single();

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
      } catch (error) {
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

  // Obtenir la prochaine réservation (exclure CANCELLED)
  const getNextReservation = () => {
    // Combiner les réservations de l'ancienne table et les nouvelles client_reservations
    const allReservations = [
      ...reservations.map(r => ({ ...r, type: 'old' })),
      ...clientReservations
        .filter(cr => {
          const status = cr.status?.toUpperCase();
          return status === 'PAID' || status === 'CONFIRMED';
        })
        .map(cr => ({
          ...cr,
          type: 'new',
          // Adapter les champs pour compatibilité avec l'ancienne structure
          start_date: cr.start_at || cr.created_at,
          end_date: cr.end_at || cr.created_at,
          total_price: cr.price_total,
          pack_id: cr.pack_key,
        }))
    ];
    
    const upcoming = allReservations
      .filter((r) => {
        const status = r.status?.toUpperCase();
        return status !== 'CANCELLED' &&
          status !== 'cancelled' &&
          (status === 'confirmed' || status === 'CONFIRMED' || status === 'PAID' || status === 'paid') &&
          new Date(r.start_date) >= new Date()
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return upcoming[0] || null;
  };

  // Obtenir les réservations à venir (sans la prochaine, exclure CANCELLED)
  const getUpcomingReservations = () => {
    const next = getNextReservation();
    
    // Combiner les réservations de l'ancienne table et les nouvelles client_reservations
    const allReservations = [
      ...reservations.map(r => ({ ...r, type: 'old' })),
      ...clientReservations
        .filter(cr => {
          const status = cr.status?.toUpperCase();
          return status === 'PAID' || status === 'CONFIRMED';
        })
        .map(cr => ({
          ...cr,
          type: 'new',
          // Adapter les champs pour compatibilité avec l'ancienne structure
          start_date: cr.start_at || cr.created_at,
          end_date: cr.end_at || cr.created_at,
          total_price: cr.price_total,
          pack_id: cr.pack_key,
        }))
    ];
    
    return allReservations
      .filter((r) => {
        const status = r.status?.toUpperCase();
        return status !== 'CANCELLED' &&
          status !== 'cancelled' &&
          r.id !== next?.id
      })
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
      // Nouveaux packs (client_reservations)
      'conference': { fr: 'Conférence', en: 'Conference' },
      'soiree': { fr: 'Soirée', en: 'Evening' },
      'mariage': { fr: 'Mariage', en: 'Wedding' },
    };

    return packNames[packId]?.[language] || `Pack ${packId}`;
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
          pendingActions={pendingActions}
        />

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Mobile-First */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
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

          {/* Message persistant pour les réservations payées non signées */}
          {(() => {
            const unpaidSignedReservations = reservations.filter(
              (r) => (r.status === 'CONFIRMED' || r.status === 'confirmed' || r.status === 'CONTRACT_PENDING') 
                && (!r.client_signature || r.client_signature.trim() === '')
            );
            
            if (unpaidSignedReservations.length > 0) {
              return (
                <Card className="mb-6 border-2 border-orange-500 bg-orange-50">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-orange-900 mb-2">
                          {language === 'fr' 
                            ? `⚠️ ${unpaidSignedReservations.length} contrat${unpaidSignedReservations.length > 1 ? 's' : ''} à signer`
                            : `⚠️ ${unpaidSignedReservations.length} contract${unpaidSignedReservations.length > 1 ? 's' : ''} to sign`}
                        </h3>
                        <p className="text-orange-800 mb-3">
                          {language === 'fr'
                            ? 'Vous avez des réservations payées qui nécessitent votre signature. Veuillez signer le contrat pour finaliser votre réservation.'
                            : 'You have paid reservations that require your signature. Please sign the contract to finalize your reservation.'}
                        </p>
                        <Link
                          href="/mes-contrats"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          {language === 'fr' ? 'Voir mes contrats à signer' : 'View contracts to sign'}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

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
                        {nextReservation.pack_id || nextReservation.pack_key
                          ? `Pack ${getPackName(nextReservation.pack_id || nextReservation.pack_key, language) || nextReservation.pack_id || nextReservation.pack_key}` 
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
                          <span>{nextReservation.total_price || nextReservation.price_total || 420}€ TTC</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="secondary"
                      className="w-full sm:w-auto bg-white text-[#F2431E] hover:bg-gray-100"
                    >
                      <Link href={nextReservation.type === 'new' ? `/dashboard?reservation=${nextReservation.id}` : `/mes-reservations/${nextReservation.id}`}>
                        {currentTexts.viewReservation}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Réservations en attente de paiement (client_reservations) */}
          {clientReservations.filter(r => {
            const status = r.status?.toUpperCase();
            return status === 'AWAITING_PAYMENT';
          }).length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Réservations en attente de paiement
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (user && supabase) {
                      const { data: clientReservationsData } = await supabase
                        .from('client_reservations')
                        .select('*')
                        .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
                        .order('created_at', { ascending: false });
                      
                      if (clientReservationsData) {
                        setClientReservations(clientReservationsData);
                      }
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualiser
                </Button>
              </div>
              <div className="space-y-4">
                {clientReservations
                  .filter(r => {
                    const status = r.status?.toUpperCase();
                    return status === 'AWAITING_PAYMENT';
                  })
                  .map((reservation) => {
                    const packNames: Record<string, string> = {
                      'conference': 'Pack Conférence',
                      'soiree': 'Pack Soirée',
                      'mariage': 'Pack Mariage'
                    };
                    const packName = packNames[reservation.pack_key] || reservation.pack_key;
                    
                    // Parser final_items si disponible
                    let finalItems: Array<{ label: string; qty: number }> = [];
                    try {
                      if (reservation.final_items) {
                        finalItems = typeof reservation.final_items === 'string' 
                          ? JSON.parse(reservation.final_items)
                          : reservation.final_items;
                      }
                    } catch (e) {
                      console.error('Erreur parsing final_items:', e);
                    }
                    
                    return (
                      <Card key={reservation.id} className="border-2 border-orange-500">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{packName}</h3>
                                
                                {/* Résumé client si disponible */}
                                {reservation.customer_summary && (
                                  <p className="text-sm text-gray-700 mb-3 italic bg-blue-50 p-2 rounded-lg border border-blue-200">
                                    {reservation.customer_summary}
                                  </p>
                                )}
                                
                                {/* Détail du matériel */}
                                {finalItems.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Matériel inclus :</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                      {finalItems.map((item, idx) => (
                                        <li key={idx}>
                                          {item.qty} {item.label.toLowerCase()}{item.qty > 1 ? 's' : ''}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Services inclus */}
                                <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                                  <p className="text-xs text-green-800">
                                    📦 Pack clé en main — livraison, installation et récupération incluses
                                  </p>
                                </div>
                                
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>
                                    <strong>Total:</strong> {reservation.price_total}€
                                  </p>
                                  <p>
                                    <strong>Caution:</strong> {reservation.deposit_amount}€
                                  </p>
                                  {reservation.start_at && (
                                    <p>
                                      <strong>Date:</strong> {new Date(reservation.start_at).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  )}
                                  {reservation.end_at && reservation.start_at !== reservation.end_at && (
                                    <p>
                                      <strong>Jusqu'au:</strong> {new Date(reservation.end_at).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  )}
                                  {reservation.address && (
                                    <p>
                                      <strong>Lieu:</strong> {reservation.address}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={async () => {
                                  try {
                                    // Récupérer le token d'authentification si disponible
                                    const { supabase } = await import('@/lib/supabase');
                                    let authHeader = '';
                                    
                                    if (supabase) {
                                      const { data: { session } } = await supabase.auth.getSession();
                                      if (session?.access_token) {
                                        authHeader = `Bearer ${session.access_token}`;
                                      }
                                    }
                                    
                                    const response = await fetch('/api/payments/create-checkout-session', {
                                      method: 'POST',
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        ...(authHeader ? { 'Authorization': authHeader } : {}),
                                      },
                                      body: JSON.stringify({
                                        reservation_id: reservation.id,
                                      }),
                                    });
                                    
                                    if (response.ok) {
                                      const data = await response.json();
                                      if (data.url) {
                                        window.location.href = data.url;
                                      } else {
                                        alert('Erreur: URL de paiement non reçue');
                                      }
                                    } else {
                                      const errorData = await response.json().catch(() => ({}));
                                      alert(errorData.error || 'Erreur lors de la création de la session de paiement');
                                    }
                                  } catch (error) {
                                    console.error('Erreur:', error);
                                    alert('Erreur lors de la création de la session de paiement');
                                  }
                                }}
                                className="bg-[#F2431E] hover:bg-[#E63A1A] text-white w-full sm:w-auto"
                              >
                                Payer maintenant
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Réservations payées (client_reservations) - Toujours afficher si PAID ou CONFIRMED */}
          {(() => {
            const paidReservations = clientReservations.filter(r => {
              const status = r.status?.toUpperCase();
              return status === 'PAID' || status === 'CONFIRMED';
            });
            
            // Ne pas afficher si aucune réservation payée
            if (paidReservations.length === 0) return null;
            
            return (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Réservations confirmées
                </h2>
                <div className="space-y-4">
                  {paidReservations.map((reservation) => {
                    const packNames: Record<string, string> = {
                      'conference': 'Pack Conférence',
                      'soiree': 'Pack Soirée',
                      'mariage': 'Pack Mariage'
                    };
                    const packName = packNames[reservation.pack_key] || reservation.pack_key;
                    
                    return (
                      <Card key={reservation.id} className="border-2 border-green-500">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">{packName}</h3>
                                  <Badge className="bg-green-500 text-white">
                                    {reservation.status === 'PAID' || reservation.status === 'paid' ? 'Payée' : 'Confirmée'}
                                  </Badge>
                                </div>
                                
                                {reservation.customer_summary && (
                                  <p className="text-sm text-gray-700 mb-3 italic bg-blue-50 p-2 rounded-lg border border-blue-200">
                                    {reservation.customer_summary}
                                  </p>
                                )}
                                
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>
                                    <strong>Total:</strong> {reservation.price_total}€
                                  </p>
                                  {reservation.start_at && (
                                    <p>
                                      <strong>Date:</strong> {new Date(reservation.start_at).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  )}
                                  {reservation.address && (
                                    <p>
                                      <strong>Lieu:</strong> {reservation.address}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
                {upcomingReservations.map((reservation) => {
                  // Vérifier si c'est un retrait sur place sans heures
                  let isPickupWithoutTimes = false;
                  if (reservation.notes) {
                    try {
                      const parsedNotes = JSON.parse(reservation.notes);
                      const cartItems = parsedNotes?.cartItems || [];
                      const hasDelivery = cartItems.some((item: any) => 
                        item.productId?.startsWith('delivery-') || 
                        item.metadata?.type === 'delivery'
                      );
                      isPickupWithoutTimes = !hasDelivery && 
                        (parsedNotes?.deliveryOption === 'retrait' || !parsedNotes?.deliveryOption) &&
                        (!reservation.pickup_time || !reservation.return_time);
                    } catch (e) {
                      // Ignorer les erreurs de parsing
                    }
                  }
                  
                  return (
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
                            {isPickupWithoutTimes && (
                              <p className="text-xs text-amber-600 mb-2 font-medium">
                                {language === 'fr' 
                                  ? 'Veuillez ajouter vos heures de retrait et retour'
                                  : 'Please add your pickup and return times'}
                              </p>
                            )}
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
                  );
                })}
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
                { icon: FileText, label: currentTexts.myContracts, color: 'blue', href: '/mes-contrats' },
                { icon: ClipboardList, label: currentTexts.myConditionReports, color: 'green', href: '/mes-etats-lieux' },
                { icon: FileText, label: currentTexts.myInvoices, color: 'red', href: '/mes-factures' },
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
                          action.color === 'red' ? 'bg-red-100' :
                          'bg-purple-100'
                        }`}>
                          <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${
                            action.color === 'orange' ? 'text-[#F2431E]' :
                            action.color === 'blue' ? 'text-blue-600' :
                            action.color === 'green' ? 'text-green-600' :
                            action.color === 'red' ? 'text-red-600' :
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

