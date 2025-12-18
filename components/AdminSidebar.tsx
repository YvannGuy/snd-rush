'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import UserIconWithName from '@/components/UserIconWithName';

interface AdminSidebarProps {
  language?: 'fr' | 'en';
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  pendingActions?: {
    pendingReservations?: number;
    contractsToSign?: number;
    conditionReportsToReview?: number;
    deliveriesInProgress?: number;
    pendingCancellations?: number;
    pendingModifications?: number;
    pendingProRequests?: number;
    pendingReservationRequests?: number;
  };
}

export default function AdminSidebar({ language = 'fr', isOpen = false, onClose, isCollapsed = false, onToggleCollapse, pendingActions: propsPendingActions }: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const [localPendingActions, setLocalPendingActions] = useState({
    pendingReservations: 0,
    contractsToSign: 0,
    conditionReportsToReview: 0,
    deliveriesInProgress: 0,
    pendingCancellations: 0,
    pendingModifications: 0,
    pendingProRequests: 0,
    pendingReservationRequests: 0,
  });

  const texts = {
    fr: {
      adminPanel: 'ADMIN PANEL',
      dashboard: 'Tableau de bord',
      reservations: 'Réservations',
      productCatalog: 'Catalogue produits',
      packs: 'Packs',
      planning: 'Planning & Disponibilités',
      clients: 'Clients',
      proAccess: 'Accès Pro',
      reservationRequests: 'Demandes de réservation',
      invoices: 'Factures',
      contracts: 'Contrats',
      deliveries: 'Livraisons',
      etatsDesLieux: 'États des lieux',
      payment: 'Paiement',
      settings: 'Paramètres',
      administrator: 'Administrateur',
      logout: 'Déconnexion',
    },
    en: {
      adminPanel: 'ADMIN PANEL',
      dashboard: 'Dashboard',
      reservations: 'Reservations',
      productCatalog: 'Product Catalog',
      packs: 'Packs',
      planning: 'Planning & Availabilities',
      clients: 'Clients',
      proAccess: 'Pro Access',
      reservationRequests: 'Reservation Requests',
      invoices: 'Invoices',
      contracts: 'Contracts',
      deliveries: 'Deliveries',
      etatsDesLieux: 'Condition reports',
      payment: 'Payment',
      settings: 'Settings',
      administrator: 'Administrator',
      logout: 'Logout',
    },
  };

  const currentTexts = texts[language];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  const getUserName = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Admin';
  };

  const getUserInitials = () => {
    const name = getUserName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Utiliser les props si fournies, sinon calculer localement
  const pendingActions = propsPendingActions || localPendingActions;

  // Calculer les compteurs si pas fournis en props
  useEffect(() => {
    if (propsPendingActions || !user || !supabase) return;

    const calculatePendingActions = async () => {
      try {
        // Réservations en attente (non vues)
        const viewedReservations = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('admin_viewed_reservations') || '[]')
          : [];
        
        const { data: pendingReservationsData } = await supabase
          .from('reservations')
          .select('id, status')
          .eq('status', 'PENDING');
        
        const pendingReservations = (pendingReservationsData || []).filter(
          (r) => !viewedReservations.includes(r.id)
        ).length;

        // Contrats à signer par les clients
        const viewedContracts = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('admin_viewed_contracts') || '[]')
          : [];
        
        const { data: contractsData } = await supabase
          .from('reservations')
          .select('id, status, client_signature')
          .in('status', ['CONFIRMED', 'CONTRACT_PENDING', 'confirmed'])
          .or('client_signature.is.null,client_signature.eq.');
        
        const contractsToSign = (contractsData || []).filter(
          (r) => (!r.client_signature || r.client_signature.trim() === '')
            && !viewedContracts.includes(r.id)
        ).length;

        // États des lieux à traiter
        const viewedConditionReports = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('admin_viewed_condition_reports') || '[]')
          : [];
        
        const { data: etatsLieuxData } = await supabase
          .from('etat_lieux')
          .select('id, status')
          .in('status', ['livraison_complete', 'reprise_complete']);
        
        const conditionReportsToReview = (etatsLieuxData || []).filter(
          (el) => !viewedConditionReports.includes(el.id)
        ).length;

        // Livraisons en cours
        const viewedDeliveries = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('admin_viewed_deliveries') || '[]')
          : [];
        
        const { data: deliveriesData } = await supabase
          .from('reservations')
          .select('id, status, delivery_status')
          .in('status', ['CONFIRMED', 'confirmed', 'IN_PROGRESS', 'in_progress'])
          .not('delivery_status', 'is', null)
          .neq('delivery_status', 'termine');
        
        const deliveriesInProgress = (deliveriesData || []).filter(
          (r) => !viewedDeliveries.includes(r.id)
        ).length;

        // Demandes d'annulation en attente (non vues)
        const viewedCancellations = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('admin_viewed_cancellations') || '[]')
          : [];
        
        const { data: cancellationsData } = await supabase
          .from('reservations')
          .select('id, status')
          .in('status', ['CANCEL_REQUESTED', 'cancel_requested']);
        
        const pendingCancellations = (cancellationsData || []).filter(
          (r) => !viewedCancellations.includes(r.id)
        ).length;

        // Demandes de modification en attente (non vues)
        const viewedModifications = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('admin_viewed_modifications') || '[]')
          : [];
        
        const { data: modificationsData } = await supabase
          .from('reservations')
          .select('id, status')
          .in('status', ['CHANGE_REQUESTED', 'change_requested']);
        
        const pendingModifications = (modificationsData || []).filter(
          (r) => !viewedModifications.includes(r.id)
        ).length;

        // Charger le nombre de demandes pro en attente
        let pendingProRequests = 0;
        try {
          const response = await fetch('/api/admin/pro-requests');
          if (response.ok) {
            const data = await response.json();
            pendingProRequests = (data.requests || []).filter((r: any) => r.pro_status === 'pending').length;
          }
        } catch (error) {
          // Erreur silencieuse
        }

        // Demandes de réservation non vues (NEW ou PENDING_REVIEW)
        const viewedReservationRequests = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('admin_viewed_reservation_requests') || '[]')
          : [];
        
        let pendingReservationRequests = 0;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const response = await fetch('/api/admin/reservation-requests', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              const newRequests = (data.requests || []).filter(
                (r: any) => (r.status === 'NEW' || r.status === 'PENDING_REVIEW')
                  && !viewedReservationRequests.includes(r.id)
              );
              pendingReservationRequests = newRequests.length;
            }
          }
        } catch (error) {
          // Erreur silencieuse
        }

        setLocalPendingActions({
          pendingReservations,
          contractsToSign,
          conditionReportsToReview,
          deliveriesInProgress,
          pendingCancellations,
          pendingModifications,
          pendingProRequests,
          pendingReservationRequests,
        });
      } catch (error) {
        // Erreur silencieuse
      }
    };

    calculatePendingActions();

    // Écouter les changements
    const handleStorageChange = () => {
      calculatePendingActions();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pendingActionsUpdated', handleStorageChange);

    // Recharger toutes les 30 secondes
    const interval = setInterval(calculatePendingActions, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pendingActionsUpdated', handleStorageChange);
      clearInterval(interval);
    };
  }, [user, supabase, propsPendingActions]);

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-[112px] left-0 z-40 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-112px)] transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
      {/* Logo */}
      <div className={`p-6 border-b border-gray-200 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <>
            <Link href="/admin" className="flex items-center gap-2 flex-1" onClick={onClose}>
              <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">♪</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 block">SoundRush</span>
                <span className="text-xs text-gray-500 font-semibold">{currentTexts.adminPanel}</span>
              </div>
            </Link>
            {/* Bouton toggle sidebar pour desktop */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Réduire la sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">♪</span>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="absolute top-2 right-2 p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Agrandir la sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}
        {/* Bouton fermer pour mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <Link
          href="/admin"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.dashboard : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {!isCollapsed && <span>{currentTexts.dashboard}</span>}
        </Link>
        <Link
          href="/admin/reservations"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/reservations')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.reservations : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.reservations}</span>
          )}
          {((pendingActions.pendingReservations ?? 0) > 0 || (pendingActions.pendingCancellations ?? 0) > 0 || (pendingActions.pendingModifications ?? 0) > 0) && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {(pendingActions.pendingReservations ?? 0) + (pendingActions.pendingCancellations ?? 0) + (pendingActions.pendingModifications ?? 0)}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.reservations}
            </div>
          )}
        </Link>
        <Link
          href="/admin/reservation-requests"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/reservation-requests')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.reservationRequests : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.reservationRequests}</span>
          )}
          {((pendingActions.pendingReservationRequests ?? 0) > 0) && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {pendingActions.pendingReservationRequests}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.reservationRequests}
            </div>
          )}
        </Link>
        <Link
          href="/admin/catalogue"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/catalogue')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.productCatalog : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {!isCollapsed && <span>{currentTexts.productCatalog}</span>}
        </Link>
        <Link
          href="/admin/packs"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/packs')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.packs : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {!isCollapsed && <span>{currentTexts.packs}</span>}
        </Link>
        <Link
          href="/admin/planning"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/planning')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.planning : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {!isCollapsed && <span>{currentTexts.planning}</span>}
        </Link>
        <Link
          href="/admin/clients"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/clients')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.clients : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {!isCollapsed && <span>{currentTexts.clients}</span>}
        </Link>
        <Link
          href="/admin/pro"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/pro')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.proAccess : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.proAccess}</span>
          )}
          {((localPendingActions.pendingProRequests ?? 0) + (propsPendingActions?.pendingProRequests ?? 0)) > 0 && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {(localPendingActions.pendingProRequests ?? 0) + (propsPendingActions?.pendingProRequests ?? 0)}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.proAccess}
            </div>
          )}
        </Link>
        <Link
          href="/admin/factures"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/factures')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.invoices : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {!isCollapsed && <span>{currentTexts.invoices}</span>}
        </Link>
        <Link
          href="/admin/contrats"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/contrats')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.contracts : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.contracts}</span>
          )}
          {(pendingActions.contractsToSign ?? 0) > 0 && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {pendingActions.contractsToSign}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.contracts}
            </div>
          )}
        </Link>
        <Link
          href="/admin/livraisons"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/livraisons')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.deliveries : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.deliveries}</span>
          )}
          {(pendingActions.deliveriesInProgress ?? 0) > 0 && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {pendingActions.deliveriesInProgress}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.deliveries}
            </div>
          )}
        </Link>
        <Link
          href="/admin/etats-des-lieux"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/etats-des-lieux')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.etatsDesLieux : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.etatsDesLieux}</span>
          )}
          {(pendingActions.conditionReportsToReview ?? 0) > 0 && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {pendingActions.conditionReportsToReview}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.etatsDesLieux}
            </div>
          )}
        </Link>
        <Link
          href="/admin/paiement"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/paiement')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.payment : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          {!isCollapsed && <span>{currentTexts.payment}</span>}
        </Link>
        <Link
          href="/admin/parametres"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/parametres')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.settings : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!isCollapsed && <span>{currentTexts.settings}</span>}
        </Link>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <>
            <div className="flex flex-col items-center gap-2 mb-3 px-2">
              <UserIconWithName iconSize="md" className="text-gray-700" />
              <p className="text-xs text-gray-500 text-center">{currentTexts.administrator}</p>
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className="flex items-center gap-2 w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {currentTexts.logout}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UserIconWithName iconSize="sm" className="text-gray-700" />
            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title={currentTexts.logout}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}

