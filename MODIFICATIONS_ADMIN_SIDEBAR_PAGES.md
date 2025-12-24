# 🔧 Modifications Concrètes : AdminSidebar & Pages Admin

## 📝 A) MODIFICATIONS AdminSidebar.tsx

### Remplacement du useEffect de calcul pending actions

**Fichier** : `components/AdminSidebar.tsx`

**À remplacer** : Lignes 119-284 (tout le `useEffect` avec requêtes Supabase)

**Par** :

```typescript
// Types pour pending actions
interface PendingActions {
  reservations: {
    pending: number;
    cancellations: number;
    modifications: number;
    total: number;
  };
  payments: {
    balance_due: number;
    deposit_due: number;
    total: number;
  };
  documents: {
    contracts_unsigned: number;
    new_invoices: number;
    total: number;
  };
  inbound: {
    reservation_requests_new: number;
    pro_requests_pending: number;
    total: number;
  };
  operations: {
    deliveries_in_progress: number;
    condition_reports_to_review: number;
  };
  updated_at: string;
}

// Dans le composant AdminSidebar
const [pendingActionsApi, setPendingActionsApi] = useState<PendingActions | null>(null);

// Calculer les compteurs si pas fournis en props
useEffect(() => {
  // Si props fournies, ne pas calculer localement
  if (propsPendingActions || !user || !supabase) return;

  const fetchPendingActions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/pending-actions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingActionsApi(data);
      }
    } catch (error) {
      console.error('Erreur fetch pending-actions:', error);
    }
  };

  fetchPendingActions();
  
  // Refresh toutes les 30 secondes
  const interval = setInterval(fetchPendingActions, 30000);

  return () => clearInterval(interval);
}, [user, supabase, propsPendingActions]);

// Utiliser API data si disponible, sinon props, sinon local (fallback)
const pendingActions = propsPendingActions || pendingActionsApi || localPendingActions;
```

### Mapping badges dans le JSX

**À remplacer** : Tous les badges hardcodés dans les liens

**Par** :

```typescript
// Calculer badges depuis pendingActions
const reservationsBadge = pendingActions?.reservations?.total || 0;
const paymentsBadge = pendingActions?.payments?.total || 0;
const documentsBadge = pendingActions?.documents?.total || 0;
const demandesBadge = pendingActions?.inbound?.reservation_requests_new || 0;
const proBadge = pendingActions?.inbound?.pro_requests_pending || 0;
const livraisonsBadge = pendingActions?.operations?.deliveries_in_progress || 0;
const etatsDesLieuxBadge = pendingActions?.operations?.condition_reports_to_review || 0;
```

### Mise à jour des liens avec nouveaux badges

**Lien Réservations** (ligne ~388) :

```typescript
{reservationsBadge > 0 && (
  <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
    {reservationsBadge}
  </span>
)}
```

**Lien Paiements** (nouveau, après Réservations) :

```typescript
<Link
  href="/admin/paiement"
  onClick={onClose}
  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
    isActive('/admin/paiement')
      ? 'bg-[#F2431E] text-white'
      : 'text-gray-700 hover:bg-gray-100'
  }`}
  title={isCollapsed ? 'Paiements' : undefined}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
  {!isCollapsed && (
    <span className="flex-1">Paiements</span>
  )}
  {paymentsBadge > 0 && (
    <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
      {paymentsBadge}
    </span>
  )}
  {isCollapsed && (
    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
      Paiements
    </div>
  )}
</Link>
```

**Lien Documents** (nouveau, après Paiements) :

```typescript
<Link
  href="/admin/documents"
  onClick={onClose}
  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 mb-2 rounded-xl font-semibold transition-colors group relative ${
    isActive('/admin/documents')
      ? 'bg-[#F2431E] text-white'
      : 'text-gray-700 hover:bg-gray-100'
  }`}
  title={isCollapsed ? 'Documents' : undefined}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  {!isCollapsed && (
    <span className="flex-1">Documents</span>
  )}
  {documentsBadge > 0 && (
    <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
      {documentsBadge}
    </span>
  )}
  {isCollapsed && (
    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
      Documents
    </div>
  )}
</Link>
```

**Lien Demandes** (ligne ~415) :

```typescript
{demandesBadge > 0 && (
  <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
    {demandesBadge}
  </span>
)}
```

**Lien Pro** (ligne ~502) :

```typescript
{proBadge > 0 && (
  <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
    {proBadge}
  </span>
)}
```

**Lien Livraisons** (ligne ~571) :

```typescript
{livraisonsBadge > 0 && (
  <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
    {livraisonsBadge}
  </span>
)}
```

**Lien États des lieux** (ligne ~598) :

```typescript
{etatsDesLieuxBadge > 0 && (
  <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : ''} bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
    {etatsDesLieuxBadge}
  </span>
)}
```

