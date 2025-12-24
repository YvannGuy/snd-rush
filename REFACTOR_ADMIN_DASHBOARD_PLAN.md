# 🔧 Plan de Refactor Admin Dashboard - Ops-First

## 📋 TABLE DES MATIÈRES

1. [Design Sidebar Final](#design-sidebar)
2. [4 Endpoints API](#endpoints-api)
3. [Fichiers à Modifier](#fichiers-modifier)
4. [Ordre de Migration](#ordre-migration)

---

## 🎯 A) DESIGN SIDEBAR ADMIN FINAL

### Structure avec Sections Regroupées (Ordre Recommandé)

**Ordre final des liens dans la sidebar** :

1. **Dashboard** (`/admin`) - Pas de badge
2. **Réservations** (`/admin/reservations`) - Badge: `reservationsBadge`
3. **Paiements** (`/admin/paiement`) - Badge: `paymentsBadge` ⭐ NOUVEAU
4. **Documents** (`/admin/documents`) - Badge: `documentsBadge` ⭐ NOUVEAU
5. **Demandes** (`/admin/reservation-requests`) - Badge: `demandesBadge`
6. **Pro** (`/admin/pro`) - Badge: `proBadge`
7. **Clients** (`/admin/clients`) - Pas de badge
8. **Planning** (`/admin/planning`) - Pas de badge
9. **Livraisons** (`/admin/livraisons`) - Badge: `livraisonsBadge`
10. **États des lieux** (`/admin/etats-des-lieux`) - Badge: `etatsDesLieuxBadge`
11. **Catalogue** (`/admin/catalogue`) - Pas de badge
12. **Packs** (`/admin/packs`) - Pas de badge
13. **Paramètres** (`/admin/parametres`) - Pas de badge

**Note** : Pas de sections visuelles séparées dans le JSX (garder liste plate), mais ordre logique "ops-first"

### Badges Calculés

```typescript
interface PendingActions {
  reservations: {
    pending: number;        // Réservations en attente
    cancellations: number;  // Annulations en attente
    modifications: number;  // Modifications en attente
    total: number;         // Somme des 3
  };
  payments: {
    balance_due: number;   // Solde à payer (J-5 atteint)
    deposit_due: number;   // Caution à demander (J-2 atteint)
    total: number;         // Somme des 2
  };
  documents: {
    contracts_unsigned: number;  // Contrats non signés
    new_invoices: number;          // Nouvelles factures (optionnel)
    total: number;
  };
  inbound: {
    reservation_requests_new: number;  // Demandes NEW/PENDING_REVIEW
    pro_requests_pending: number;       // Demandes Pro en attente
    total: number;
  };
  operations: {
    deliveries_in_progress: number;     // Livraisons en cours
    condition_reports_to_review: number; // États des lieux à traiter
  };
  updated_at: string;
}
```

### Mapping Badges → Sidebar

```typescript
const badgeMapping = {
  reservationsBadge: pendingActions.reservations.total,
  paymentsBadge: pendingActions.payments.total,
  documentsBadge: pendingActions.documents.total,
  demandesBadge: pendingActions.inbound.reservation_requests_new,
  proBadge: pendingActions.inbound.pro_requests_pending,
  livraisonsBadge: pendingActions.operations.deliveries_in_progress,
  etatsDesLieuxBadge: pendingActions.operations.condition_reports_to_review,
};
```

---

## 🔌 B) ENDPOINT 1: GET /api/admin/pending-actions

### Fichier à créer : `app/api/admin/pending-actions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper pour vérifier admin
async function verifyAdmin(token: string): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
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

    const now = new Date().toISOString();

    // 1. Réservations (client_reservations uniquement pour nouveau flow)
    // Note: pending/cancellations/modifications peuvent être dans status ou flags séparés
    // Pour l'instant, on compte les réservations avec status spécifiques
    const { count: pendingCount } = await supabaseAdmin
      .from('client_reservations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['AWAITING_PAYMENT', 'AWAITING_BALANCE']);

    // Annulations (si status CANCELLED mais pas encore traité par admin)
    // Note: À adapter selon votre logique métier
    const { count: cancellationsCount } = await supabaseAdmin
      .from('client_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CANCELLED');

    // Modifications (si flag existe ou status CHANGE_REQUESTED)
    // Note: À adapter selon votre logique métier
    const { count: modificationsCount } = await supabaseAdmin
      .from('client_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CHANGE_REQUESTED');

    // 2. Paiements
    // Solde à payer (J-5 atteint)
    const { count: balanceDueCount } = await supabaseAdmin
      .from('client_reservations')
      .select('*', { count: 'exact', head: true })
      .not('deposit_paid_at', 'is', null)
      .is('balance_paid_at', null)
      .not('balance_due_at', 'is', null)
      .lte('balance_due_at', now);

    // Caution à demander (J-2 atteint)
    const { count: depositDueCount } = await supabaseAdmin
      .from('client_reservations')
      .select('*', { count: 'exact', head: true })
      .not('deposit_requested_at', 'is', null)
      .lte('deposit_requested_at', now)
      .is('deposit_session_id', null)
      .in('status', ['AWAITING_BALANCE', 'CONFIRMED']);

    // 3. Documents
    // Contrats non signés
    const { count: contractsUnsignedCount } = await supabaseAdmin
      .from('client_reservations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
      .or('client_signature.is.null,client_signature.eq.');

    // Nouvelles factures (optionnel: orders créés dans les dernières 24h non vus)
    // Note: À implémenter si besoin avec un flag "admin_viewed" ou via localStorage côté client
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { count: newInvoicesCount } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    // 4. Flux entrants
    // Demandes de réservation NEW/PENDING_REVIEW
    const { count: reservationRequestsNewCount } = await supabaseAdmin
      .from('reservation_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['NEW', 'PENDING_REVIEW']);

    // Demandes Pro en attente (si table existe)
    // Note: À adapter selon votre structure
    let proRequestsPendingCount = 0;
    try {
      const { count } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('pro_status', 'pending');
      proRequestsPendingCount = count || 0;
    } catch (e) {
      // Table ou colonne n'existe pas, ignorer
    }

    // 5. Opérations
    // Livraisons en cours (legacy reservations)
    const { count: deliveriesInProgressCount } = await supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'en_cours');

    // États des lieux à traiter (legacy)
    const { count: conditionReportsToReviewCount } = await supabaseAdmin
      .from('etat_lieux')
      .select('*', { count: 'exact', head: true })
      .in('status', ['livraison_complete', 'reprise_complete']);

    const response = {
      reservations: {
        pending: pendingCount || 0,
        cancellations: cancellationsCount || 0,
        modifications: modificationsCount || 0,
        total: (pendingCount || 0) + (cancellationsCount || 0) + (modificationsCount || 0),
      },
      payments: {
        balance_due: balanceDueCount || 0,
        deposit_due: depositDueCount || 0,
        total: (balanceDueCount || 0) + (depositDueCount || 0),
      },
      documents: {
        contracts_unsigned: contractsUnsignedCount || 0,
        new_invoices: newInvoicesCount || 0,
        total: (contractsUnsignedCount || 0) + (newInvoicesCount || 0),
      },
      inbound: {
        reservation_requests_new: reservationRequestsNewCount || 0,
        pro_requests_pending: proRequestsPendingCount || 0,
        total: (reservationRequestsNewCount || 0) + (proRequestsPendingCount || 0),
      },
      operations: {
        deliveries_in_progress: deliveriesInProgressCount || 0,
        condition_reports_to_review: conditionReportsToReviewCount || 0,
      },
      updated_at: new Date().toISOString(),
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

### Payload JSON de Réponse

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
    "contracts_unsigned": 7,
    "new_invoices": 12,
    "total": 19
  },
  "inbound": {
    "reservation_requests_new": 4,
    "pro_requests_pending": 1,
    "total": 5
  },
  "operations": {
    "deliveries_in_progress": 2,
    "condition_reports_to_review": 3
  },
  "updated_at": "2025-01-05T10:30:00.000Z"
}
```

---

## 🔌 C) ENDPOINT 2: GET /api/admin/dashboard

### Fichier à créer : `app/api/admin/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper verifyAdmin (même que pending-actions)
async function verifyAdmin(token: string): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  // ... (copier depuis pending-actions)
}

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    const endDateStr = endDate.toISOString().split('T')[0];

    const now = new Date().toISOString();
    const weekEndDate = new Date(today);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    // OPTIMISATION: 6 requêtes parallèles au lieu de 12
    const [
      { count: upcoming30dCount },
      { data: reservationsThisMonth },
      { data: reservationsStartedThisMonth },
      { data: lateReturns },
      { data: upcomingReservations },
      { data: equipmentData },
      { data: recentOrders },
      { data: calendarReservations },
      { data: balanceDueData },
      { data: depositDueData },
      { data: weekEventsData },
    ] = await Promise.all([
      // 1. Count réservations à venir (30 jours)
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .gte('start_at', todayStr)
        .lte('start_at', endDateStr),

      // 2. CA ce mois
      supabaseAdmin
        .from('client_reservations')
        .select('id, price_total, created_at')
        .gte('created_at', startOfMonthStr),

      // 3. Matériel sorti ce mois
      supabaseAdmin
        .from('client_reservations')
        .select('id, start_at')
        .gte('start_at', startOfMonthStr)
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE']),

      // 4. Retours en retard
      supabaseAdmin
        .from('client_reservations')
        .select('id')
        .lt('end_at', todayStr)
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE']),

      // 5. Réservations à venir (top 5)
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, start_at, end_at, address, price_total, status, stripe_session_id')
        .gte('start_at', todayStr)
        .lte('start_at', endDateStr)
        .order('start_at', { ascending: true })
        .limit(5),

      // 6. État du matériel (top 5)
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, start_at, end_at, status')
        .lte('start_at', todayStr)
        .gte('end_at', todayStr)
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
        .order('end_at', { ascending: true })
        .limit(5),

      // 7. Clients récents (via orders)
      supabaseAdmin
        .from('orders')
        .select('customer_email, customer_name, total, created_at, client_reservation_id')
        .not('client_reservation_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10),

      // 8. Planning mensuel
      supabaseAdmin
        .from('client_reservations')
        .select('start_at, end_at, status')
        .gte('start_at', startOfMonth.toISOString().split('T')[0])
        .lte('start_at', new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]),

      // 9. Solde à payer (J-5)
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, price_total, balance_amount, balance_due_at')
        .not('deposit_paid_at', 'is', null)
        .is('balance_paid_at', null)
        .not('balance_due_at', 'is', null)
        .lte('balance_due_at', now)
        .order('balance_due_at', { ascending: true })
        .limit(20),

      // 10. Cautions à demander (J-2)
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, deposit_amount, deposit_requested_at')
        .not('deposit_requested_at', 'is', null)
        .lte('deposit_requested_at', now)
        .is('deposit_session_id', null)
        .in('status', ['AWAITING_BALANCE', 'CONFIRMED'])
        .order('deposit_requested_at', { ascending: true })
        .limit(20),

      // 11. Événements cette semaine
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, start_at, end_at, address, status')
        .not('start_at', 'is', null)
        .gte('start_at', today.toISOString())
        .lte('start_at', weekEndDate.toISOString())
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
        .order('start_at', { ascending: true })
        .limit(20),
    ]);

    // Enrichir réservations à venir avec orders
    const ordersMap = new Map();
    if (recentOrders) {
      recentOrders.forEach((order: any) => {
        if (order.client_reservation_id) {
          if (!ordersMap.has(order.client_reservation_id)) {
            ordersMap.set(order.client_reservation_id, []);
          }
          ordersMap.get(order.client_reservation_id).push(order);
        }
      });
    }

    const upcomingEnriched = (upcomingReservations || []).map((r: any) => {
      const orders = ordersMap.get(r.id) || [];
      const latestOrder = orders.length > 0
        ? orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

      return {
        id: r.id,
        pack_key: r.pack_key,
        customer_email: r.customer_email,
        customer_name: latestOrder?.customer_name || null,
        start_at: r.start_at,
        end_at: r.end_at,
        address: r.address,
        price_total: parseFloat(r.price_total?.toString() || '0'),
        status: r.status,
        order: latestOrder ? {
          id: latestOrder.id,
          total: parseFloat(latestOrder.total?.toString() || '0'),
          status: latestOrder.status,
        } : null,
      };
    });

    // Enrichir équipement avec orders
    const equipmentEnriched = (equipmentData || []).map((item: any) => {
      const orders = ordersMap.get(item.id) || [];
      const latestOrder = orders.length > 0
        ? orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

      return {
        id: item.id,
        pack_key: item.pack_key,
        customer_email: item.customer_email,
        customer_name: latestOrder?.customer_name || null,
        start_at: item.start_at,
        end_at: item.end_at,
        status: item.status,
        order: latestOrder ? {
          id: latestOrder.id,
          customer_name: latestOrder.customer_name,
          customer_phone: latestOrder.customer_phone,
        } : null,
      };
    });

    // Calculer CA
    const revenueThisMonth = (reservationsThisMonth || []).reduce((sum: number, r: any) => {
      return sum + (parseFloat(r.price_total?.toString() || '0') || 0);
    }, 0);

    // Grouper clients récents
    const clientsMap = new Map();
    (recentOrders || []).forEach((order: any) => {
      const email = order.customer_email;
      if (!clientsMap.has(email)) {
        clientsMap.set(email, {
          email,
          name: order.customer_name || email.split('@')[0],
          reservations: 0,
          totalSpent: 0,
          lastOrder: order.created_at,
        });
      }
      const client = clientsMap.get(email);
      client.reservations += 1;
      client.totalSpent += parseFloat(order.total?.toString() || '0') || 0;
    });

    const recentClients = Array.from(clientsMap.values()).slice(0, 3);

    // Générer calendrier (jours avec réservations)
    const calendarDays = new Map<string, number>();
    (calendarReservations || []).forEach((r: any) => {
      if (r.start_at) {
        const day = r.start_at.split('T')[0];
        calendarDays.set(day, (calendarDays.get(day) || 0) + 1);
      }
    });

    const calendar = Array.from(calendarDays.entries()).map(([day, count]) => ({
      day,
      count,
    }));

    const response = {
      stats: {
        upcoming_30d: upcoming30dCount || 0,
        revenue_month: revenueThisMonth,
        equipment_out: reservationsStartedThisMonth?.length || 0,
        total_equipment: 45, // Valeur fixe
        late_returns: lateReturns?.length || 0,
      },
      automation: {
        balance_due: (balanceDueData || []).map((r: any) => ({
          id: r.id,
          pack_key: r.pack_key,
          customer_email: r.customer_email,
          balance_amount: parseFloat(r.balance_amount?.toString() || '0'),
          balance_due_at: r.balance_due_at,
          price_total: parseFloat(r.price_total?.toString() || '0'),
        })),
        deposit_due: (depositDueData || []).map((r: any) => ({
          id: r.id,
          pack_key: r.pack_key,
          customer_email: r.customer_email,
          deposit_amount: parseFloat(r.deposit_amount?.toString() || '0'),
          deposit_requested_at: r.deposit_requested_at,
        })),
        week_events: (weekEventsData || []).map((r: any) => ({
          id: r.id,
          pack_key: r.pack_key,
          customer_email: r.customer_email,
          start_at: r.start_at,
          end_at: r.end_at,
          address: r.address,
          status: r.status,
        })),
      },
      upcoming: upcomingEnriched,
      equipment_status: equipmentEnriched,
      recent_clients: recentClients,
      calendar,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Erreur API dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
```

### Payload JSON de Réponse

```json
{
  "stats": {
    "upcoming_30d": 15,
    "revenue_month": 12500.50,
    "equipment_out": 8,
    "total_equipment": 45,
    "late_returns": 2
  },
  "automation": {
    "balance_due": [
      {
        "id": "uuid-1",
        "pack_key": "soiree",
        "customer_email": "client@example.com",
        "balance_amount": 230.30,
        "balance_due_at": "2025-01-05T00:00:00.000Z",
        "price_total": 329.00
      }
    ],
    "deposit_due": [
      {
        "id": "uuid-2",
        "pack_key": "mariage",
        "customer_email": "client2@example.com",
        "deposit_amount": 134.70,
        "deposit_requested_at": "2025-01-05T00:00:00.000Z"
      }
    ],
    "week_events": [
      {
        "id": "uuid-3",
        "pack_key": "conference",
        "customer_email": "client3@example.com",
        "start_at": "2025-01-08T14:00:00.000Z",
        "end_at": "2025-01-08T18:00:00.000Z",
        "address": "123 Rue Example, Paris",
        "status": "CONFIRMED"
      }
    ]
  },
  "upcoming": [
    {
      "id": "uuid-4",
      "pack_key": "soiree",
      "customer_email": "client4@example.com",
      "customer_name": "Jean Dupont",
      "start_at": "2025-01-10T20:00:00.000Z",
      "end_at": "2025-01-11T02:00:00.000Z",
      "address": "456 Rue Example, Paris",
      "price_total": 329.00,
      "status": "CONFIRMED",
      "order": {
        "id": "order-uuid-1",
        "total": 98.70,
        "status": "paid"
      }
    }
  ],
  "equipment_status": [
    {
      "id": "uuid-5",
      "pack_key": "mariage",
      "customer_email": "client5@example.com",
      "customer_name": "Marie Martin",
      "start_at": "2025-01-03T10:00:00.000Z",
      "end_at": "2025-01-05T18:00:00.000Z",
      "status": "CONFIRMED",
      "order": {
        "id": "order-uuid-2",
        "customer_name": "Marie Martin",
        "customer_phone": "+33612345678"
      }
    }
  ],
  "recent_clients": [
    {
      "email": "client@example.com",
      "name": "Jean Dupont",
      "reservations": 3,
      "totalSpent": 987.00,
      "lastOrder": "2025-01-04T10:00:00.000Z"
    }
  ],
  "calendar": [
    { "day": "2025-01-10", "count": 2 },
    { "day": "2025-01-15", "count": 1 }
  ],
  "updated_at": "2025-01-05T10:30:00.000Z"
}
```

---

## 🔌 D) ENDPOINT 3: GET /api/admin/reservations

### Fichier à créer : `app/api/admin/reservations/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper verifyAdmin (même que pending-actions)
async function verifyAdmin(token: string): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  // ... (copier depuis pending-actions)
}

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

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
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

    // Query params
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const offset = (page - 1) * pageSize;

    // Charger client_reservations et reservations en parallèle
    let clientReservationsQuery = supabaseAdmin
      .from('client_reservations')
      .select('*', { count: 'exact' });

    let reservationsQuery = supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact' });

    // Filtres
    if (status) {
      clientReservationsQuery = clientReservationsQuery.eq('status', status);
      reservationsQuery = reservationsQuery.eq('status', status);
    }

    if (from) {
      clientReservationsQuery = clientReservationsQuery.gte('start_at', from);
      reservationsQuery = reservationsQuery.gte('start_date', from);
    }

    if (to) {
      clientReservationsQuery = clientReservationsQuery.lte('start_at', to);
      reservationsQuery = reservationsQuery.lte('start_date', to);
    }

    // Recherche texte (email, nom, id, adresse)
    if (query) {
      const searchTerm = `%${query}%`;
      clientReservationsQuery = clientReservationsQuery.or(
        `customer_email.ilike.${searchTerm},address.ilike.${searchTerm},id.eq.${query}`
      );
      reservationsQuery = reservationsQuery.or(
        `address.ilike.${searchTerm},id.eq.${query}`
      );
    }

    // Tri
    clientReservationsQuery = clientReservationsQuery.order('created_at', { ascending: false });
    reservationsQuery = reservationsQuery.order('created_at', { ascending: false });

    // Pagination
    clientReservationsQuery = clientReservationsQuery.range(offset, offset + pageSize - 1);
    reservationsQuery = reservationsQuery.range(offset, offset + pageSize - 1);

    const [
      { data: clientReservationsData, count: clientReservationsCount },
      { data: reservationsData, count: reservationsCount },
    ] = await Promise.all([
      clientReservationsQuery,
      reservationsQuery,
    ]);

    // Charger orders pour enrichir
    const reservationIds = [
      ...(clientReservationsData || []).map((r: any) => r.id),
      ...(reservationsData || []).map((r: any) => r.id),
    ];

    const { data: ordersData } = await supabaseAdmin
      .from('orders')
      .select('*')
      .or(
        reservationIds.length > 0
          ? `client_reservation_id.in.(${reservationIds.join(',')}),reservation_id.in.(${reservationIds.join(',')})`
          : 'id.eq.00000000-0000-0000-0000-000000000000' // Force empty result
      );

    // Créer map orders
    const ordersMap = new Map<string, any[]>();
    (ordersData || []).forEach((order: any) => {
      if (order.client_reservation_id) {
        if (!ordersMap.has(order.client_reservation_id)) {
          ordersMap.set(order.client_reservation_id, []);
        }
        ordersMap.get(order.client_reservation_id)!.push(order);
      }
      if (order.reservation_id) {
        if (!ordersMap.has(order.reservation_id)) {
          ordersMap.set(order.reservation_id, []);
        }
        ordersMap.get(order.reservation_id)!.push(order);
      }
    });

    // Normaliser client_reservations
    const clientReservationsNormalized: ReservationAdminRow[] = (clientReservationsData || []).map((r: any) => {
      const orders = ordersMap.get(r.id) || [];
      const latestOrder = orders.length > 0
        ? orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

      const packLabels: Record<string, string> = {
        conference: 'Pack Conférence',
        soiree: 'Pack Soirée',
        mariage: 'Pack Mariage',
      };

      return {
        id: r.id,
        source: 'client_reservation',
        pack_key: r.pack_key,
        pack_label: packLabels[r.pack_key] || r.pack_key,
        customer_email: r.customer_email || '',
        customer_name: latestOrder?.customer_name || null,
        customer_phone: r.customer_phone || latestOrder?.customer_phone || null,
        start_at: r.start_at,
        end_at: r.end_at,
        address: r.address || null,
        price_total: parseFloat(r.price_total?.toString() || '0'),
        status: r.status,
        deposit_paid: !!r.deposit_paid_at,
        balance_paid: !!r.balance_paid_at,
        contract_signed: !!r.client_signature,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    // Normaliser reservations legacy
    const reservationsNormalized: ReservationAdminRow[] = (reservationsData || []).map((r: any) => {
      const orders = ordersMap.get(r.id) || [];
      const latestOrder = orders.length > 0
        ? orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

      return {
        id: r.id,
        source: 'reservation',
        pack_key: null,
        pack_label: `Pack ${r.pack_id || 'N/A'}`,
        customer_email: latestOrder?.customer_email || '',
        customer_name: latestOrder?.customer_name || null,
        customer_phone: latestOrder?.customer_phone || null,
        start_at: r.start_date ? `${r.start_date}T00:00:00.000Z` : null,
        end_at: r.end_date ? `${r.end_date}T00:00:00.000Z` : null,
        address: r.address || null,
        price_total: parseFloat(r.total_price?.toString() || '0'),
        status: r.status,
        deposit_paid: false, // Legacy: à calculer depuis orders si besoin
        balance_paid: false,
        contract_signed: !!r.client_signature,
        created_at: r.created_at,
        updated_at: r.updated_at || r.created_at,
      };
    });

    // Fusionner et trier
    const allReservations = [...clientReservationsNormalized, ...reservationsNormalized]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + pageSize);

    const total = (clientReservationsCount || 0) + (reservationsCount || 0);

    return NextResponse.json({
      data: allReservations,
      page,
      pageSize,
      total,
    });
  } catch (error: any) {
    console.error('Erreur API reservations list:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
```

### Payload JSON de Réponse

```json
{
  "data": [
    {
      "id": "uuid-1",
      "source": "client_reservation",
      "pack_key": "soiree",
      "pack_label": "Pack Soirée",
      "customer_email": "client@example.com",
      "customer_name": "Jean Dupont",
      "customer_phone": "+33612345678",
      "start_at": "2025-01-10T20:00:00.000Z",
      "end_at": "2025-01-11T02:00:00.000Z",
      "address": "123 Rue Example, Paris",
      "price_total": 329.00,
      "status": "CONFIRMED",
      "deposit_paid": true,
      "balance_paid": false,
      "contract_signed": true,
      "created_at": "2025-01-01T10:00:00.000Z",
      "updated_at": "2025-01-02T15:30:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 50,
  "total": 125
}
```

### Index Nécessaires

```sql
-- Pour recherche texte sur client_reservations
CREATE INDEX IF NOT EXISTS idx_client_reservations_customer_email_trgm 
  ON client_reservations USING gin (customer_email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_client_reservations_address_trgm 
  ON client_reservations USING gin (address gin_trgm_ops);

-- Pour filtres date
CREATE INDEX IF NOT EXISTS idx_client_reservations_start_at 
  ON client_reservations(start_at);

-- Pour orders lookup
CREATE INDEX IF NOT EXISTS idx_orders_client_reservation_id 
  ON orders(client_reservation_id);

CREATE INDEX IF NOT EXISTS idx_orders_reservation_id 
  ON orders(reservation_id);
```

---

## 🔌 E) ENDPOINT 4: GET /api/admin/reservations/[id]

### Fichier à créer : `app/api/admin/reservations/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper verifyAdmin (même que pending-actions)
async function verifyAdmin(token: string): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  // ... (copier depuis pending-actions)
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
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

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') || 'auto'; // 'client' | 'legacy' | 'auto'

    let reservation: any = null;
    let reservationSource: 'client_reservation' | 'reservation' = 'client_reservation';

    // Détection automatique ou source explicite
    if (source === 'client' || source === 'auto') {
      const { data: clientReservation } = await supabaseAdmin
        .from('client_reservations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (clientReservation) {
        reservation = clientReservation;
        reservationSource = 'client_reservation';
      }
    }

    if (!reservation && (source === 'legacy' || source === 'auto')) {
      const { data: legacyReservation } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (legacyReservation) {
        reservation = legacyReservation;
        reservationSource = 'reservation';
      }
    }

    if (!reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Charger orders
    let orders: any[] = [];
    if (reservationSource === 'client_reservation') {
      const { data: ordersData } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('client_reservation_id', id)
        .order('created_at', { ascending: false });
      orders = ordersData || [];
    } else {
      // Legacy: essayer reservation_id, sinon metadata fallback
      const { data: ordersByReservationId } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('reservation_id', id)
        .order('created_at', { ascending: false });

      if (ordersByReservationId && ordersByReservationId.length > 0) {
        orders = ordersByReservationId;
      } else {
        // Fallback metadata
        const { data: allOrders } = await supabaseAdmin
          .from('orders')
          .select('*')
          .contains('metadata', { reservationId: id })
          .order('created_at', { ascending: false });
        orders = allOrders || [];
      }
    }

    // Charger état des lieux (legacy uniquement)
    let etatLieux: any = null;
    if (reservationSource === 'reservation') {
      const { data: etatLieuxData } = await supabaseAdmin
        .from('etat_lieux')
        .select('*')
        .eq('reservation_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      etatLieux = etatLieuxData;
    }

    // Informations contrat
    const contractSigned = reservationSource === 'client_reservation'
      ? !!reservation.client_signature
      : !!reservation.client_signature;

    const contractSignedAt = reservationSource === 'client_reservation'
      ? reservation.client_signed_at
      : reservation.client_signed_at;

    // URLs documents
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const contractUrl = reservationSource === 'client_reservation'
      ? `${baseUrl}/api/contract/download?clientReservationId=${id}`
      : `${baseUrl}/api/contract/download?reservationId=${id}`;

    const invoiceUrls = orders.map((order: any) => 
      `${baseUrl}/api/invoice/download?orderId=${order.id}`
    );

    const etatLieuxUrl = etatLieux
      ? `${baseUrl}/api/etat-lieux/download?etatLieuxId=${etatLieux.id}`
      : (reservationSource === 'reservation'
          ? `${baseUrl}/api/etat-lieux/download?reservationId=${id}`
          : undefined);

    const response = {
      reservation: {
        ...reservation,
        source: reservationSource,
      },
      orders,
      contract: {
        signed: contractSigned,
        signed_at: contractSignedAt,
      },
      documents: {
        contract_url: contractUrl,
        invoice_urls: invoiceUrls,
        etat_lieux_url: etatLieuxUrl,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Erreur API reservation detail:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
```

### Payload JSON de Réponse

```json
{
  "reservation": {
    "id": "uuid-1",
    "pack_key": "soiree",
    "customer_email": "client@example.com",
    "start_at": "2025-01-10T20:00:00.000Z",
    "end_at": "2025-01-11T02:00:00.000Z",
    "address": "123 Rue Example, Paris",
    "price_total": 329.00,
    "status": "CONFIRMED",
    "client_signature": "data:image/png;base64,...",
    "client_signed_at": "2025-01-02T15:30:00.000Z",
    "source": "client_reservation"
  },
  "orders": [
    {
      "id": "order-uuid-1",
      "customer_email": "client@example.com",
      "customer_name": "Jean Dupont",
      "total": 98.70,
      "status": "paid",
      "created_at": "2025-01-01T10:00:00.000Z"
    }
  ],
  "contract": {
    "signed": true,
    "signed_at": "2025-01-02T15:30:00.000Z"
  },
  "documents": {
    "contract_url": "http://localhost:3000/api/contract/download?clientReservationId=uuid-1",
    "invoice_urls": [
      "http://localhost:3000/api/invoice/download?orderId=order-uuid-1"
    ],
    "etat_lieux_url": null
  }
}
```

---

## 📁 F) FICHIERS À MODIFIER

### 1. Helper Auth Admin Centralisé

**Fichier à créer** : `lib/adminAuth.ts`

```typescript
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

### 2. Modifications Composants

#### `components/AdminSidebar.tsx`

**Modifications** :
- Supprimer toutes les requêtes Supabase directes
- Ajouter `useEffect` pour fetch `/api/admin/pending-actions`
- Refresh toutes les 30 secondes
- Mapper badges depuis réponse API

```typescript
// Dans AdminSidebar.tsx

const [pendingActions, setPendingActions] = useState<PendingActions | null>(null);

useEffect(() => {
  if (!user || !supabase) return;

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
        setPendingActions(data);
      }
    } catch (error) {
      console.error('Erreur fetch pending-actions:', error);
    }
  };

  fetchPendingActions();
  const interval = setInterval(fetchPendingActions, 30000); // 30s

  return () => clearInterval(interval);
}, [user, supabase]);

// Mapping badges
const reservationsBadge = pendingActions?.reservations.total || 0;
const paymentsBadge = pendingActions?.payments.total || 0;
const documentsBadge = pendingActions?.documents.total || 0;
const demandesBadge = pendingActions?.inbound.reservation_requests_new || 0;
const proBadge = pendingActions?.inbound.pro_requests_pending || 0;
const livraisonsBadge = pendingActions?.operations.deliveries_in_progress || 0;
const etatsDesLieuxBadge = pendingActions?.operations.condition_reports_to_review || 0;
```

#### `app/admin/page.tsx`

**Modifications** :
- Supprimer toutes les requêtes Supabase directes
- Fetch `/api/admin/dashboard` au mount
- Utiliser données depuis API

```typescript
// Dans app/admin/page.tsx

const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

useEffect(() => {
  if (!user || !supabase || !isAdmin) return;

  const fetchDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Erreur fetch dashboard:', error);
    }
  };

  fetchDashboard();
}, [user, supabase, isAdmin]);
```

#### `app/admin/reservations/page.tsx`

**Modifications** :
- Supprimer requêtes Supabase directes
- Fetch `/api/admin/reservations` avec query params
- Modal détails: fetch `/api/admin/reservations/[id]`

```typescript
// Dans app/admin/reservations/page.tsx

const [reservations, setReservations] = useState<ReservationAdminRow[]>([]);
const [total, setTotal] = useState(0);
const [page, setPage] = useState(1);

useEffect(() => {
  if (!user || !supabase) return;

  const fetchReservations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
        ...(status && { status }),
        ...(query && { query }),
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
      }
    } catch (error) {
      console.error('Erreur fetch reservations:', error);
    }
  };

  fetchReservations();
}, [user, supabase, page, status, query]);
```

### 3. Page Documents Optionnelle

**Fichier à créer** : `app/admin/documents/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import DocumentsPanel from '@/components/DocumentsPanel';

export default function AdminDocumentsPage() {
  const { user } = useUser();
  const [contractsUnsigned, setContractsUnsigned] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentEtatLieux, setRecentEtatLieux] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchDocuments = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Fetch via API admin (à créer si besoin)
      // Ou utiliser directement pending-actions pour contrats non signés
      const response = await fetch('/api/admin/pending-actions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Charger les réservations avec contrats non signés
        // ...
      }
    };

    fetchDocuments();
  }, [user, supabase]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      
      {/* Contrats non signés */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Contrats à signer</h2>
        {/* Liste avec DocumentsPanel */}
      </section>

      {/* Dernières factures */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Dernières factures</h2>
        {/* Liste factures */}
      </section>

      {/* États des lieux récents */}
      <section>
        <h2 className="text-xl font-semibold mb-4">États des lieux récents</h2>
        {/* Liste états des lieux */}
      </section>
    </div>
  );
}
```

---

## 🚀 G) ORDRE DE MIGRATION

### Étape 1 : Helper Auth + Endpoint Pending Actions

**Fichiers à créer** :
1. `lib/adminAuth.ts` (helper centralisé)
2. `app/api/admin/pending-actions/route.ts`

**Fichiers à modifier** :
1. `components/AdminSidebar.tsx` (fetch pending-actions, supprimer requêtes Supabase)

**Tests** :
- Vérifier que badges s'affichent correctement
- Vérifier refresh toutes les 30s

---

### Étape 2 : Endpoint Dashboard + Page Admin

**Fichiers à créer** :
1. `app/api/admin/dashboard/route.ts`

**Fichiers à modifier** :
1. `app/admin/page.tsx` (fetch dashboard API, supprimer requêtes Supabase)

**Tests** :
- Vérifier que stats s'affichent
- Vérifier sections automatisation
- Vérifier réservations à venir

---

### Étape 3 : Endpoints Reservations + Page Reservations

**Fichiers à créer** :
1. `app/api/admin/reservations/route.ts`
2. `app/api/admin/reservations/[id]/route.ts`

**Fichiers à modifier** :
1. `app/admin/reservations/page.tsx` (fetch reservations API)
2. Modal détails: fetch `/api/admin/reservations/[id]`

**Tests** :
- Vérifier liste réservations
- Vérifier filtres (query, status, dates)
- Vérifier pagination
- Vérifier modal détails avec documents

---

### Étape 4 : Page Documents (Optionnel)

**Fichiers à créer** :
1. `app/admin/documents/page.tsx`

**Fichiers à modifier** :
1. `components/AdminSidebar.tsx` (ajouter lien Documents)

**Tests** :
- Vérifier affichage contrats non signés
- Vérifier liste factures
- Vérifier états des lieux

---

## 📝 TODOs IMPORTANTS

1. **Créer helper auth centralisé** (`lib/adminAuth.ts`)
2. **Créer 4 endpoints API** avec service role
3. **Modifier AdminSidebar** pour fetch pending-actions
4. **Modifier page admin** pour fetch dashboard
5. **Modifier page reservations** pour fetch API
6. **Ajouter index SQL** pour performances recherche texte
7. **Tester auth admin** avec différents users
8. **Vérifier RLS** : admin ne doit jamais utiliser client Supabase pour données globales

---

**Documentation générée le** : 2025-01-05
**Version** : 1.0
