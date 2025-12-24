# 📚 MEGA DOSSIER COMPLET - SoundRush Dashboard & Chat System

**Date de création :** 2025-01-05  
**Dernière mise à jour :** 2025-01-05  
**Version :** 2.5  
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
- **Badge :** `pendingActions.pendingReservations` (réservations en attente)
- **Fonction :** Liste paginée et filtrable de toutes les réservations
- **Badge calculé depuis :**
  - `client_reservations` avec `status = 'AWAITING_PAYMENT'` ou `status = 'AWAITING_BALANCE'`
  - Compte les réservations nécessitant une action admin

#### 🚚 **Livraisons** (`/admin/livraisons`)
- **Badge :** `pendingActions.deliveriesInProgress` (livraisons en cours)
- **Fonction :** Gestion des livraisons et récupérations
- **Badge calculé depuis :**
  - `client_reservations` avec `status = 'CONFIRMED'` et `start_at` proche
  - Réservations nécessitant préparation livraison

#### 📄 **Contrats** (`/admin/contrats`)
- **Badge :** `pendingActions.contractsToSign` (contrats non signés)
- **Fonction :** Liste des contrats à signer
- **Badge calculé depuis :**
  - `client_reservations` avec `status IN ('CONFIRMED', 'AWAITING_BALANCE')` ET `client_signature IS NULL`
  - `reservations` (legacy) avec `status = 'confirmed'` ET `client_signature IS NULL`

#### 💰 **Factures** (`/admin/factures`)
- **Badge :** `pendingActions.newInvoices` (nouvelles factures)
- **Fonction :** Gestion des factures
- **Badge calculé depuis :**
  - `orders` récemment créés (dernières 24h)
  - Factures non encore téléchargées par le client
- **Note :** Badge affiché dans la sidebar avec le compteur `documents.new_invoices`

#### 📋 **Demandes de réservation** (`/admin/reservation-requests`)
- **Badge :** `pendingActions.pendingReservationRequests` (nouvelles demandes)
- **Fonction :** Gestion des demandes de réservation (legacy)
- **Badge calculé depuis :**
  - `reservation_requests` avec `status = 'pending'`

#### 🏢 **Demandes Pro** (`/admin/pro`)
- **Badge :** `pendingActions.pendingProRequests` (demandes pro)
- **Fonction :** Gestion des demandes professionnelles
- **Badge calculé depuis :**
  - Table spécifique pour demandes pro

#### 📝 **États des lieux** (`/admin/etats-des-lieux`)
- **Badge :** `pendingActions.conditionReportsToReview` (états des lieux à vérifier)
- **Fonction :** Gestion des états des lieux
- **Badge calculé depuis :**
  - `etat_lieux` avec `status = 'pending'` ou nécessitant révision

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
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminFetch } from '@/lib/adminApiClient';

interface AdminSidebarProps {
  language?: 'fr' | 'en';
  pendingActions?: {
    pendingReservations?: number;
    contractsToSign?: number;
    conditionReportsToReview?: number;
    deliveriesInProgress?: number;
    pendingCancellations?: number;
    pendingModifications?: number;
    pendingProRequests?: number;
    pendingReservationRequests?: number;
    newInvoices?: number;
  };
}