---

## 📝 B) MODIFICATIONS app/admin/page.tsx

### Remplacement du loadAdminData

**Fichier** : `app/admin/page.tsx`

**À remplacer** : Lignes 93-485 (tout le `loadAdminData` avec requêtes Supabase)

**Par** :

```typescript
// Types pour dashboard data
interface DashboardData {
  stats: {
    upcoming_30d: number;
    revenue_month: number;
    equipment_out: number;
    total_equipment: number;
    late_returns: number;
  };
  automation: {
    balance_due: Array<{
      id: string;
      pack_key: string;
      customer_email: string;
      balance_amount: number;
      balance_due_at: string;
      price_total: number;
    }>;
    deposit_due: Array<{
      id: string;
      pack_key: string;
      customer_email: string;
      deposit_amount: number;
      deposit_requested_at: string;
    }>;
    week_events: Array<{
      id: string;
      pack_key: string;
      customer_email: string;
      start_at: string;
      end_at: string;
      address: string;
      status: string;
    }>;
  };
  upcoming: Array<{
    id: string;
    pack_key: string;
    customer_email: string;
    customer_name: string | null;
    start_at: string;
    end_at: string;
    address: string;
    price_total: number;
    status: string;
    order: {
      id: string;
      total: number;
      status: string;
    } | null;
  }>;
  equipment_status: Array<{
    id: string;
    pack_key: string;
    customer_email: string;
    customer_name: string | null;
    start_at: string;
    end_at: string;
    status: string;
    order: {
      id: string;
      customer_name: string;
      customer_phone: string;
    } | null;
  }>;
  recent_clients: Array<{
    email: string;
    name: string;
    reservations: number;
    totalSpent: number;
    lastOrder: string;
  }>;
  calendar: Array<{
    day: string;
    count: number;
  }>;
  updated_at: string;
}

const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

useEffect(() => {
  if (!user || !supabase || checkingAdmin || !isAdmin) return;

  const fetchDashboard = async () => {
    setIsLoadingDashboard(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoadingDashboard(false);
        return;
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        
        // Mettre à jour stats
        setStats({
          upcomingReservations: data.stats.upcoming_30d,
          revenueThisMonth: data.stats.revenue_month,
          equipmentOut: data.stats.equipment_out,
          totalEquipment: data.stats.total_equipment,
          lateReturns: data.stats.late_returns,
        });

        // Mettre à jour données
        setUpcomingReservations(data.upcoming || []);
        setEquipmentStatus(data.equipment_status || []);
        setRecentClients(data.recent_clients || []);
        setCalendarData(data.calendar || []);
        setBalanceDueReservations(data.automation.balance_due || []);
        setDepositDueReservations(data.automation.deposit_due || []);
        setWeekEvents(data.automation.week_events || []);
      } else {
        console.error('Erreur fetch dashboard:', response.statusText);
      }
    } catch (error) {
      console.error('Erreur fetch dashboard:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  fetchDashboard();
}, [user, supabase, checkingAdmin, isAdmin]);
```

### Mise à jour du loading state

**À remplacer** : `if (loading || checkingAdmin)` 

**Par** :

```typescript
if (loading || checkingAdmin || isLoadingDashboard) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
      </div>
    </div>
  );
}
```

---

## 📝 C) MODIFICATIONS app/admin/reservations/page.tsx

### Remplacement du loadReservations

**Fichier** : `app/admin/reservations/page.tsx`

**À remplacer** : Lignes 151-220 (requêtes Supabase directes)

**Par** :

```typescript
// Types
interface ReservationAdminRow {
  id: string;
  source: 'client_reservation' | 'reservation';
  pack_key: string | null;
  pack_label: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  start_at: string | null;
  end_at: string | null;
  address: string | null;
  price_total: number;
  status: string;
  deposit_paid: boolean;
  balance_paid: boolean;
  contract_signed: boolean;
  created_at: string;
  updated_at: string;
}

const [reservations, setReservations] = useState<ReservationAdminRow[]>([]);
const [total, setTotal] = useState(0);
const [page, setPage] = useState(1);
const [isLoadingReservations, setIsLoadingReservations] = useState(true);

useEffect(() => {
  if (!user || !supabase) return;

  const fetchReservations = async () => {
    setIsLoadingReservations(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoadingReservations(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
        ...(statusFilter && { status: statusFilter }),
        ...(searchQuery && { query: searchQuery }),
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo }),
      });

      const response = await fetch(`/api/admin/reservations?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReservations(data.data);
        setTotal(data.total);
      } else {
        console.error('Erreur fetch reservations:', response.statusText);
      }
    } catch (error) {
      console.error('Erreur fetch reservations:', error);
    } finally {
      setIsLoadingReservations(false);
    }
  };

  fetchReservations();
}, [user, supabase, page, statusFilter, searchQuery, dateFrom, dateTo]);
```

### Modal détails réservation

**À remplacer** : Chargement documents dans modal (lignes ~100-146)

**Par** :

```typescript
const [reservationDetail, setReservationDetail] = useState<any>(null);
const [isLoadingDetail, setIsLoadingDetail] = useState(false);

