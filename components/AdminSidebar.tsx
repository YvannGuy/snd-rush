'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

interface AdminSidebarProps {
  language?: 'fr' | 'en';
}

export default function AdminSidebar({ language = 'fr' }: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const { user } = useUser();

  const texts = {
    fr: {
      adminPanel: 'ADMIN PANEL',
      dashboard: 'Tableau de bord',
      reservations: 'Réservations',
      productCatalog: 'Catalogue produits',
      packs: 'Packs',
      planning: 'Planning & Disponibilités',
      clients: 'Clients',
      invoices: 'Factures',
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
      invoices: 'Invoices',
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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">♪</span>
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900 block">SoundRush</span>
            <span className="text-xs text-gray-500 font-semibold">{currentTexts.adminPanel}</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin')
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
          href="/admin/reservations"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors relative ${
            isActive('/admin/reservations')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {currentTexts.reservations}
          {/* Badge pour réservations en attente */}
          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">5</span>
        </Link>
        <Link
          href="/admin/catalogue"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/catalogue')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {currentTexts.productCatalog}
        </Link>
        <Link
          href="/admin/packs"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/packs')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {currentTexts.packs}
        </Link>
        <Link
          href="/admin/planning"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/planning')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {currentTexts.planning}
        </Link>
        <Link
          href="/admin/clients"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/clients')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {currentTexts.clients}
        </Link>
        <Link
          href="/admin/factures"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/factures')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {currentTexts.invoices}
        </Link>
        <Link
          href="/admin/parametres"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin/parametres')
              ? 'bg-[#F2431E] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {currentTexts.settings}
        </Link>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-10 h-10 rounded-full bg-[#F2431E] flex items-center justify-center text-white font-bold text-sm">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{getUserName()}</p>
            <p className="text-xs text-gray-500">{currentTexts.administrator}</p>
          </div>
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
      </div>
    </aside>
  );
}