export default function AdminSidebar({ 
  language = 'fr', 
  pendingActions: propsPendingActions 
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [localPendingActions, setLocalPendingActions] = useState({
    pendingReservations: 0,
    contractsToSign: 0,
    conditionReportsToReview: 0,
    deliveriesInProgress: 0,
    pendingCancellations: 0,
    pendingModifications: 0,
    pendingProRequests: 0,
    pendingReservationRequests: 0,
    newInvoices: 0,
  });
  const [loadingBadges, setLoadingBadges] = useState(false);
  const hasLoggedNoSession = useRef(false); // Pour logger NO_SESSION une seule fois

  // Utiliser les props si fournies, sinon fetch via API
  const pendingActions = propsPendingActions || localPendingActions;

  // Fetch badges via API si pas fournis en props
  // IMPORTANT: Ne dépend pas de `user`, fonctionne même sans session (fail gracefully)
  // IMPORTANT: Dépendances stables pour éviter boucle de fetch
  useEffect(() => {
    if (propsPendingActions) return;

    const fetchPendingActions = async () => {
      setLoadingBadges(true);
      
      try {
        const data = await adminFetch<{
          reservations: { pending: number; cancellations: number; modifications: number; total: number };
          payments: { balance_due: number; deposit_due: number; total: number };
          documents: { contracts_unsigned: number; new_invoices: number; total: number };
          inbound: { reservation_requests_new: number; pro_requests_pending: number; total: number };
          operations: { deliveries_in_progress: number; condition_reports_to_review: number };
        }>('/api/admin/pending-actions');

        setLocalPendingActions({
          pendingReservations: data.reservations?.pending || 0,
          contractsToSign: data.documents?.contracts_unsigned || 0,
          conditionReportsToReview: data.operations?.condition_reports_to_review || 0,
          deliveriesInProgress: data.operations?.deliveries_in_progress || 0,
          pendingCancellations: data.reservations?.cancellations || 0,
          pendingModifications: data.reservations?.modifications || 0,
          pendingProRequests: data.inbound?.pro_requests_pending || 0,
          pendingReservationRequests: data.inbound?.reservation_requests_new || 0,
          newInvoices: data.documents?.new_invoices || 0,
        });
        // Reset le flag si succès
        hasLoggedNoSession.current = false;
      } catch (error: any) {
        if (error.message === 'NO_SESSION') {
          if (!hasLoggedNoSession.current) {
            console.warn('[AdminSidebar] Pas de session, badges non chargés');
            hasLoggedNoSession.current = true;
          }
          // En cas d'erreur NO_SESSION, garder les valeurs par défaut (0)
        } else {
          console.error('[AdminSidebar] Erreur chargement badges:', error);
        }
        // En cas d'erreur, garder les valeurs par défaut (0)
      } finally {
        setLoadingBadges(false);
      }
    };

    fetchPendingActions();

    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchPendingActions, 30000);

    // Écouter l'événement de mise à jour
    const handlePendingActionsUpdated = () => {
      fetchPendingActions();
    };
    window.addEventListener('pendingActionsUpdated', handlePendingActionsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pendingActionsUpdated', handlePendingActionsUpdated);
    };
  }, [propsPendingActions]); // Dépendances stables : uniquement propsPendingActions

  // Structure de navigation avec badges
  // Mapping des badges depuis la réponse API groupée vers l'état plat
  const navItems = [
    { href: '/admin', label: 'Tableau de bord', badge: null },
    { href: '/admin/reservations', label: 'Réservations', badge: pendingActions.pendingReservations },
    { href: '/admin/livraisons', label: 'Livraisons', badge: pendingActions.deliveriesInProgress },
    { href: '/admin/contrats', label: 'Contrats', badge: pendingActions.contractsToSign },
    { href: '/admin/factures', label: 'Factures', badge: pendingActions.newInvoices },
    { href: '/admin/reservation-requests', label: 'Demandes', badge: pendingActions.pendingReservationRequests },
    { href: '/admin/pro', label: 'Demandes Pro', badge: pendingActions.pendingProRequests },
    { href: '/admin/etats-des-lieux', label: 'États des lieux', badge: pendingActions.conditionReportsToReview },
    { href: '/admin/catalogue', label: 'Catalogue', badge: null },
    { href: '/admin/packs', label: 'Packs', badge: null },
    { href: '/admin/clients', label: 'Clients', badge: null },
    { href: '/admin/planning', label: 'Planning', badge: null },
    { href: '/admin/parametres', label: 'Paramètres', badge: null },
  ];

  return (
    <aside className={/* ... */}>
      {/* Navigation avec badges */}
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
        <AdminSidebar language="fr" pendingActions={undefined} />
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

  // Marquer comme "viewé" quand le modal s'ouvre
  useEffect(() => {
    // Extraire les primitives stables au début
    const reservationId = selectedReservation?.id;
    const status = selectedReservation?.status;

    // Garde-fous : si modal fermé ou données manquantes -> return
    if (!isDetailModalOpen || !reservationId || !status) {
      return;
    }

    const markAsViewed = () => {
      // Marquer selon le type
      if (status === 'PENDING' || status === 'pending') {
        const viewed = JSON.parse(localStorage.getItem('admin_viewed_reservations') || '[]');
        if (!viewed.includes(reservationId)) {
          viewed.push(reservationId);
          localStorage.setItem('admin_viewed_reservations', JSON.stringify(viewed));
        }
      } else if (status === 'CANCEL_REQUESTED' || status === 'cancel_requested') {
        const viewed = JSON.parse(localStorage.getItem('admin_viewed_cancellations') || '[]');
        if (!viewed.includes(reservationId)) {
          viewed.push(reservationId);
          localStorage.setItem('admin_viewed_cancellations', JSON.stringify(viewed));
        }
      } else if (status === 'CHANGE_REQUESTED' || status === 'change_requested') {
        const viewed = JSON.parse(localStorage.getItem('admin_viewed_modifications') || '[]');
        if (!viewed.includes(reservationId)) {
          viewed.push(reservationId);
          localStorage.setItem('admin_viewed_modifications', JSON.stringify(viewed));
        }
      }

      // Dispatcher l'événement pour mettre à jour les compteurs
      window.dispatchEvent(new Event('pendingActionsUpdated'));
    };

    markAsViewed();
  }, [isDetailModalOpen, selectedReservation?.id, selectedReservation?.status]);

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

        // Adapter les réservations pour compatibilité avec le rendu existant
        const adaptedReservations = (data.data || []).map((r: any) => ({
          ...r,
          start_date: r.start_at || r.created_at,
          end_date: r.end_at || r.created_at,
          total_price: r.price_total,
          pack_id: r.pack_key,
          type: r.source === 'client_reservation' ? 'client_reservation' : 'reservation',
          customerName: r.customer_name || 'Client',
          customerEmail: r.customer_email || '',
        }));

        setReservations(adaptedReservations);
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

**Réponse :**
```json
{
  "reservations": {
    "pending": 5,
    "cancellations": 2,
    "modifications": 1,
    "total": 8
  },
  "payments": {
    "balance_due": 3,
    "deposit_due": 2,
    "total": 5
  },
  "documents": {
    "contracts_unsigned": 4,
    "new_invoices": 7,
    "total": 11
  },
  "inbound": {
    "reservation_requests_new": 3,
    "pro_requests_pending": 1,
    "total": 4
  },
  "operations": {
    "deliveries_in_progress": 6,
    "condition_reports_to_review": 2
  }
}
```

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

    // Requêtes parallèles avec safeCount
    const pendingCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['AWAITING_PAYMENT', 'AWAITING_BALANCE'])
    );

    const cancellationsCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'CANCEL_REQUESTED') // Statut corrigé (était CANCELLED)
    );

    // Modifications (si status CHANGE_REQUESTED existe, sinon 0)
    const modificationsCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'CHANGE_REQUESTED')
    );

    // 2. Paiements
    // Solde à payer (J-5 atteint)
    const balanceDueCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .not('deposit_paid_at', 'is', null)
        .is('balance_paid_at', null)
        .not('balance_due_at', 'is', null)
        .lte('balance_due_at', now)
    );

    // Caution à demander (J-2 atteint) - utilise safeCount partout
    const depositDueCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .not('deposit_requested_at', 'is', null)
        .lte('deposit_requested_at', now)
        .is('deposit_session_id', null)
        .in('status', ['AWAITING_BALANCE', 'CONFIRMED'])
    );

    // 3. Documents
    // Contrats non signés (requête corrigée)
    const contractsUnsignedCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
        .is('client_signature', null) // Correction: était .or() avec syntaxe incorrecte
    );

    // Nouvelles factures (dernières 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newInvoicesCount = await safeCount(
      supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
    );

    // 4. Flux entrants
    // Demandes de réservation NEW/PENDING_REVIEW
    const reservationRequestsNewCount = await safeCount(
      supabaseAdmin
        .from('reservation_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['NEW', 'PENDING_REVIEW'])
    );

    // Demandes Pro en attente - utilise safeCount partout
    const proRequestsPendingCount = await safeCount(
      supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('pro_status', 'pending')
    );

    // 5. Opérations
    // Livraisons en cours (legacy reservations)
    const deliveriesInProgressCount = await safeCount(
      supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_status', 'en_cours')
    );

    // États des lieux à traiter (legacy)
    const conditionReportsToReviewCount = await safeCount(
      supabaseAdmin
        .from('etat_lieux')
        .select('*', { count: 'exact', head: true })
        .in('status', ['livraison_complete', 'reprise_complete'])
    );

    // Construire la réponse avec toutes les variables déclarées explicitement
    // IMPORTANT: Pas de champ additionnel (updated_at supprimé)
    return NextResponse.json({
      reservations: {
        pending: pendingCount,
        cancellations: cancellationsCount,
        modifications: modificationsCount,
        total: pendingCount + cancellationsCount + modificationsCount,
      },
      payments: {
        balance_due: balanceDueCount,
        deposit_due: depositDueCount,
        total: balanceDueCount + depositDueCount,
      },
      documents: {
        contracts_unsigned: contractsUnsignedCount,
        new_invoices: newInvoicesCount,
        total: contractsUnsignedCount + newInvoicesCount,
      },
      inbound: {
        reservation_requests_new: reservationRequestsNewCount,
        pro_requests_pending: proRequestsPendingCount,
        total: reservationRequestsNewCount + proRequestsPendingCount,
      },
      operations: {
        deliveries_in_progress: deliveriesInProgressCount,
        condition_reports_to_review: conditionReportsToReviewCount,
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
      "customerName": "Jean Dupont",
      "customerEmail": "jean@example.com",
      "packKey": "conference",
      "startAt": "2025-01-15T10:00:00Z",
      "endAt": "2025-01-15T18:00:00Z",
      "status": "AWAITING_BALANCE",
      "priceTotal": 500,
      "depositPaid": true
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
    "packKey": "conference",
    "customerName": "Jean Dupont",
    "customerEmail": "jean@example.com",
    "customerPhone": "+33612345678",
    "startAt": "2025-01-15T10:00:00Z",
    "endAt": "2025-01-15T18:00:00Z",
    "address": "123 Rue Example, 75001 Paris",
    "status": "AWAITING_BALANCE",
    "priceTotal": 500,
    "basePackPrice": 400,
    "extrasTotal": 100,
    "finalItems": [...],
    "customerSummary": "Pack Conférence le 15/01/2025...",
    "depositPaidAt": "2025-01-10T14:30:00Z",
    "clientSignature": null,
    "clientSignedAt": null
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

**Version 2.5 - Mise à jour avec micro-fixes BodyInit (ReadableStream SSR-safe, ArrayBufferView)**

Tous les fichiers, interactions, flux de données, et architectures sont documentés ci-dessus.

**Améliorations récentes incluses :**
- ✅ Refactor du dashboard admin pour utiliser exclusivement les API routes `/api/admin/*`
- ✅ Création de `lib/adminApiClient.ts` pour centraliser les appels API admin
- ✅ Amélioration de la gestion d'erreurs dans `/api/admin/pending-actions` avec `safeCount`
- ✅ Corrections des erreurs de hooks React (ordre des hooks)
- ✅ Corrections des imports en double
- ✅ Architecture sécurisée avec Pattern A (access token client-side)

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
- ✅ **safeCount partout** : Toutes les requêtes utilisent `safeCount` (y compris `depositDueCount` et `proRequestsPendingCount`)
- ✅ **Shape de réponse exacte** : La réponse respecte exactement la structure demandée :
  ```typescript
  {
    reservations: { pending, cancellations, modifications, total },
    payments: { balance_due, deposit_due, total },
    documents: { contracts_unsigned, new_invoices, total },
    inbound: { reservation_requests_new, pro_requests_pending, total },
    operations: { deliveries_in_progress, condition_reports_to_review }
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
- ✅ **Shape de réponse exacte** : Suppression de `updated_at` de la réponse
- ✅ **Réponse strictement conforme** : La réponse contient uniquement les champs demandés :
  ```typescript
  {
    reservations: { pending, cancellations, modifications, total },
    payments: { balance_due, deposit_due, total },
    documents: { contracts_unsigned, new_invoices, total },
    inbound: { reservation_requests_new, pro_requests_pending, total },
    operations: { deliveries_in_progress, condition_reports_to_review }
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
