'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { adminFetch } from '@/lib/adminApiClient';
import UserIconWithName from '@/components/UserIconWithName';

interface AdminSidebarProps {
  language?: 'fr' | 'en';
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function AdminSidebar({
  language = 'fr',
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapsed,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const [pendingActions, setPendingActions] = useState({
    pending_reservations: 0,
    contracts_unsigned: 0,
    deliveries_in_progress: 0,
    new_invoices: 0,
    pending_pro_requests: 0,
  });

  const hasLoggedNoSession = useRef(false);

  const texts = {
    fr: {
      adminPanel: 'ADMIN PANEL',
      dashboard: 'Tableau de bord',
      reservations: 'Réservations',
      productCatalog: 'Catalogue produits',
      packs: 'Packs',
      planning: 'Planning & Disponibilités',
      clients: 'Clients',
      pro: 'Demandes Pro',
      invoices: 'Factures',
      contracts: 'Contrats',
      deliveries: 'Livraisons',
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
      pro: 'Pro Requests',
      invoices: 'Invoices',
      contracts: 'Contracts',
      deliveries: 'Deliveries',
      payment: 'Payment',
      settings: 'Settings',
      administrator: 'Administrator',
      logout: 'Logout',
    },
  } as const;

  const currentTexts = texts[language];

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin';
    return pathname?.startsWith(path);
  };

  useEffect(() => {
    const fetchPendingActions = async () => {
      try {
        const data = await adminFetch<{
          pending_reservations: number;
          contracts_unsigned: number;
          deliveries_in_progress: number;
          new_invoices: number;
          pending_pro_requests: number;
        }>('/api/admin/pending-actions');

        setPendingActions({
          pending_reservations: data.pending_reservations || 0,
          contracts_unsigned: data.contracts_unsigned || 0,
          deliveries_in_progress: data.deliveries_in_progress || 0,
          new_invoices: data.new_invoices || 0,
          pending_pro_requests: data.pending_pro_requests || 0,
        });

        hasLoggedNoSession.current = false;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'NO_SESSION') {
          if (!hasLoggedNoSession.current) {
            console.warn('[AdminSidebar] Pas de session, badges non chargés');
            hasLoggedNoSession.current = true;
          }
          // fail gracefully: keep 0s
        } else {
          console.error('[AdminSidebar] Erreur chargement badges:', error);
        }
      }
    };

    fetchPendingActions();

    const handlePendingActionsUpdated = () => {
      fetchPendingActions();
    };

    window.addEventListener('pendingActionsUpdated', handlePendingActionsUpdated);

    return () => {
      window.removeEventListener('pendingActionsUpdated', handlePendingActionsUpdated);
    };
  }, []);

  const closeSidebar = () => {
    if (onClose) onClose();
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`
          fixed top-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col h-screen
          w-64 transition-transform duration-300 transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:w-64 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
        aria-hidden={!isOpen && typeof window !== 'undefined' ? undefined : undefined}
      >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">♪</span>
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900 block">SoundRush</span>
            <span className="text-xs text-gray-500 font-semibold">{currentTexts.adminPanel}</span>
          </div>
        </Link>
        {/* Bouton collapse desktop optionnel */}
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 ml-3"
            aria-label={isCollapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {/* Bouton fermer mobile */}
        {onClose && (
          <button
            type="button"
            onClick={closeSidebar}
            className="lg:hidden ml-3 p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            aria-label="Fermer la sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin') ? 'bg-[#F2431E] text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>{currentTexts.dashboard}</span>
        </Link>

        <Link
          href="/admin/reservations"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/reservations')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="flex-1">{currentTexts.reservations}</span>
          {(pendingActions.pending_reservations ?? 0) > 0 && (
            <span className="bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingActions.pending_reservations}
            </span>
          )}
        </Link>

        <Link
          href="/admin/catalogue"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/catalogue')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <span>{currentTexts.productCatalog}</span>
        </Link>

        <Link
          href="/admin/packs"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/packs') ? 'bg-[#F2431E] text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <span>{currentTexts.packs}</span>
        </Link>

        <Link
          href="/admin/planning"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/planning')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{currentTexts.planning}</span>
        </Link>

        <Link
          href="/admin/clients"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/clients')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>{currentTexts.clients}</span>
        </Link>

        <Link
          href="/admin/pro"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/pro')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="flex-1">{currentTexts.pro}</span>
          {(pendingActions.pending_pro_requests ?? 0) > 0 && (
            <span className="bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingActions.pending_pro_requests}
            </span>
          )}
        </Link>

        <Link
          href="/admin/factures"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/factures')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="flex-1">{currentTexts.invoices}</span>
          {(pendingActions.new_invoices ?? 0) > 0 && (
            <span className="bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingActions.new_invoices}
            </span>
          )}
        </Link>

        <Link
          href="/admin/contrats"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/contrats')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="flex-1">{currentTexts.contracts}</span>
          {(pendingActions.contracts_unsigned ?? 0) > 0 && (
            <span className="bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingActions.contracts_unsigned}
            </span>
          )}
        </Link>

        <Link
          href="/admin/livraisons"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
            isActive('/admin/livraisons')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <span className="flex-1">{currentTexts.deliveries}</span>
          {(pendingActions.deliveries_in_progress ?? 0) > 0 && (
            <span className="bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingActions.deliveries_in_progress}
            </span>
          )}
        </Link>

        <Link
          href="/admin/paiement"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/paiement')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <span>{currentTexts.payment}</span>
        </Link>

        <Link
          href="/admin/parametres"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/parametres')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={handleNavClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{currentTexts.settings}</span>
        </Link>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-col items-center gap-2 mb-3 px-2">
          <UserIconWithName iconSize="md" className="text-gray-700" />
          <p className="text-xs text-gray-500 text-center">{currentTexts.administrator}</p>
        </div>

        <button
          onClick={async () => {
            await signOut();
            router.push('/');
            closeSidebar();
          }}
          className="flex items-center gap-2 w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {currentTexts.logout}
        </button>
      </div>
    </aside>
    </>
  );
}
