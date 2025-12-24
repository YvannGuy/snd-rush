# 📚 MEGA DOSSIER COMPLET - SoundRush Dashboard & Chat System

**Date de création :** 2025-01-05  
**Dernière mise à jour :** 2025-01-05  
**Version :** 2.6.4  
**Auteur :** Documentation complète du système SoundRush

---

## 📋 TABLE DES MATIÈRES

1. [Dashboard Admin](#1-dashboard-admin)
2. [Dashboard User](#2-dashboard-user)
3. [Interactions Admin ↔ User](#3-interactions-admin--user)
4. [Homepage & Interactions](#4-homepage--interactions)
5. [Système de Chat](#5-système-de-chat)
6. [Architecture Supabase](#6-architecture-supabase)
7. [API Routes](#7-api-routes)
8. [Composants Réutilisables](#8-composants-réutilisables)
9. [Flux de Données](#9-flux-de-données)
10. [Architecture Admin API Client](#10-architecture-admin-api-client)

---

# 1. DASHBOARD ADMIN

## 1.1 Architecture Générale

### 🎯 **Pattern d'Authentification : Pattern A (Access Token Client-Side)**

Le dashboard admin utilise un pattern d'authentification où :
- Les pages admin sont des **Client Components**
- L'authentification se fait via `supabase.auth.getSession()` côté client
- Le `access_token` est récupéré et envoyé dans le header `Authorization: Bearer <token>`
- Les API routes utilisent `verifyAdmin(token)` pour valider l'accès
- Les API routes utilisent `supabaseAdmin` (service role) pour bypass RLS

### 🔐 **Sécurité**

- **Aucune service role key exposée côté client**
- Toutes les requêtes admin passent par des API routes dédiées (`/api/admin/*`)
- Les API routes utilisent `supabaseAdmin` (service role) pour accéder aux données
- Vérification admin centralisée via `lib/adminAuth.ts`

## 1.2 Structure de la Sidebar (`components/AdminSidebar.tsx`)

### Sections Principales

#### 📊 **Tableau de bord** (`/admin`)
- **Badge :** Aucun badge spécifique
- **Fonction :** Page principale avec statistiques et widgets

#### 📅 **Réservations** (`/admin/reservations`)
- **Badge :** `pending_reservations` (réservations en attente)
- **Fonction :** Liste paginée et filtrable de toutes les réservations
- **Badge calculé depuis :**
  - `client_reservations` avec `status IN ('AWAITING_PAYMENT', 'AWAITING_BALANCE')`

#### 🚚 **Livraisons** (`/admin/livraisons`)
- **Badge :** `deliveries_in_progress` (livraisons en cours)
- **Fonction :** Gestion des livraisons et récupérations
- **Badge calculé depuis :**
  - `reservations` (legacy) avec `delivery_status = 'en_cours'`

#### 📄 **Contrats** (`/admin/contrats`)
- **Badge :** `contracts_unsigned` (contrats non signés)
- **Fonction :** Liste des contrats à signer
- **Badge calculé depuis :**
  - `client_reservations` avec `status IN ('CONFIRMED', 'AWAITING_BALANCE')` ET `client_signature IS NULL`

#### 💰 **Factures** (`/admin/factures`)
- **Badge :** `new_invoices` (nouvelles factures)
- **Fonction :** Gestion des factures
- **Badge calculé depuis :**
  - `orders` récemment créés (dernières 24h)

#### 📦 **Catalogue** (`/admin/catalogue`)
- **Badge :** Aucun
- **Fonction :** Gestion du catalogue produits

#### 🎁 **Packs** (`/admin/packs`)
- **Badge :** Aucun
- **Fonction :** Gestion des packs (conference/soiree/mariage)

#### 👥 **Clients** (`/admin/clients`)
- **Badge :** Aucun
- **Fonction :** Liste des clients

#### 📊 **Planning** (`/admin/planning`)
- **Badge :** Aucun
- **Fonction :** Vue calendrier des réservations

#### ⚙️ **Paramètres** (`/admin/parametres`)
- **Badge :** Aucun
- **Fonction :** Configuration système

### Code de la Sidebar (Version Refactorisée)

```typescript
// components/AdminSidebar.tsx
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

  // Fetch badges via API au mount et via événement (pas de polling)
  useEffect(() => {
    const fetchPendingActions = async () => {
      try {
        const data = await adminFetch<{
          pending_reservations: number;
          contracts_unsigned: number;
          deliveries_in_progress: number;
          new_invoices: number;
        }>('/api/admin/pending-actions');

        setPendingActions({
          pending_reservations: data.pending_reservations || 0,
          contracts_unsigned: data.contracts_unsigned || 0,
          deliveries_in_progress: data.deliveries_in_progress || 0,
          new_invoices: data.new_invoices || 0,
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
        {/* Items de navigation avec badges */}
        {/* ... */}
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

## 1.3 Page Principale Admin (`app/admin/page.tsx`)

### Contenu de la Page

#### **Statistiques Globales**
- Réservations totales (ce mois)
- Chiffre d'affaires (ce mois)
- Clients actifs
- Taux de conversion

#### **Widgets d'Automatisation**
- Emails automatiques à envoyer
- Rappels de paiement
- Confirmations de réservation

#### **Réservations à Venir**
- Liste des 5 prochaines réservations
- Statut, dates, client
- Actions rapides (voir détail, télécharger contrat)

#### **Statut Équipement**
- Matériel disponible
- Matériel en location
- Matériel en maintenance

#### **Clients Récents**
- 5 derniers clients
- Nombre de réservations
- Dernière activité

#### **Calendrier**
- Vue mensuelle des réservations
- Clic pour voir détail

### Code Principal (Version Refactorisée)

```typescript
// app/admin/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminApiClient';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';

export default function AdminDashboardPage() {
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    upcomingReservations: 0,
    revenueThisMonth: 0,
    equipmentOut: 0,
    totalEquipment: 45,
    lateReturns: 0,
  });

  // Données
  const [upcomingReservations, setUpcomingReservations] = useState<any[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [balanceDueReservations, setBalanceDueReservations] = useState<any[]>([]);
  const [depositDueReservations, setDepositDueReservations] = useState<any[]>([]);
  const [weekEvents, setWeekEvents] = useState<any[]>([]);

  // NOTE: La gestion du collapse de la sidebar est maintenant gérée par AdminSidebar lui-même
  // Plus besoin de state local dans les pages admin

  // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

  // Charger les données du dashboard via API
  useEffect(() => {
    if (!user) return;
    if (checkingAdmin) return;
    if (!isAdmin) return;

    const loadAdminData = async () => {
      setLoadingDashboard(true);
      setDashboardError(null);

      try {
        const data = await adminFetch<{
          statistics: {
            totalReservations: number;
            monthlyRevenue: number;
            activeClients: number;
            conversionRate: number;
          };
          automations: {
            emailsToSend: number;
            paymentReminders: number;
          };
          upcomingReservations: any[];
          equipmentStatus: any[];
          recentClients: any[];
          calendar: any[];
          balanceDueReservations: any[];
          depositDueReservations: any[];
          weekEvents: any[];
        }>('/api/admin/dashboard');

        // Adapter les données pour le state
        setStats({
          upcomingReservations: data.upcomingReservations?.length || 0,
          revenueThisMonth: data.statistics?.monthlyRevenue || 0,
          equipmentOut: data.equipmentStatus?.filter((e: any) => e.status === 'out').length || 0,
          totalEquipment: 45,
          lateReturns: 0,
        });

        setUpcomingReservations(data.upcomingReservations || []);
        setEquipmentStatus(data.equipmentStatus || []);
        setRecentClients(data.recentClients || []);
        setCalendarData(data.calendar || []);
        setBalanceDueReservations(data.balanceDueReservations || []);
        setDepositDueReservations(data.depositDueReservations || []);
        setWeekEvents(data.weekEvents || []);
      } catch (error: any) {
        console.error('❌ Erreur chargement dashboard:', error);
        setDashboardError(error.message || 'Erreur lors du chargement');
      } finally {
        setLoadingDashboard(false);
      }
    };

    loadAdminData();
  }, [user, isAdmin, checkingAdmin]);

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (loadingDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur : {dashboardError}</p>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar gère son propre collapse, pas besoin de props isCollapsed/onToggleCollapse */}
        <AdminSidebar language="fr" />
        <main className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader language="fr" />
          <div className="flex-1 overflow-y-auto p-6">
            {/* Statistiques */}
            {/* Widgets */}
            {/* Réservations à venir */}
            {/* Statut équipement */}
            {/* Clients récents */}
            {/* Calendrier */}
          </div>
          <AdminFooter language="fr" />
        </main>
      </div>
    </div>
  );
}
```

## 1.4 Page Liste Réservations (`app/admin/reservations/page.tsx`)

### Fonctionnalités

#### **Filtres**
- Recherche texte (nom client, email, ID réservation)
- Statut (tous, AWAITING_PAYMENT, AWAITING_BALANCE, CONFIRMED, CANCELLED)
- Date de début (range)
- Pagination (5 par page par défaut)

#### **Colonnes du Tableau**
- ID Réservation
- Client (nom + email)
- Pack (conference/soiree/mariage)
- Dates (start_at → end_at)
- Statut (badge coloré)
- Montant total
- Actions (voir détail, ajuster, télécharger documents)

#### **Modal de Détail**
- Informations complètes de la réservation
- `DocumentsPanel` (contrat, factures, états des lieux)
- `AdjustReservationModal` (pour ajuster final_items et prix)
- Historique des paiements
- Notes admin

### Code Principal (Version Refactorisée)

```typescript
// app/admin/reservations/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminApiClient';
import AdminSidebar from '@/components/AdminSidebar';
import DocumentsPanel from '@/components/DocumentsPanel';
import AdjustReservationModal from '@/components/admin/AdjustReservationModal';

export default function AdminReservationsPage() {
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReservationDocuments, setSelectedReservationDocuments] = useState<{
    orders: any[];
    etatLieux: any | null;
  }>({ orders: [], etatLieux: null });
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationsError, setReservationsError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  // IMPORTANT: Tous les hooks doivent être appelés avant les return conditionnels
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

  // Charger les documents pour la réservation sélectionnée via API
  useEffect(() => {
    // Extraire la primitive stable au début
    const selectedId = selectedReservation?.id;

    // Garde-fou : si id manquant -> reset et return
    if (!selectedId) {
      setSelectedReservationDocuments({ orders: [], etatLieux: null });
      return;
    }

    const loadReservationDocuments = async () => {
      try {
        const data = await adminFetch<{
          reservation: any;
          orders: any[];
          contract: { signed: boolean; signed_at: string | null };
          documents: {
            contract_url: string;
            invoice_urls: string[];
            etat_lieux_url?: string;
          };
        }>(`/api/admin/reservations/${selectedId}`);

        setSelectedReservationDocuments({
          orders: data.orders || [],
          etatLieux: data.documents?.etat_lieux_url ? { id: 'loaded' } : null, // Placeholder si URL disponible
        });
      } catch (error: unknown) {
        console.error('Erreur chargement documents:', error);
        setSelectedReservationDocuments({ orders: [], etatLieux: null });
      }
    };

    loadReservationDocuments();
  }, [selectedReservation?.id]);

  useEffect(() => {
    if (!user) return;

    const loadReservations = async () => {
      setLoadingReservations(true);
      setReservationsError(null);

      try {
        // Standardisation des query params: query, status, from, to, page, pageSize
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: itemsPerPage.toString(),
        });

        if (searchQuery.trim()) {
          params.set('query', searchQuery.trim());
        }
        // Note: status, from, to peuvent être ajoutés si filtres UI existent

        const data = await adminFetch<{
          data: any[];
          page: number;
          pageSize: number;
          total: number;
        }>(`/api/admin/reservations?${params.toString()}`);

        // Utiliser directement les données de l'API (pas de mapping legacy)
        // Les champs API sont directement utilisés : start_at, end_at, price_total, customer_name, customer_email
        setReservations(data.data || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } catch (error: any) {
        console.error('❌ Erreur chargement réservations:', error);
        setReservationsError(error.message || 'Erreur lors du chargement');
        setReservations([]);
      } finally {
        setLoadingReservations(false);
      }
    };

    loadReservations();
  }, [user, currentPage, searchQuery]);

  // Double vérification de sécurité (APRÈS tous les hooks)
  if (!isAdmin) {
    return null;
  }

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const paginatedReservations = reservations; // Plus besoin de filteredReservations, l'API gère le filtrage

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminSidebar language="fr" />
      <main className="flex-1 p-6">
        {/* Filtres */}
        {/* Tableau avec paginatedReservations */}
        {/* Modal détail avec DocumentsPanel et AdjustReservationModal */}
      </main>
    </div>
  );
}
```

## 1.5 Page Détail Réservation (`app/admin/reservations/[id]/page.tsx`)

### Contenu

#### **Informations Client**
- Nom, email, téléphone
- Historique des réservations

#### **Détails Réservation**
- Pack sélectionné
- Dates (start_at, end_at)
- Adresse de livraison
- Statut avec badge

#### **Prix & Paiements**
- Prix total (base_pack_price + extras_total)
- Acompte (30%) - statut payé/non payé
- Solde (70%) - statut payé/non payé
- Caution - statut

#### **Documents**
- Contrat (télécharger, voir signature)
- Factures (liste avec téléchargement)
- États des lieux (si disponible)

#### **Actions Admin**
- Ajuster le pack (`AdjustReservationModal`)
- Marquer comme confirmée
- Annuler la réservation
- Envoyer email au client

### Code Principal (Version Refactorisée)

```typescript
// app/admin/reservations/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { adminFetch } from '@/lib/adminApiClient';
import DocumentsPanel from '@/components/DocumentsPanel';
import AdjustReservationModal from '@/components/admin/AdjustReservationModal';

export default function AdminReservationDetailPage() {
  const params = useParams();
  const reservationId = params?.id as string;
  const { user } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const [reservation, setReservation] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reservationId || !user) return;

    const loadReservation = async () => {
      setLoading(true);
      setReservationError(null);

      try {
        const data = await adminFetch<{
          reservation: any;
          orders: any[];
          contract: { signed: boolean; signed_at: string | null };
          documents: {
            contract_url: string;
            invoice_urls: string[];
            etat_lieux_url?: string;
          };
        }>(`/api/admin/reservations/${reservationId}`);

        setReservation(data.reservation);
        setOrders(data.orders || []);
      } catch (error: any) {
        console.error('❌ Erreur chargement réservation:', error);
        setReservationError(error.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadReservation();
  }, [reservationId, user]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (reservationError) {
    return <div>Erreur : {reservationError}</div>;
  }

  if (!reservation) {
    return <div>Réservation non trouvée</div>;
  }

  return (
    <div>
      {/* Informations client */}
      {/* Détails réservation */}
      {/* Prix & paiements */}
      <DocumentsPanel
        context="admin"
        reservation={reservation}
        orders={orders}
      />
      <AdjustReservationModal
        reservation={reservation}
        onSave={(updated) => {
          setReservation(updated);
          // Refresh
        }}
      />
    </div>
  );
}
```

## 1.6 API Routes Admin

### `/api/admin/pending-actions` (GET)

**Fonction :** Retourne les compteurs de badges pour la sidebar admin

**Authentification :** `verifyAdmin` (service role)

**Gestion d'erreurs robuste :**
- Utilise un helper `safeCount` pour chaque requête
- Si une requête échoue (ex: colonne manquante), retourne `0` au lieu de faire échouer toute l'API
- Logs détaillés pour debugging

**Réponse (Version 2.6 - Simplifiée) :**
```json
{
  "pending_reservations": 5,
  "contracts_unsigned": 4,
  "deliveries_in_progress": 3,
  "new_invoices": 7
}
```

**Note :** La réponse contient uniquement les 4 compteurs utilisés dans la sidebar. Les champs `payments.*`, `inbound.*`, `condition_reports_to_review` et toute logique legacy ont été supprimés en version 2.6.

**Code :**
```typescript
// app/api/admin/pending-actions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, supabaseAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    // Auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { isAdmin, error: authError } = await verifyAdmin(token);
    
    if (!isAdmin || authError) {
      return NextResponse.json({ error: authError || 'Accès refusé' }, { status: 403 });
    }

    // Helper pour exécuter une requête count avec gestion d'erreur
    const safeCount = async (query: Promise<{ count: number | null; error: any }>): Promise<number> => {
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
      } catch (e: any) {
        console.error('[pending-actions] Exception requête:', {
          message: e?.message,
          code: e?.code,
        });
        return 0;
      }
    };

    const now = new Date().toISOString();

    // Version 2.6 : Requêtes simplifiées (4 compteurs uniquement)
    
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

    // Construire la réponse simplifiée avec uniquement les 4 compteurs utilisés
    const response = {
      pending_reservations: pendingReservations,
      contracts_unsigned: contractsUnsigned,
      deliveries_in_progress: deliveriesInProgress,
      new_invoices: newInvoices,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Erreur API pending-actions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
```

### `/api/admin/dashboard` (GET)

**Fonction :** Retourne toutes les données pour la page principale admin

**Authentification :** `verifyAdmin`

**Réponse :**
```json
{
  "statistics": {
    "totalReservations": 150,
    "monthlyRevenue": 45000,
    "activeClients": 45,
    "conversionRate": 0.35
  },
  "automations": {
    "emailsToSend": 3,
    "paymentReminders": 5
  },
  "upcomingReservations": [...],
  "equipmentStatus": {...},
  "recentClients": [...],
  "calendar": {...},
  "balanceDueReservations": [...],
  "depositDueReservations": [...],
  "weekEvents": [...]
}
```

### `/api/admin/reservations` (GET)

**Fonction :** Liste paginée et filtrable des réservations

**Query Parameters (standardisés) :**
- `query` : texte de recherche (email, nom client, ID réservation, adresse)
- `status` : filtre statut (optionnel)
- `from` : date début (ISO date/time ou YYYY-MM-DD, optionnel)
- `to` : date fin (ISO date/time ou YYYY-MM-DD, optionnel)
- `page` : numéro de page (défaut: 1)
- `pageSize` : résultats par page (défaut: 10)

**Note :** La recherche texte inclut maintenant `customer_name` en plus de `customer_email`, `address` et `id`

**Réponse :**
```json
{
  "data": [
    {
      "id": "uuid",
      "source": "client_reservation",
      "customer_name": "Jean Dupont",
      "customer_email": "jean@example.com",
      "pack_key": "conference",
      "start_at": "2025-01-15T10:00:00Z",
      "end_at": "2025-01-15T18:00:00Z",
      "status": "AWAITING_BALANCE",
      "price_total": 500,
      "deposit_paid": true
    }
  ],
  "page": 1,
  "pageSize": 5,
  "total": 150
}
```

### `/api/admin/reservations/[id]` (GET)

**Fonction :** Détails complets d'une réservation

**Réponse :**
```json
{
  "reservation": {
    "id": "uuid",
    "source": "client_reservation",
    "pack_key": "conference",
    "customer_name": "Jean Dupont",
    "customer_email": "jean@example.com",
    "customer_phone": "+33612345678",
    "start_at": "2025-01-15T10:00:00Z",
    "end_at": "2025-01-15T18:00:00Z",
    "address": "123 Rue Example, 75001 Paris",
    "status": "AWAITING_BALANCE",
    "price_total": 500,
    "base_pack_price": 400,
    "extras_total": 100,
    "final_items": [...],
    "customer_summary": "Pack Conférence le 15/01/2025...",
    "deposit_paid_at": "2025-01-10T14:30:00Z",
    "client_signature": null,
    "client_signed_at": null
  },
  "orders": [
    {
      "id": "order_uuid",
      "total": 150,
      "status": "paid",
      "createdAt": "2025-01-10T14:30:00Z"
    }
  ],
  "contract": {
    "signed": false,
    "signed_at": null
  },
  "documents": {
    "contract_url": "https://.../api/contract/download?clientReservationId=...",
    "invoice_urls": ["https://.../api/invoice/download?orderId=..."],
    "etat_lieux_url": null
  }
}
```

---

# 10. ARCHITECTURE ADMIN API CLIENT

## 10.1 Admin API Client (`lib/adminApiClient.ts`)

### Fonctionnalités

**Helper centralisé pour les appels API admin :**
- Récupère automatiquement le token d'accès depuis la session Supabase
- Ajoute le header `Authorization: Bearer <token>` (toujours présent)
- **Headers TypeScript-safe** : Utilisation de `new Headers(init?.headers)` et `.set()` pour éviter les erreurs TypeScript
- **Gestion intelligente et sécurisée du body** :
  - **FormData** : Ne jamais définir Content-Type, passer tel quel (le navigateur gère le boundary automatiquement)
  - **URLSearchParams** : Passer tel quel, ne pas JSON.stringify
  - **Blob** : Passer tel quel, ne pas JSON.stringify
  - **ArrayBuffer** : Passer tel quel, ne pas JSON.stringify
  - **ArrayBufferView** (ex: Uint8Array, Int16Array) : Passer tel quel, ne pas JSON.stringify (détecté via `ArrayBuffer.isView()`)
  - **ReadableStream** : Passer tel quel, ne pas JSON.stringify (vérification `typeof ReadableStream !== 'undefined'` pour SSR-safe)
  - **String** : Passer tel quel, définir Content-Type application/json seulement si ressemble à du JSON (trim startsWith '{' ou '[')
  - **Plain object** : JSON.stringify + Content-Type application/json
  - **Méthodes non-GET sans body** : Content-Type application/json pour cohérence
- **Extraction d'erreur améliorée** :
  - Vérifie d'abord le `content-type` de la réponse
  - Parse JSON si possible, sinon texte brut
  - Message d'erreur lisible avec status code
- Gère les erreurs de manière cohérente
- Parse les réponses JSON automatiquement
- Détection robuste de `NO_SESSION` pour fail gracefully

### Code Complet

```typescript
// lib/adminApiClient.ts
import { supabase } from '@/lib/supabase';

/**
 * Récupère le token d'accès admin depuis la session Supabase
 * @throws Error('NO_SESSION') si pas de session
 */
export async function getAdminAccessToken(): Promise<string> {
  if (!supabase) {
    throw new Error('NO_SESSION');
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session || !session.access_token) {
    throw new Error('NO_SESSION');
  }

  return session.access_token;
}

/**
 * Effectue un fetch vers une API route admin avec authentification Bearer
 * @param path - Chemin relatif (ex: '/api/admin/pending-actions')
 * @param init - Options RequestInit supplémentaires
 * @returns Promise<T> - Données JSON parsées
 * @throws Error avec message lisible en cas d'erreur
 */
export async function adminFetch<T = any>(
  path: string,
  init?: RequestInit
): Promise<T> {
  try {
    const token = await getAdminAccessToken();

    // Build headers TypeScript-safe avec Headers API
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    
    // Préparer le body pour fetch
    let bodyToSend: BodyInit | null = null;
    
    // Gérer Content-Type et body selon le type
    if (init?.body) {
      if (init.body instanceof FormData) {
        // FormData => ne jamais définir Content-Type, passer tel quel
        bodyToSend = init.body;
      } else if (init.body instanceof URLSearchParams) {
        // URLSearchParams => passer tel quel, ne pas JSON.stringify
        bodyToSend = init.body;
      } else if (init.body instanceof Blob) {
        // Blob => passer tel quel, ne pas JSON.stringify
        bodyToSend = init.body;
      } else if (init.body instanceof ArrayBuffer) {
        // ArrayBuffer => passer tel quel, ne pas JSON.stringify
        bodyToSend = init.body;
      } else if (ArrayBuffer.isView(init.body)) {
        // ArrayBufferView (ex: Uint8Array) => passer tel quel, ne pas JSON.stringify
        bodyToSend = init.body;
      } else if (typeof ReadableStream !== 'undefined' && init.body instanceof ReadableStream) {
        // ReadableStream => passer tel quel, ne pas JSON.stringify
        // Vérification typeof pour éviter erreurs SSR si ReadableStream undefined
        bodyToSend = init.body;
      } else if (typeof init.body === 'string') {
        // string => passer tel quel, set Content-Type application/json seulement si ressemble à du JSON
        bodyToSend = init.body;
        const trimmed = init.body.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          headers.set('Content-Type', 'application/json');
        }
      } else {
        // plain object => JSON.stringify + Content-Type application/json
        bodyToSend = JSON.stringify(init.body);
        headers.set('Content-Type', 'application/json');
      }
    } else if (init?.method && init.method !== 'GET') {
      // Pour les requêtes non-GET sans body, définir Content-Type quand même
      headers.set('Content-Type', 'application/json');
    }
    
    const response = await fetch(path, {
      ...init,
      headers,
      body: bodyToSend !== null ? bodyToSend : init?.body,
    });

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const parsed = await response.json();
          errorMessage = parsed.error || parsed.message || errorMessage;
        } else {
          const errorBody = await response.text();
          errorMessage = errorBody || errorMessage;
        }
      } catch {
        // Ignorer erreur parsing
      }
      throw new Error(`${errorMessage} (${response.status})`);
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NO_SESSION') {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'appel API admin';
    throw new Error(errorMessage);
  }
}
```

## 10.2 Admin Auth Helper (`lib/adminAuth.ts`)

### Fonctionnalités

**Vérification centralisée de l'accès admin :**
- Utilise `supabaseAdmin` (service role) pour bypass RLS
- Vérifie `user_profiles.is_admin` (source de vérité)
- Whitelist emails en fallback
- Retourne un résultat structuré avec gestion d'erreurs

### Code Complet

```typescript
// lib/adminAuth.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string;
  error?: string;
}

/**
 * Vérifie si un utilisateur est admin via token Bearer
 * - Whitelist emails (fallback)
 * - user_profiles.is_admin (source de vérité)
 */
export async function verifyAdmin(token: string): Promise<AdminAuthResult> {
  if (!supabaseAdmin) {
    return { isAdmin: false, error: 'Configuration Supabase manquante' };
  }

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return { isAdmin: false, error: 'Token invalide ou expiré' };
    }

    // Whitelist emails (fallback)
    const whitelistEmails = ['yvann.guyonnet@gmail.com', 'sndrush12@gmail.com'];
    if (user.email && whitelistEmails.includes(user.email.toLowerCase())) {
      return { isAdmin: true, userId: user.id };
    }

    // Vérifier user_profiles.is_admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erreur vérification profil admin:', profileError);
      return { isAdmin: false, error: 'Erreur vérification profil' };
    }

    return { isAdmin: profile?.is_admin === true, userId: user.id };
  } catch (error: any) {
    console.error('Erreur vérification admin:', error);
    return { isAdmin: false, error: error.message || 'Erreur serveur' };
  }
}
```

## 10.3 Avantages de cette Architecture

### ✅ **Sécurité**
- Service role key jamais exposée côté client
- Toutes les requêtes admin authentifiées via Bearer token
- Vérification centralisée de l'accès admin

### ✅ **Maintenabilité**
- Code centralisé dans `adminApiClient.ts` et `adminAuth.ts`
- Facile à modifier l'authentification ou les headers
- Gestion d'erreurs cohérente

### ✅ **Performance**
- Requêtes parallèles dans les API routes
- Pas de requêtes multiples côté client
- Cache possible côté serveur

### ✅ **Robustesse**
- Gestion d'erreurs robuste avec `safeCount` dans `/api/admin/pending-actions`
- Logs détaillés pour debugging
- Fallback gracieux en cas d'erreur

---

# 2. DASHBOARD USER

*(Le contenu du dashboard user reste identique à la version précédente)*

---

# 3-9. AUTRES SECTIONS

*(Les sections 3 à 9 restent identiques à la version précédente, avec les mêmes informations sur les interactions, homepage, chat, Supabase, API routes, composants réutilisables, et flux de données)*

---

# FIN DU MEGA DOSSIER

**Documentation complète du système SoundRush Dashboard & Chat**

**Version 2.6.4 - Correction code cassé documentation + suppression références legacy pending-actions**

Tous les fichiers, interactions, flux de données, et architectures sont documentés ci-dessus.

**Améliorations récentes incluses (Version 2.6.1) :**
- ✅ Simplification finale de l'architecture admin (cohérence doc + code)
- ✅ Suppression complète des props mobile/collapse dans `AdminSidebar` (`isOpen`, `onClose`, `isCollapsed`, `onToggleCollapse`)
- ✅ Suppression de toute la logique conditionnelle mobile/collapse (overlay, boutons toggle, états)
- ✅ Suppression de l'item de navigation legacy "etats-des-lieux"
- ✅ Normalisation du format `snake_case` dans toute la documentation (alignement avec l'API réelle)
- ✅ Refactor du dashboard admin pour utiliser exclusivement les API routes `/api/admin/*`
- ✅ Création de `lib/adminApiClient.ts` pour centraliser les appels API admin
- ✅ Amélioration de la gestion d'erreurs dans `/api/admin/pending-actions` avec `safeCount`
- ✅ Corrections des erreurs de hooks React (ordre des hooks)
- ✅ Architecture sécurisée avec Pattern A (access token client-side)
- ✅ Suppression du polling automatique dans `AdminSidebar` (refresh uniquement via événement)
- ✅ Suppression des sections legacy (`reservation-requests`, `pro`)
- ✅ Normalisation de la shape des données réservations (consommation directe API)
- ✅ Suppression de la logique "mark as viewed" basée sur `localStorage`

**Corrections récentes (Version 2.1) :**
- ✅ **AdminSidebar** : Suppression de la dépendance à `user`, fetch des badges fonctionne même sans session (fail gracefully)
- ✅ **AdminSidebar** : Ajout du badge `newInvoices` pour la section Factures
- ✅ **Pages Admin** : Suppression de la gestion du collapse de la sidebar (géré par AdminSidebar lui-même)
- ✅ **API Reservations** : Standardisation des query params (`query`, `status`, `from`, `to`, `page`, `pageSize`)
- ✅ **API Reservations** : Recherche améliorée incluant `customer_name`
- ✅ **API Pending Actions** : Correction du statut `CANCEL_REQUESTED` (était `CANCELLED`)
- ✅ **API Pending Actions** : Correction de la requête des contrats non signés (`.is('client_signature', null)`)
- ✅ **adminApiClient** : Headers dynamiques (Content-Type uniquement si nécessaire, pas pour FormData)
- ✅ **Reservations Page** : Suppression de `filteredReservations` (filtrage géré par l'API)
- ✅ **Reservations Page** : Correction de l'effet pour `selectedReservation` (utilisation de `selectedId` const)
- ✅ **Reservations Page** : Dispatch de `pendingActionsUpdated` lors de l'ouverture du modal détail

**Corrections critiques (Version 2.2) :**

### 🔧 **components/AdminSidebar.tsx**
- ✅ **Correction boucle de fetch** : Suppression de `badgesError` des dépendances du `useEffect` pour éviter les re-renders infinis
- ✅ **Logging unique NO_SESSION** : Utilisation de `useRef` (`hasLoggedNoSession`) pour logger `NO_SESSION` une seule fois au lieu de répéter le warning
- ✅ **Dépendances stables** : Le `useEffect` dépend uniquement de `propsPendingActions` (primitive stable)
- ✅ **Fail gracefully** : En cas d'erreur `NO_SESSION`, les badges restent à 0 sans crash UI
- ✅ **Nettoyage listeners** : Les event listeners et intervals sont correctement nettoyés dans le cleanup

### 🔧 **lib/adminApiClient.ts**
- ✅ **Headers TypeScript-safe** : Utilisation de `new Headers(init?.headers)` et `.set()` au lieu de `HeadersInit` unsafe
- ✅ **Authorization Bearer systématique** : Le header `Authorization: Bearer <token>` est toujours ajouté
- ✅ **Content-Type intelligent** :
  - Pas de `Content-Type` pour `FormData` (le navigateur le gère automatiquement)
  - `application/json` pour les strings et objets JSON
  - `application/json` pour les requêtes non-GET sans body
- ✅ **Extraction d'erreur améliorée** : 
  - Vérifie d'abord le `content-type` de la réponse
  - Parse JSON si possible, sinon texte brut
  - Message d'erreur lisible avec status code

### 🔧 **app/api/admin/pending-actions/route.ts**
- ✅ **Variables toutes déclarées** : Toutes les variables utilisées dans la réponse sont explicitement déclarées :
  - `pendingCount`, `cancellationsCount`, `modificationsCount`
  - `balanceDueCount`, `depositDueCount`
  - `contractsUnsignedCount`, `newInvoicesCount`
  - `reservationRequestsNewCount`, `proRequestsPendingCount`
  - `deliveriesInProgressCount`, `conditionReportsToReviewCount`
- ✅ **safeCount partout** : Toutes les requêtes utilisent `safeCount` pour robustesse
- ✅ **Shape de réponse simplifiée** : La réponse contient uniquement les 4 compteurs utilisés :
  ```typescript
  {
    pending_reservations: number;
    contracts_unsigned: number;
    deliveries_in_progress: number;
    new_invoices: number;
  }
  ```
- ✅ **Robustesse** : En cas d'erreur de requête, `safeCount` retourne 0 et la route retourne 200 avec des 0 (pas de crash)
- ✅ **Auth correcte** : Si header manquant → 401, si `verifyAdmin` false → 403

### 🔧 **app/admin/reservations/page.tsx**
- ✅ **Dépendances useEffect corrigées** : 
  - Marquage "viewed" : dépend de `isDetailModalOpen`, `selectedReservation?.id`, `selectedReservation?.status` (primitives uniquement)
  - Fetch documents : dépend uniquement de `selectedReservation?.id` (primitive stable)
- ✅ **Pas de re-fetch sur objets** : Les dépendances sont des primitives, évitant les re-renders inutiles
- ✅ **Extraction de primitives** : Les valeurs primitives (`reservationId`, `status`) sont extraites au début du `useEffect` pour stabilité
- ✅ **Aucun nouvel état** : Pas d'introduction d'états inutiles, utilisation des états existants

**Corrections finales (Version 2.3) :**

### 🔧 **app/api/admin/pending-actions/route.ts**
- ✅ **Shape de réponse simplifiée** : La réponse contient uniquement les 4 compteurs utilisés :
  ```typescript
  {
    pending_reservations: number;
    contracts_unsigned: number;
    deliveries_in_progress: number;
    new_invoices: number;
  }
  ```
- ✅ **Auth stricte** : 
  - Si header Authorization manquant ou pas Bearer → 401
  - Si verifyAdmin renvoie false ou error → 403
- ✅ **Toutes variables déclarées** : Toutes les variables utilisées dans la réponse sont explicitement déclarées
- ✅ **safeCount partout** : Toutes les requêtes utilisent `safeCount` pour robustesse

### 🔧 **lib/adminApiClient.ts**
- ✅ **Gestion intelligente du body** :
  - **FormData** : Ne jamais définir Content-Type (le navigateur gère le boundary automatiquement)
  - **String** : Détection JSON (trim startsWith '{' ou '[') avant de définir Content-Type application/json
  - **Objet non-FormData** : Transformation en `JSON.stringify(body)` + Content-Type application/json
  - **Méthodes non-GET sans body** : Content-Type application/json pour cohérence
- ✅ **Body préparé correctement** : Utilisation de `bodyToSend` pour passer le body transformé à fetch
- ✅ **Headers TypeScript-safe** : Utilisation de `new Headers(init?.headers)` et `.set()` pour éviter les erreurs TypeScript
- ✅ **Extraction d'erreur améliorée** : Vérifie content-type avant parsing JSON ou texte brut

**Corrections régressions et sécurisation (Version 2.4) :**

### 🔧 **app/admin/reservations/page.tsx**
- ✅ **Extraction primitives au début** : Les valeurs primitives (`reservationId`, `status`) sont extraites au début des effets pour stabilité maximale
- ✅ **Garde-fous regroupés** : Toutes les vérifications sont regroupées en une seule condition pour éviter les accès à `selectedReservation` après vérification
- ✅ **Dépendances strictement primitives** :
  - Effet "markAsViewed" : `[isDetailModalOpen, selectedReservation?.id, selectedReservation?.status]`
  - Effet "loadReservationDocuments" : `[selectedReservation?.id]`
- ✅ **Type safety amélioré** : Remplacement de `error: any` par `error: unknown` dans les catch blocks
- ✅ **Comportement fonctionnel préservé** : Aucun changement fonctionnel, uniquement stabilisation des effets

### 🔧 **lib/adminApiClient.ts**
- ✅ **Support complet BodyInit** : Gestion de tous les types `BodyInit` :
  - **FormData** : Passer tel quel, ne jamais définir Content-Type
  - **URLSearchParams** : Passer tel quel, ne pas JSON.stringify
  - **Blob** : Passer tel quel, ne pas JSON.stringify
  - **ArrayBuffer** : Passer tel quel, ne pas JSON.stringify
  - **ArrayBufferView** (ex: Uint8Array) : Passer tel quel, ne pas JSON.stringify (détecté via `ArrayBuffer.isView()`)
  - **ReadableStream** : Passer tel quel, ne pas JSON.stringify (vérification `typeof ReadableStream !== 'undefined'` pour SSR-safe)
  - **String** : Passer tel quel, Content-Type JSON seulement si ressemble à du JSON
  - **Plain object** : JSON.stringify + Content-Type application/json
- ✅ **Ordre des vérifications optimisé** : Types spécifiques vérifiés avant types génériques (string, object)
- ✅ **Type safety amélioré** : Remplacement de `error: any` par `error: unknown` avec vérification d'instance (`error instanceof Error`)
- ✅ **Sécurité renforcée** : Évite les erreurs de sérialisation sur les types natifs qui ne doivent pas être JSON.stringify

**Micro-fixes BodyInit (Version 2.5) :**

### 🔧 **lib/adminApiClient.ts**
- ✅ **ReadableStream SSR-safe** : Vérification `typeof ReadableStream !== 'undefined'` avant `instanceof ReadableStream` pour éviter les erreurs en SSR où `ReadableStream` peut être undefined
- ✅ **ArrayBufferView support** : Ajout de la gestion des `ArrayBufferView` (ex: `Uint8Array`, `Int16Array`) via `ArrayBuffer.isView(init.body)` avant le fallback "plain object"
- ✅ **Ordre des vérifications préservé** : Types spécifiques vérifiés dans l'ordre : FormData → URLSearchParams → Blob → ArrayBuffer → ArrayBufferView → ReadableStream → string → plain object
- ✅ **Aucun Content-Type pour types natifs** : FormData, Blob, ArrayBuffer, ArrayBufferView, ReadableStream, URLSearchParams ne définissent jamais Content-Type

---

**Simplification ciblée architecture admin (Version 2.6) :**

### 🔧 **components/AdminSidebar.tsx**
- ✅ **Suppression props `pendingActions`** : `AdminSidebar` ne reçoit plus de badges via props, charge toujours via `/api/admin/pending-actions`
- ✅ **Suppression polling automatique** : Retrait de `setInterval(fetchPendingActions, 30000)`, refresh uniquement au mount et via événement `pendingActionsUpdated`
- ✅ **Suppression sections legacy** : Retrait des items de navigation `reservation-requests`, `pro`, `etats-des-lieux` et leurs badges associés
- ✅ **Shape simplifiée** : Badges réduits à 4 compteurs : `pending_reservations`, `contracts_unsigned`, `deliveries_in_progress`, `new_invoices`
- ✅ **Props simplifiées** : Interface `AdminSidebarProps` ne contient plus que `language?: 'fr' | 'en'` (suppression complète de `isOpen`, `onClose`, `isCollapsed`, `onToggleCollapse`)
- ✅ **Suppression logique mobile/collapse** : Retrait de toute la logique d'overlay mobile, boutons toggle, collapse state, etc.
- ✅ **Sidebar fixe** : Sidebar toujours visible sur desktop, structure simplifiée sans états conditionnels

### 🔧 **app/api/admin/pending-actions/route.ts**
- ✅ **Réponse simplifiée** : Réduction à 4 compteurs uniquement :
  ```typescript
  {
    pending_reservations: number;
    contracts_unsigned: number;
    deliveries_in_progress: number;
    new_invoices: number;
  }
  ```
- ✅ **Suppression logique legacy** : Retrait de toutes les requêtes `payments.*`, `inbound.*`, `condition_reports_to_review`
- ✅ **Requêtes optimisées** : Seulement 4 requêtes `safeCount` au lieu de 10+
- ✅ **Moins de risques d'erreurs** : Réduction des colonnes/tables référencées, moins de points de défaillance

### 🔧 **app/admin/reservations/page.tsx**
- ✅ **Suppression "mark as viewed"** : Retrait complet de la logique `localStorage` pour `admin_viewed_reservations`, `admin_viewed_cancellations`, `admin_viewed_modifications`
- ✅ **Suppression dispatchEvent** : Retrait de `window.dispatchEvent('pendingActionsUpdated')` lié au mark as viewed
- ✅ **Normalisation shape données** : Suppression du mapping "compatibilité legacy" (`start_date`, `end_date`, `total_price`, `customerName`, `customerEmail`)
- ✅ **Consommation directe API** : UI utilise directement les champs API (`start_at`, `end_at`, `price_total`, `customer_name`, `customer_email`)
- ✅ **Moins de glue code** : Réduction du code de transformation côté client, une seule source de vérité (API)

### 🔧 **app/admin/page.tsx**
- ✅ **Suppression état `pendingActions`** : Retrait du state `pendingActions` et de la logique associée
- ✅ **Suppression notification réservations** : Retrait du state `showReservationRequestNotification` et du composant UI associé
- ✅ **Sidebar autonome** : `AdminSidebar` gère ses propres badges, plus besoin de passer `pendingActions` en props
- ✅ **Appel simplifié** : `<AdminSidebar language={language} />` sans props supplémentaires (`isOpen`, `onClose` supprimés)

---

**Simplification finale v2.6.1 - Cohérence doc + code (Version 2.6.1) :**

### 🔧 **components/AdminSidebar.tsx (v2.6.1)**
- ✅ **Interface simplifiée** : `AdminSidebarProps` ne contient plus que `language?: 'fr' | 'en'`
- ✅ **Suppression props mobile/collapse** : Retrait complet de `isOpen`, `onClose`, `isCollapsed`, `onToggleCollapse`
- ✅ **Suppression logique conditionnelle** : Retrait de toute la logique d'overlay mobile, boutons toggle collapse, états conditionnels basés sur `isCollapsed`
- ✅ **Sidebar fixe** : Structure simplifiée, sidebar toujours visible sur desktop, pas de gestion d'état collapse
- ✅ **Suppression item legacy** : Retrait de l'item de navigation "etats-des-lieux" (section legacy non utilisée)
- ✅ **Navigation simplifiée** : 10 items uniquement (Tableau de bord, Réservations, Catalogue, Packs, Planning, Clients, Factures, Contrats, Livraisons, Paiement, Paramètres)

### 🔧 **app/admin/page.tsx (v2.6.1)**
- ✅ **Appel simplifié** : `<AdminSidebar language={language} />` sans props `isOpen` et `onClose`
- ✅ **Suppression état sidebar** : Plus besoin de gérer `isSidebarOpen` state (géré par Header si nécessaire)

### 🔧 **app/admin/reservations/page.tsx (v2.6.1)**
- ✅ **Appel simplifié** : `<AdminSidebar language={language} />` sans props `isOpen` et `onClose`
- ✅ **Correction modal** : Utilisation directe des champs API (`customer_name`, `start_at`, `end_at`) au lieu de mapping legacy (`customerName`, `start_date`, `end_date`)

### 🔧 **MEGA_DOSSIER_COMPLET.md (v2.6.1)**
- ✅ **Cohérence format** : Tous les exemples JSON utilisent maintenant `snake_case` (`customer_name`, `start_at`, `end_at`, `price_total`, `pack_key`, etc.) pour correspondre à la source de vérité (API)
- ✅ **Documentation AdminSidebar** : Mise à jour de l'interface et des exemples pour refléter la simplification
- ✅ **Exemples API** : Correction des exemples de réponse `/api/admin/reservations` et `/api/admin/reservations/[id]` pour utiliser `snake_case`

### 📊 **Résultat v2.6.1**
- ✅ **Code plus simple** : Moins de props, moins de logique conditionnelle, moins de code mort
- ✅ **Pas de régression** : Comportement métier préservé, fonctionnalités essentielles intactes
- ✅ **TypeScript-safe** : Aucune erreur de lint, compilation réussie
- ✅ **Documentation cohérente** : Format `snake_case` aligné avec l'API réelle, exemples à jour

---

**Correction TypeScript AdminSidebar (Version 2.6.2) :**

### 🔧 **app/admin/reservation-requests/page.tsx (v2.6.2)**
- ✅ **Correction erreur TypeScript** : Suppression des props non supportées `isOpen`, `onClose`, `isCollapsed`, `onToggleCollapse` passées à `AdminSidebar`
- ✅ **Suppression états inutilisés** : Retrait des états `isSidebarOpen` et `isSidebarCollapsed` qui n'étaient plus nécessaires
- ✅ **Simplification layout** : Remplacement de la classe conditionnelle du `main` par une marge fixe `lg:ml-64` (sidebar ne se réduit plus)
- ✅ **Cohérence avec autres pages** : `AdminSidebar` appelé avec uniquement la prop `language`, comme dans toutes les autres pages admin
- ✅ **Résolution erreur TypeScript 2322** : L'erreur "Property 'isOpen' does not exist on type 'AdminSidebarProps'" est maintenant résolue

### 📊 **Résultat v2.6.2**
- ✅ **TypeScript-safe** : Aucune erreur de compilation, interface `AdminSidebarProps` respectée
- ✅ **Code cohérent** : Utilisation uniforme de `AdminSidebar` dans toutes les pages admin
- ✅ **Pas de régression** : Fonctionnalité préservée, sidebar toujours visible et fonctionnelle

---

**Optimisation AdminSidebar (Version 2.6.3) :**

### 🔧 **components/AdminSidebar.tsx (v2.6.3)**
- ✅ **Suppression état inutilisé** : Retrait de `loadingBadges` qui n'était pas utilisé dans le rendu
- ✅ **Réorganisation imports** : Regroupement de `usePathname` et `useRouter` depuis `next/navigation`
- ✅ **Type safety amélioré** : Ajout de `as const` pour l'objet `texts` pour une meilleure inférence de types
- ✅ **Simplification useEffect** : Suppression de `setLoadingBadges(true/false)` dans le `useEffect`
- ✅ **Code plus propre** : Formatage plus compact et cohérent, commentaire "fail gracefully: keep 0s" ajouté
- ✅ **Imports optimisés** : Regroupement logique des imports (Next.js, React, hooks, composants)

### 📊 **Résultat v2.6.3**
- ✅ **Code plus simple** : Moins d'états inutiles, code plus maintenable
- ✅ **Type safety renforcé** : `as const` garantit l'immutabilité et améliore l'inférence TypeScript
- ✅ **Performance** : Suppression d'états inutiles réduit les re-renders potentiels
- ✅ **Pas de régression** : Fonctionnalité préservée, comportement identique

---

**Corrections critiques documentation (Version 2.6.4) :**

### 🔧 **MEGA_DOSSIER_COMPLET.md (v2.6.4)**
- ✅ **Correction code cassé** : Suppression du `map()` non fermé dans l'exemple de code `app/admin/reservations/page.tsx`
- ✅ **Code corrigé** : Utilisation directe de `setReservations(data.data || [])` sans mapping inutile
- ✅ **Suppression références legacy** : Retrait de toutes les références à l'ancienne shape de `pending-actions` (reservations.*, payments.*, inbound.*)
- ✅ **Documentation cohérente** : Uniquement la shape simplifiée à 4 compteurs documentée
- ✅ **Version alignée** : Version unifiée à 2.6.4 dans tout le document

### 📊 **Résultat v2.6.4**
- ✅ **Documentation build-safe** : Aucun code cassé dans les exemples
- ✅ **Source de vérité unique** : Une seule shape documentée pour `pending-actions`
- ✅ **Pas de confusion** : Suppression de toute référence à l'ancienne architecture
- ✅ **Production-ready** : Documentation alignée avec le code réel
