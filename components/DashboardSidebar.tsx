'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface DashboardSidebarProps {
  language?: 'fr' | 'en';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ language = 'fr', isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();

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
          fixed lg:sticky top-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 flex flex-col h-screen
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">♪</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SoundRush</span>
          </Link>
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
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/dashboard')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {currentTexts.dashboard}
        </Link>
        <Link
          href="/mes-reservations"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/mes-reservations')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {currentTexts.myReservations}
        </Link>
        <Link
          href="/mes-livraisons"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/mes-livraisons')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {currentTexts.myDeliveries}
        </Link>
        <Link
          href="/mes-etats-lieux"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/mes-etats-lieux')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {currentTexts.myEtatsLieux}
        </Link>
        <Link
          href="/mes-factures"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/mes-factures')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {currentTexts.documentsInvoices}
        </Link>
        <Link
          href="/mes-contrats"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/mes-contrats')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {currentTexts.myContracts}
        </Link>
        <Link
          href="/mes-informations"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/mes-informations')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {currentTexts.myInfo}
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={async () => {
            await signOut();
            router.push('/');
          }}
          className="flex items-center gap-3 px-4 py-3 w-full text-[#F2431E] hover:bg-orange-50 rounded-xl transition-colors font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {currentTexts.logout}
        </button>
      </div>
    </aside>
    </>
  );
}

