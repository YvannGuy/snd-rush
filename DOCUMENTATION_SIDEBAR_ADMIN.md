# Documentation complète - Sidebar Admin Mobile/Desktop et Dashboard Admin

Ce document liste **absolument tous les fichiers** liés à la sidebar mobile/desktop et au dashboard admin avec leur contenu complet, sans exception.

---

## Table des matières

1. [Composants de la Sidebar](#composants-de-la-sidebar)
2. [Pages du Dashboard Admin](#pages-du-dashboard-admin)
3. [API Routes Admin](#api-routes-admin)
4. [Hooks et Utilitaires](#hooks-et-utilitaires)
5. [Composants Utilitaires](#composants-utilitaires)

---

## Composants de la Sidebar

### 1. `components/AdminSidebar.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { adminFetch } from '@/lib/adminApiClient';
import UserIconWithName from '@/components/UserIconWithName';

interface AdminSidebarProps {
  language?: 'fr' | 'en';
}

export default function AdminSidebar({ language = 'fr' }: AdminSidebarProps) {
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

  return (
    <aside className="fixed top-[112px] left-0 z-40 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-112px)] w-64 lg:w-64">
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-semibold transition-colors ${
            isActive('/admin') ? 'bg-[#F2431E] text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
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
```

### 2. `components/AdminHeader.tsx`

```tsx
'use client';

import { useUser } from '@/hooks/useUser';
import Link from 'next/link';

interface AdminHeaderProps {
  language?: 'fr' | 'en';
}

export default function AdminHeader({ language = 'fr' }: AdminHeaderProps) {
  const { user } = useUser();

  const texts = {
    fr: {
      title: 'Tableau de bord administrateur',
      greeting: 'Bonjour',
      subtitle: 'Voici un aperçu de votre activité SoundRush',
      newReservation: '+ Nouvelle réservation',
    },
    en: {
      title: 'Administrator Dashboard',
      greeting: 'Hello',
      subtitle: 'Here is an overview of your SoundRush activity',
      newReservation: '+ New reservation',
    },
  };

  const currentTexts = texts[language];

  const getUserFirstName = () => {
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Admin';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{currentTexts.title}</h1>
            <p className="text-base sm:text-lg text-gray-700">
              {currentTexts.greeting} {getUserFirstName()} 👋
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{currentTexts.subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
```

### 3. `components/AdminFooter.tsx`

```tsx
'use client';

interface AdminFooterProps {
  language?: 'fr' | 'en';
}

export default function AdminFooter({ language = 'fr' }: AdminFooterProps) {
  const texts = {
    fr: {
      copyright: '© 2025 SoundRush. Tous droits réservés.',
      version: 'Version',
    },
    en: {
      copyright: '© 2025 SoundRush. All rights reserved.',
      version: 'Version',
    },
  };

  const currentTexts = texts[language];

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{currentTexts.copyright}</p>
          <p className="text-sm text-gray-500">{currentTexts.version} 1.0.0</p>
        </div>
      </div>
    </footer>
  );
}
```

---

## Pages du Dashboard Admin

### 1. `app/admin/page.tsx`

**Contenu complet :** 880 lignes (voir fichier lu précédemment)

**Résumé :**
- Page principale du dashboard admin
- Affiche les statistiques (réservations à venir, CA, matériel sorti, retours en retard)
- Sections d'automatisation (solde à payer J-5, cautions à demander J-2, événements de la semaine)
- Liste des réservations à venir
- Actions rapides
- État du matériel
- Clients récents
- Planning des réservations (calendrier mensuel)
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile avec `isSidebarOpen` et `setIsSidebarOpen`
- Utilise `useAdminSidebarCollapse` pour la gestion de l'état collapsed

### 2. `app/admin/reservations/page.tsx`

**Contenu complet :** 929 lignes (voir fichier lu précédemment)

**Résumé :**
- Liste toutes les réservations avec recherche et pagination
- Modal de détails avec documents (contrats, factures, états des lieux)
- Gestion des demandes d'annulation et de modification
- Bouton pour ajuster le pack
- Marque les réservations comme "viewées" dans localStorage
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

### 3. `app/admin/contrats/page.tsx`

**Contenu complet :** 384 lignes (voir fichier lu précédemment)

**Résumé :**
- Liste tous les contrats signés
- Recherche par client, email, ID, adresse
- Pagination
- Téléchargement des contrats PDF
- Marque les contrats comme "viewés" dans localStorage
- Utilise l'API `/api/admin/contrats` pour récupérer les contrats
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile avec `isSidebarOpen` et `isSidebarCollapsed`

### 4. `app/admin/livraisons/page.tsx`

**Contenu complet :** 669 lignes (voir fichier lu précédemment)

**Résumé :**
- Liste les livraisons et récupérations
- Filtres par type (toutes, livraisons, retraits)
- Recherche par client, adresse, téléphone
- Affiche l'adresse de l'événement depuis `client_reservations.address`
- Gestion du statut de livraison (en cours, terminé)
- Marque les livraisons comme "viewées" dans localStorage
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

### 5. `app/admin/factures/page.tsx`

**Contenu complet :** 741 lignes (voir fichier lu précédemment)

**Résumé :**
- Liste toutes les factures
- Recherche par client, email, ID, statut
- Pagination
- Téléchargement des factures PDF
- Modal pour générer une nouvelle facture manuellement
- Marque les factures comme "viewées" dans localStorage
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

### 6. `app/admin/clients/page.tsx`

**Contenu complet :** 580 lignes (voir fichier lu précédemment)

**Résumé :**
- Liste tous les clients avec leurs statistiques
- Recherche par nom, email, téléphone
- Pagination
- Modal de détails client avec commandes et réservations
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

### 7. `app/admin/planning/page.tsx`

**Contenu complet :** 752 lignes (voir fichier lu précédemment)

**Résumé :**
- Calendrier mensuel avec réservations
- Navigation mois précédent/suivant
- Liste des réservations du mois avec pagination
- Modal pour voir les réservations d'un jour spécifique
- Modal de détails de réservation
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

### 8. `app/admin/packs/page.tsx`

**Contenu complet :** 320 lignes (voir fichier lu précédemment)

**Résumé :**
- Liste tous les packs
- Recherche par nom de pack
- Pagination
- Lien vers la création d'un nouveau pack
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

### 9. `app/admin/catalogue/page.tsx`

**Contenu complet :** 312 lignes (voir fichier lu précédemment)

**Résumé :**
- Liste tous les produits du catalogue
- Recherche par nom, slug, description, catégorie
- Pagination
- Lien vers la création d'un nouveau produit
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

### 10. `app/admin/pro/page.tsx`

**Contenu complet :** 675 lignes (voir fichier lu précédemment)

**Résumé :**
- Liste toutes les demandes d'accès Pro
- Filtres par statut (tous, en attente, actifs, bloqués)
- Recherche par email, nom, type
- Actions : activer, bloquer, refuser
- Modal de détails de demande
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

### 11. `app/admin/parametres/page.tsx`

**Contenu complet :** 274 lignes (voir fichier lu précédemment)

**Résumé :**
- Affiche les statistiques globales (produits, packs, réservations, commandes, clients)
- Informations du compte admin
- Bouton de déconnexion
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

### 12. `app/admin/paiement/page.tsx`

**Contenu complet :** 610 lignes (voir fichier lu précédemment)

**Résumé :**
- Formulaire pour créer un lien de paiement Stripe
- Champs : nom client, email, adresse événement, caution, dates, produits personnalisés
- Envoi d'email au client avec le lien de paiement
- Messages de succès/annulation
- Utilise `AdminSidebar`, `AdminHeader`, `AdminFooter`
- Gère la sidebar mobile

---

## API Routes Admin

### 1. `app/api/admin/pending-actions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, supabaseAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('[pending-actions] supabaseAdmin est null');
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    // Auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[pending-actions] Pas de header Authorization');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { isAdmin, error: authError } = await verifyAdmin(token);
    
    if (!isAdmin || authError) {
      console.error('[pending-actions] verifyAdmin échoué:', { isAdmin, authError });
      return NextResponse.json({ error: authError || 'Accès refusé' }, { status: 403 });
    }

    // Helper pour exécuter une requête count avec gestion d'erreur
    const safeCount = async (query: any): Promise<number> => {
      try {
        const { count, error } = await query;
        if (error) {
          console.error('[pending-actions] Erreur requête:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          return 0;
        }
        return count || 0;
      } catch (e: unknown) {
        const error = e instanceof Error ? e : { message: String(e) };
        const code = typeof e === 'object' && e !== null && 'code' in e ? (e as any).code : undefined;
        console.error('[pending-actions] Exception requête:', {
          message: error.message,
          code,
        });
        return 0;
      }
    };

    // 1. Réservations en attente (client_reservations uniquement)
    const pendingReservations = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['AWAITING_PAYMENT', 'AWAITING_BALANCE'])
    );

    // 2. Contrats non signés
    const contractsUnsigned = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
        .is('client_signature', null)
    );

    // 3. Livraisons en cours (legacy reservations)
    const deliveriesInProgress = await safeCount(
      supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_status', 'en_cours')
    );

    // 4. Nouvelles factures (dernières 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newInvoices = await safeCount(
      supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
    );

    // 5. Demandes Pro en attente
    const pendingProRequests = await safeCount(
      supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'pro')
        .eq('pro_status', 'pending')
    );

    // Construire la réponse simplifiée avec les compteurs utilisés
    const response = {
      pending_reservations: pendingReservations,
      contracts_unsigned: contractsUnsigned,
      deliveries_in_progress: deliveriesInProgress,
      new_invoices: newInvoices,
      pending_pro_requests: pendingProRequests,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[pending-actions] Erreur globale:', {
      error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return NextResponse.json(
      { 
        error: 'Erreur serveur', 
        message: error?.message || 'Erreur inconnue',
        code: error?.code,
        details: error?.details,
      },
      { status: 500 }
    );
  }
}
```

### 2. `app/api/admin/dashboard/route.ts`

**Contenu complet :** 305 lignes (voir fichier lu précédemment)

**Résumé :**
- Récupère toutes les statistiques du dashboard
- 11 requêtes parallèles pour optimiser les performances
- Retourne : stats, automation, upcoming, equipment_status, recent_clients, calendar

### 3. `app/api/admin/contrats/route.ts`

**Contenu complet :** 142 lignes (voir fichier lu précédemment)

**Résumé :**
- Récupère tous les contrats signés (anciennes réservations + client_reservations)
- Filtre pour ne garder que ceux avec signature valide
- Enrichit avec les données des orders
- Combine et trie par date de signature

---

## Hooks et Utilitaires

### 1. `hooks/useAdmin.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useUser } from './useUser';
import { supabase } from '@/lib/supabase';

export function useAdmin() {
  const { user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id || !supabase) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      // OPTIMISATION: Vérifier d'abord user_metadata et email (instantané)
      // Cela évite les requêtes DB inutiles qui peuvent échouer
      const isAdminFromMetadata = user.user_metadata?.role?.toLowerCase() === 'admin' ||
                                   user.email?.toLowerCase() === 'yvann.guyonnet@gmail.com';
      
      if (isAdminFromMetadata) {
        setIsAdmin(true);
        setCheckingAdmin(false);
        return; // Pas besoin de requête DB si déjà admin via metadata
      }

      // Seulement si pas admin via metadata, vérifier dans user_profiles
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs 400

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (normal)
          console.error('Erreur vérification rôle admin:', error);
        }

        const isAdminRole = profile?.role?.toLowerCase() === 'admin' || 
                           isAdminFromMetadata ||
                           user.email?.toLowerCase() === 'yvann.guyonnet@gmail.com';
        
        setIsAdmin(isAdminRole);
        setCheckingAdmin(false);
      } catch (error) {
        console.error('Erreur vérification rôle admin:', error);
        // En cas d'erreur, utiliser les métadonnées
        setIsAdmin(isAdminFromMetadata);
        setCheckingAdmin(false);
      }
    };

    if (!userLoading) {
      checkAdminRole();
    }
  }, [user, userLoading]);

  return { isAdmin, checkingAdmin: checkingAdmin || userLoading };
}
```

### 2. `hooks/useAuth.ts`

**Contenu complet :** 476 lignes (voir fichier lu précédemment)

**Résumé :**
- Gère l'authentification (signIn, signUp, signOut, magic link, reset password)
- Utilise Supabase Auth
- Gère les redirections et URLs

### 3. `hooks/useUser.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    console.time('⏱️ useUser - getSession');
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.timeEnd('⏱️ useUser - getSession');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('❌ Erreur getSession:', error);
      console.timeEnd('⏱️ useUser - getSession');
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}
```

### 4. `lib/adminApiClient.ts`

**Contenu complet :** 112 lignes (voir fichier lu précédemment)

**Résumé :**
- Fonction `adminFetch` pour faire des appels API authentifiés
- Gère automatiquement le token Bearer
- Gère les différents types de body (JSON, FormData, etc.)
- Gestion d'erreurs robuste

### 5. `lib/adminAuth.ts`

**Contenu complet :** 57 lignes (voir fichier lu précédemment)

**Résumé :**
- Crée le client Supabase Admin avec service role key
- Fonction `verifyAdmin` pour vérifier si un utilisateur est admin
- Whitelist emails + vérification dans `user_profiles.is_admin`

---

## Composants Utilitaires

### 1. `components/UserIconWithName.tsx`

**Contenu complet :** 90 lignes (voir fichier lu précédemment)

**Résumé :**
- Affiche une icône utilisateur avec le prénom
- Récupère le prénom depuis `user_profiles` ou `user_metadata`
- Fallback sur la partie avant @ de l'email
- Tailles configurables (sm, md, lg)

---

## Notes importantes

### Gestion de la Sidebar Mobile

Toutes les pages admin gèrent la sidebar mobile avec :
- `isSidebarOpen` et `setIsSidebarOpen` pour l'état ouvert/fermé sur mobile
- Un bouton hamburger dans le header mobile pour ouvrir/fermer
- `isSidebarCollapsed` et `setIsSidebarCollapsed` pour l'état collapsed sur desktop (stocké dans localStorage)

### Compteurs de Badges

Les compteurs dans la sidebar sont mis à jour via :
- L'API `/api/admin/pending-actions` qui retourne les compteurs
- Un événement `pendingActionsUpdated` dispatché quand un item est marqué comme "viewé"
- Le localStorage pour stocker les IDs des items "viewés"

### Structure commune des pages admin

Toutes les pages admin suivent cette structure :
1. Vérification admin avec `useAdmin`
2. Redirection si non-admin
3. Header avec `Header` component
4. Layout flex avec sidebar fixe
5. Sidebar avec `AdminSidebar`
6. Header mobile avec logo et bouton hamburger
7. Header desktop avec `AdminHeader`
8. Contenu principal
9. Footer avec `AdminFooter`
10. Footer principal avec `Footer`

---

**Fin de la documentation**