const loadReservationDetail = async (reservationId: string, source: 'client_reservation' | 'reservation') => {
  setIsLoadingDetail(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const response = await fetch(`/api/admin/reservations/${reservationId}?source=${source}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setReservationDetail(data);
      setSelectedReservationDocuments({
        orders: data.orders || [],
        etatLieux: data.reservation.source === 'reservation' ? (data.etatLieux || null) : null,
      });
    }
  } catch (error) {
    console.error('Erreur fetch reservation detail:', error);
  } finally {
    setIsLoadingDetail(false);
  }
};
```

---

## 📝 D) ORDRE DE MIGRATION EXACT

### Étape 1 : Helper Auth + Endpoint Pending Actions ✅

**Fichiers créés** :
- ✅ `lib/adminAuth.ts`
- ✅ `app/api/admin/pending-actions/route.ts`

**Fichiers à modifier** :
- `components/AdminSidebar.tsx` (remplacer useEffect lignes 119-284)

**Tests** :
```bash
# Tester endpoint
curl -X GET http://localhost:3000/api/admin/pending-actions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Vérifier badges dans sidebar
```

---

### Étape 2 : Endpoint Dashboard + Page Admin

**Fichiers créés** :
- ✅ `app/api/admin/dashboard/route.ts`

**Fichiers à modifier** :
- `app/admin/page.tsx` (remplacer loadAdminData lignes 93-485)

**Tests** :
```bash
# Tester endpoint
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Vérifier stats dans dashboard
```

---

### Étape 3 : Endpoints Reservations + Page Reservations

**Fichiers créés** :
- ✅ `app/api/admin/reservations/route.ts`
- ✅ `app/api/admin/reservations/[id]/route.ts`

**Fichiers à modifier** :
- `app/admin/reservations/page.tsx` (remplacer loadReservations)

**Tests** :
```bash
# Tester liste
curl -X GET "http://localhost:3000/api/admin/reservations?page=1&pageSize=50" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tester détail
curl -X GET "http://localhost:3000/api/admin/reservations/UUID?source=client" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Étape 4 : Migration SQL Index

**Fichier créé** :
- ✅ `supabase/migrations/20250105000004_add_admin_dashboard_indexes.sql`

**À exécuter** :
```bash
# Via Supabase CLI ou Dashboard SQL Editor
supabase migration up
```

---

### Étape 5 : Page Documents (Optionnel)

**Fichier à créer** :
- `app/admin/documents/page.tsx` (voir REFACTOR_ADMIN_DASHBOARD_PLAN.md section E.3)

**Fichiers à modifier** :
- `components/AdminSidebar.tsx` (ajouter lien Documents après Paiements)

---

## ⚠️ GARDE-FOUS

1. **Ne jamais exposer service role côté client**
   - ✅ Utiliser uniquement dans API routes
   - ❌ Jamais dans composants React

2. **Auth toujours vérifiée**
   - Tous les endpoints vérifient `verifyAdmin(token)`
   - Retournent 403 si non admin

3. **Fallback si API échoue**
   - AdminSidebar garde `localPendingActions` en fallback
   - Pages affichent état vide si API échoue

4. **Cache headers**
   - `no-store, must-revalidate` pour données temps réel
   - Refresh automatique toutes les 30s dans sidebar

5. **Gestion erreurs**
   - Tous les fetch dans try/catch
   - Logs console.error pour debug
   - Pas de crash si API échoue

---

## 📋 CHECKLIST FINALE

- [ ] Créer `lib/adminAuth.ts`
- [ ] Créer `app/api/admin/pending-actions/route.ts`
- [ ] Créer `app/api/admin/dashboard/route.ts`
- [ ] Créer `app/api/admin/reservations/route.ts`
- [ ] Créer `app/api/admin/reservations/[id]/route.ts`
- [ ] Modifier `components/AdminSidebar.tsx` (fetch pending-actions)
- [ ] Modifier `app/admin/page.tsx` (fetch dashboard)
- [ ] Modifier `app/admin/reservations/page.tsx` (fetch reservations)
- [ ] Créer migration SQL index
- [ ] Tester tous les endpoints avec token admin
- [ ] Vérifier badges dans sidebar
- [ ] Vérifier stats dans dashboard
- [ ] Vérifier liste réservations
- [ ] Vérifier modal détails réservation

---

**Documentation générée le** : 2025-01-05
**Version** : 1.0
