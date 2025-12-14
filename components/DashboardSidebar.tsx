'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';

interface DashboardSidebarProps {
  language?: 'fr' | 'en';
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  pendingActions?: {
    contractsToSign?: number;
    conditionReportsToReview?: number;
    deliveriesNotReturned?: number;
    newInvoices?: number;
    reservationsWithContractsToSign?: number;
  };
}

export default function DashboardSidebar({ language = 'fr', isOpen = false, onClose, isCollapsed = false, onToggleCollapse, pendingActions: propsPendingActions }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const [localPendingActions, setLocalPendingActions] = useState({
    contractsToSign: 0,
    conditionReportsToReview: 0,
    deliveriesNotReturned: 0,
    newInvoices: 0,
  });

  // Utiliser les props si fournies, sinon calculer localement
  const pendingActions = propsPendingActions || localPendingActions;

  // Calculer les compteurs si pas fournis en props
  useEffect(() => {
    if (propsPendingActions || !user || !supabase) return;

    const calculatePendingActions = async () => {
      try {
        // Charger les réservations
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: true });

        if (!reservationsData) return;

        // Contrats à signer (pour "Mes contrats")
        const viewedContracts = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_contracts') || '[]')
          : [];
        
        const contractsToSign = reservationsData.filter(
          (r) => (r.status === 'CONFIRMED' || r.status === 'CONTRACT_PENDING' || r.status === 'confirmed') 
            && (!r.client_signature || r.client_signature.trim() === '')
            && !viewedContracts.includes(r.id)
        ).length;

        // Réservations avec contrats à signer (pour "Mes réservations")
        const viewedReservationsWithContracts = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_reservations_with_contracts') || '[]')
          : [];
        
        const reservationsWithContractsToSign = reservationsData.filter(
          (r) => (r.status === 'CONFIRMED' || r.status === 'CONTRACT_PENDING' || r.status === 'confirmed') 
            && (!r.client_signature || r.client_signature.trim() === '')
            && !viewedReservationsWithContracts.includes(r.id)
        ).length;

        // États des lieux
        const { data: etatsLieuxData } = await supabase
          .from('etat_lieux')
          .select('id, status, reservation_id')
          .in('reservation_id', reservationsData.map(r => r.id));
        
        const viewedConditionReports = typeof window !== 'undefined' 
          ? JSON.parse(localStorage.getItem('viewed_condition_reports') || '[]')
          : [];
        
        const conditionReportsToReview = (etatsLieuxData || []).filter(
          (el) => (el.status === 'livraison_complete' || el.status === 'reprise_complete')
            && !viewedConditionReports.includes(el.id)
        ).length;

        // Livraisons
        const viewedDeliveries = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('viewed_deliveries') || '[]')
          : [];
        
        const deliveriesNotReturned = reservationsData.filter(
          (r) => (r.status === 'CONFIRMED' || r.status === 'confirmed' || r.status === 'IN_PROGRESS' || r.status === 'in_progress')
            && r.delivery_status 
            && r.delivery_status !== 'termine'
            && !viewedDeliveries.includes(r.id)
        ).length;

        // Factures
        let newInvoices = 0;
        if (user.email) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id')
            .eq('customer_email', user.email)
            .order('created_at', { ascending: false })
            .limit(5);
          
          const viewedInvoices = typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('viewed_invoices') || '[]')
            : [];
          
          newInvoices = (ordersData || []).filter(
            (o) => !viewedInvoices.includes(o.id)
          ).length;
        }

        setLocalPendingActions({
          contractsToSign,
          conditionReportsToReview,
          deliveriesNotReturned,
          newInvoices,
          reservationsWithContractsToSign,
        });
      } catch (error) {
      }
    };

    calculatePendingActions();

    // Écouter les changements
    const handleStorageChange = () => {
      calculatePendingActions();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pendingActionsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pendingActionsUpdated', handleStorageChange);
    };
  }, [user, supabase, propsPendingActions]);

  const texts = {
    fr: {
      dashboard: 'Tableau de bord',
      myReservations: 'Mes réservations',
      myDeliveries: 'Mes livraisons',
      myEtatsLieux: 'États des lieux',
      documentsInvoices: 'Factures',
      myContracts: 'Mes contrats',
      myInfo: 'Mes informations',
      logout: 'Déconnexion',
    },
    en: {
      dashboard: 'Dashboard',
      myReservations: 'My reservations',
      myDeliveries: 'My deliveries',
      myEtatsLieux: 'Condition reports',
      documentsInvoices: 'Invoices',
      myContracts: 'My contracts',
      myInfo: 'My information',
      logout: 'Logout',
    },
  };

  const currentTexts = texts[language];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(path);
  };

  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [pathname]);

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:fixed top-16 left-0 z-50
          ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-[calc(100vh-4rem)]
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Bandeau orange aligné avec le Header */}
        <div className="bg-[#F2431E] text-white py-2 px-4 border-b border-[#E63A1A] flex-shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-[38px]`}>
            {!isCollapsed && (
              <div className="text-xs sm:text-sm font-medium opacity-90">
                Menu
              </div>
            )}
            {isCollapsed && (
              <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
            )}
          </div>
        </div>

        {/* Contenu de la sidebar */}
        <div className="flex-1 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
          {/* Logo et Toggle */}
          <div className={`p-4 lg:p-6 border-b border-gray-200 flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          {/* Bouton toggle desktop - Toujours à gauche */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label={isCollapsed ? 'Ouvrir la sidebar' : 'Fermer la sidebar'}
          >
            {isCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 flex-1 min-w-0" onClick={onClose}>
              <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">♪</span>
              </div>
              <span className="text-xl font-bold text-gray-900 truncate">SoundRush</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/" className="flex items-center justify-center" onClick={onClose}>
              <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">♪</span>
              </div>
            </Link>
          )}
          {/* Bouton fermer mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <Link
          href="/dashboard"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/dashboard')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.dashboard : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {!isCollapsed && <span>{currentTexts.dashboard}</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.dashboard}
            </div>
          )}
        </Link>
        <Link
          href="/mes-reservations"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/mes-reservations')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.myReservations : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.myReservations}</span>
          )}
          {(pendingActions.reservationsWithContractsToSign ?? 0) > 0 && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {pendingActions.reservationsWithContractsToSign}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.myReservations}
            </div>
          )}
        </Link>
        <Link
          href="/mes-livraisons"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/mes-livraisons')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.myDeliveries : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.myDeliveries}</span>
          )}
          {(pendingActions.deliveriesNotReturned ?? 0) > 0 && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {pendingActions.deliveriesNotReturned}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.myDeliveries}
            </div>
          )}
        </Link>
        <Link
          href="/mes-etats-lieux"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/mes-etats-lieux')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.myEtatsLieux : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.myEtatsLieux}</span>
          )}
          {(pendingActions.conditionReportsToReview ?? 0) > 0 && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {pendingActions.conditionReportsToReview}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.myEtatsLieux}
            </div>
          )}
        </Link>
        <Link
          href="/mes-factures"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/mes-factures')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.documentsInvoices : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.documentsInvoices}</span>
          )}
          {(pendingActions.newInvoices ?? 0) > 0 && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {pendingActions.newInvoices}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.documentsInvoices}
            </div>
          )}
        </Link>
        <Link
          href="/mes-contrats"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/mes-contrats')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.myContracts : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {!isCollapsed && (
            <span className="flex-1">{currentTexts.myContracts}</span>
          )}
          {(pendingActions.contractsToSign ?? 0) > 0 && (
            <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {pendingActions.contractsToSign}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.myContracts}
            </div>
          )}
        </Link>
        <Link
          href="/mes-informations"
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/mes-informations')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? currentTexts.myInfo : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {!isCollapsed && <span>{currentTexts.myInfo}</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.myInfo}
            </div>
          )}
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={async () => {
            await signOut();
            router.push('/');
          }}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 w-full text-[#F2431E] hover:bg-orange-50 rounded-xl transition-colors font-semibold group relative`}
          title={isCollapsed ? currentTexts.logout : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {!isCollapsed && <span>{currentTexts.logout}</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {currentTexts.logout}
            </div>
          )}
        </button>
      </div>
        </div>
      </aside>
    </>
  );
}

