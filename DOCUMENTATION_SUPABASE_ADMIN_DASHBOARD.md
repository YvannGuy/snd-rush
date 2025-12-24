# 🔐 Documentation Complète : Interactions Supabase Dashboard Admin

## 📋 Table des matières

1. [Tables Utilisées](#tables-utilisées)
2. [RLS Policies](#rls-policies)
3. [Requêtes par Page Admin](#requêtes-par-page)
4. [API Routes avec Service Role](#api-routes-service-role)
5. [Index et Performances](#index-et-performances)
6. [Sécurité et Authentification](#sécurité)

---

## 📊 TABLES UTILISÉES

### Tables Principales

#### 1. `client_reservations` ⭐ (Table principale)

**Colonnes principales** :
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
customer_email text
pack_key text CHECK (pack_key IN ('conference', 'soiree', 'mariage'))
status text DEFAULT 'AWAITING_PAYMENT'
price_total numeric
deposit_amount numeric
balance_amount numeric
base_pack_price numeric
extras_total numeric
final_items jsonb
customer_summary text
start_at timestamptz
end_at timestamptz
address text
customer_phone text
deposit_paid_at timestamptz
balance_paid_at timestamptz
balance_due_at timestamptz
deposit_requested_at timestamptz
deposit_session_id text
stripe_session_id text
client_signature text
client_signed_at timestamptz
final_validated_at timestamptz
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

**Utilisation Dashboard Admin** :
- ✅ **Lecture** : Toutes les réservations (pas de filtre user_id)
- ✅ **Écriture** : Via API routes avec service role uniquement
- ✅ **Statistiques** : CA, matériel sorti, retours en retard
- ✅ **Automatisation** : Solde à payer (J-5), cautions (J-2)

#### 2. `reservations` (Table legacy)

**Colonnes principales** :
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users(id)
start_date date
end_date date
total_price numeric
deposit_amount numeric
status text
address text
client_signature text
client_signed_at timestamptz
delivery_status text
notes jsonb
created_at timestamptz
```

**Utilisation Dashboard Admin** :
- ✅ **Lecture** : Toutes les réservations (compatibilité legacy)
- ✅ **Écriture** : Mise à jour `delivery_status`, `status`
- ✅ **Documents** : Contrats, factures (via `reservation_id`)

#### 3. `orders`

**Colonnes principales** :
```sql
id uuid PRIMARY KEY
customer_email text
customer_name text
customer_phone text
total numeric
status text
stripe_session_id text
metadata jsonb
client_reservation_id uuid REFERENCES client_reservations(id) ON DELETE SET NULL
reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL
created_at timestamptz
```

**Utilisation Dashboard Admin** :
- ✅ **Lecture** : Toutes les commandes (pas de filtre email)
- ✅ **Liaison** : Via `client_reservation_id` (nouveau) ou `reservation_id` (legacy)
- ✅ **Factures** : Génération PDF depuis orders
- ✅ **Clients** : Groupement par `customer_email`

#### 4. `reservation_requests`

**Colonnes principales** :
```sql
id uuid PRIMARY KEY
pack_key text
status text DEFAULT 'NEW'
customer_email text
customer_phone text
customer_name text
payload jsonb
rejection_reason text
created_at timestamptz
updated_at timestamptz
```

**Utilisation Dashboard Admin** :
- ✅ **Lecture** : Toutes les demandes (via API route avec service role)
- ✅ **Actions** : Approbation, ajustement, rejet
- ✅ **Badge** : Compteur demandes NEW/PENDING_REVIEW

#### 5. `etat_lieux`

**Colonnes principales** :
```sql
id uuid PRIMARY KEY
reservation_id uuid REFERENCES reservations(id)
status text
photos jsonb
notes text
created_at timestamptz
```

**Utilisation Dashboard Admin** :
- ✅ **Lecture** : Tous les états des lieux
- ✅ **Écriture** : Création, mise à jour statut
- ✅ **Badge** : Compteur états à traiter

#### 6. `user_profiles`

**Colonnes principales** :
```sql
user_id uuid PRIMARY KEY REFERENCES auth.users(id)
first_name text
last_name text
email text
is_admin boolean DEFAULT false
created_at timestamptz
```

**Utilisation Dashboard Admin** :
- ✅ **Lecture** : Profils utilisateurs (pour noms/prénoms)
- ✅ **Vérification Admin** : `is_admin = true`

#### 7. `products`

**Colonnes principales** :
```sql
id uuid PRIMARY KEY
name text
category text
daily_price_ttc numeric
created_at timestamptz
```

**Utilisation Dashboard Admin** :
- ✅ **CRUD** : Gestion catalogue produits

#### 8. `packs`

**Colonnes principales** :
```sql
id uuid PRIMARY KEY
name text
description text
items jsonb
created_at timestamptz
```

**Utilisation Dashboard Admin** :
- ✅ **CRUD** : Gestion packs

---

## 🔒 RLS POLICIES

### Table `client_reservations`

**RLS Activé** : ✅ Oui

**Policies** :

```sql
-- SELECT : Les utilisateurs peuvent voir leurs propres réservations
CREATE POLICY "Users can view their own client reservations"
  ON client_reservations
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.email() = customer_email
  );
```

**Impact Dashboard Admin** :
- ❌ **Client Supabase** : Ne peut pas lire toutes les réservations (RLS bloque)
- ✅ **Service Role** : Bypass RLS, peut lire toutes les réservations
- ✅ **Solution** : Dashboard admin utilise `supabaseAdmin` (service role) OU API routes avec service role

### Table `reservation_requests`

**RLS Activé** : ✅ Oui

**Policies** :

```sql
-- SELECT : Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own reservation requests"
  ON reservation_requests
  FOR SELECT
  USING (auth.email() = customer_email);
```

**Impact Dashboard Admin** :
- ❌ **Client Supabase** : Ne peut pas lire toutes les demandes
- ✅ **Service Role** : Bypass RLS via API routes
- ✅ **Solution** : `/api/admin/reservation-requests` utilise service role

### Table `orders`

**RLS Activé** : ❓ (À vérifier dans migrations)

**Impact Dashboard Admin** :
- ✅ **Service Role** : Bypass RLS, peut lire toutes les commandes
- ✅ **Solution** : Dashboard admin utilise `supabaseAdmin` (service role)

### Table `reservations` (legacy)

**RLS Activé** : ❓ (À vérifier dans migrations)

**Impact Dashboard Admin** :
- ✅ **Service Role** : Bypass RLS, peut lire toutes les réservations
- ✅ **Solution** : Dashboard admin utilise `supabaseAdmin` (service role)

### Table `etat_lieux`

**RLS Activé** : ❓ (À vérifier dans migrations)

**Impact Dashboard Admin** :
- ✅ **Service Role** : Bypass RLS, peut lire tous les états des lieux
- ✅ **Solution** : Dashboard admin utilise `supabaseAdmin` (service role)

### Table `user_profiles`

**RLS Activé** : ❓ (À vérifier dans migrations)

**Impact Dashboard Admin** :
- ✅ **Service Role** : Bypass RLS, peut lire tous les profils
- ✅ **Solution** : Dashboard admin utilise `supabaseAdmin` (service role)

---

## 📄 REQUÊTES PAR PAGE ADMIN

### 1. `/admin` - Dashboard Principal

**Fichier** : `app/admin/page.tsx`

#### Requêtes Supabase (12 requêtes en parallèle) :

```typescript
// 1. Réservations à venir (30 jours)
const reservationsPromise = supabaseClient
  .from('client_reservations')
  .select('*')
  .gte('start_at', todayStr)
  .lte('start_at', endDateStr)
  .order('start_at', { ascending: true })
  .limit(50);

// 2. Orders récents
const ordersPromise = supabaseClient
  .from('orders')
  .select('customer_email, customer_name, customer_phone, total, status, created_at, stripe_session_id, metadata, client_reservation_id')
  .order('created_at', { ascending: false })
  .limit(100);

// 3. Count réservations à venir
const reservationsCountPromise = supabaseClient
  .from('client_reservations')
  .select('*', { count: 'exact', head: true })
  .gte('start_at', todayStr)
  .lte('start_at', endDateStr);

// 4. CA ce mois
const reservationsRevenuePromise = supabaseClient
  .from('client_reservations')
  .select('id, price_total, created_at')
  .gte('created_at', startOfMonthStr);

// 5. Matériel sorti ce mois
const equipmentOutPromise = supabaseClient
  .from('client_reservations')
  .select('id, start_at')
  .gte('start_at', startOfMonthStr)
  .in('status', ['CONFIRMED', 'AWAITING_BALANCE']);

// 6. Retours en retard
const lateReturnsPromise = supabaseClient
  .from('client_reservations')
  .select('id')
  .lt('end_at', todayStr)
  .in('status', ['CONFIRMED', 'AWAITING_BALANCE']);

// 7. Clients récents (via orders)
const recentOrdersPromise = supabaseClient
  .from('orders')
  .select('customer_email, customer_name, total, created_at, client_reservation_id')
  .not('client_reservation_id', 'is', null)
  .order('created_at', { ascending: false })
  .limit(10);

// 8. État du matériel (réservations actives)
const equipmentDataPromise = supabaseClient
  .from('client_reservations')
  .select('*')
  .lte('start_at', todayStr)
  .gte('end_at', todayStr)
  .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
  .order('end_at', { ascending: true })
  .limit(5);

// 9. Planning mensuel
const calendarReservationsPromise = supabaseClient
  .from('client_reservations')
  .select('start_at, end_at, status')
  .gte('start_at', startOfMonth.toISOString().split('T')[0])
  .lte('start_at', endOfMonth.toISOString().split('T')[0]);

// 10. Solde à payer (J-5)
const balanceDuePromise = supabaseClient
  .from('client_reservations')
  .select('*')
  .not('deposit_paid_at', 'is', null)
  .is('balance_paid_at', null)
  .not('balance_due_at', 'is', null)
  .lte('balance_due_at', now.toISOString())
  .order('balance_due_at', { ascending: true })
  .limit(20);

// 11. Cautions à demander (J-2)
const depositDuePromise = supabaseClient
  .from('client_reservations')
  .select('*')
  .not('deposit_requested_at', 'is', null)
  .lte('deposit_requested_at', now.toISOString())
  .is('deposit_session_id', null)
  .in('status', ['AWAITING_BALANCE', 'CONFIRMED'])
  .order('deposit_requested_at', { ascending: true })
  .limit(20);

// 12. Événements cette semaine
const weekEventsPromise = supabaseClient
  .from('client_reservations')
  .select('*')
  .not('start_at', 'is', null)
  .gte('start_at', today.toISOString())
  .lte('start_at', weekEndDate.toISOString())
  .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
  .order('start_at', { ascending: true })
  .limit(20);
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non (mais admin a accès via RLS si policy admin existe)
**Note** : Si RLS bloque, utiliser `supabaseAdmin` (service role)

---

### 2. `/admin/reservations` - Liste Réservations

**Fichier** : `app/admin/reservations/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Réservations legacy
const { data: reservationsData } = await supabase
  .from('reservations')
  .select('*')
  .order('created_at', { ascending: false });

// 2. Client reservations (nouvelles)
const { data: clientReservationsData } = await supabase
  .from('client_reservations')
  .select('*')
  .order('created_at', { ascending: false });

// 3. Orders (pour enrichir)
const { data: allOrders } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false });

// 4. User profiles (pour noms/prénoms)
const { data: userProfiles } = await supabase
  .from('user_profiles')
  .select('user_id, first_name, last_name, email')
  .in('user_id', userIds);

// 5. Orders pour réservation sélectionnée (client_reservation)
const { data: ordersData } = await supabase
  .from('orders')
  .select('*')
  .eq('client_reservation_id', selectedReservation.id)
  .order('created_at', { ascending: false });

// 6. Orders pour réservation sélectionnée (legacy)
const { data: ordersData } = await supabase
  .from('orders')
  .select('*')
  .eq('reservation_id', selectedReservation.id)
  .order('created_at', { ascending: false });

// 7. État des lieux pour réservation legacy
const { data: etatLieuxData } = await supabase
  .from('etat_lieux')
  .select('id, created_at')
  .eq('reservation_id', selectedReservation.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

### 3. `/admin/reservation-requests` - Demandes de Réservation

**Fichier** : `app/admin/reservation-requests/page.tsx`

#### Requêtes Supabase :

```typescript
// Via API route (service role)
const response = await fetch('/api/admin/reservation-requests', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});
```

**API Route** : `app/api/admin/reservation-requests/route.ts`

```typescript
// Utilise supabaseAdmin (service role)
const { data: requests, error } = await supabaseAdmin
  .from('reservation_requests')
  .select('*')
  .order('created_at', { ascending: false });
```

**Client Supabase utilisé** : `supabaseAdmin` (service role)
**Bypass RLS** : ✅ Oui

---

### 4. `/admin/factures` - Factures

**Fichier** : `app/admin/factures/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Orders (factures)
const { data: ordersData } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false });

// 2. Réservations legacy (pour enrichir)
const { data: reservationsData } = await supabase
  .from('reservations')
  .select('*');

// 3. Client reservations (pour enrichir)
const { data: clientReservationsData } = await supabase
  .from('client_reservations')
  .select('*');

// 4. Création facture manuelle
const { data: newOrder } = await supabase
  .from('orders')
  .insert({
    customer_email,
    customer_name,
    total,
    status: 'pending',
    metadata: { ... }
  })
  .select()
  .single();
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

### 5. `/admin/contrats` - Contrats

**Fichier** : `app/admin/contrats/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Réservations legacy (avec contrats)
const { data: reservationsData } = await supabase
  .from('reservations')
  .select('*')
  .in('status', ['CONFIRMED', 'CONTRACT_PENDING']);

// 2. Client reservations (avec contrats)
const { data: clientReservationsData } = await supabase
  .from('client_reservations')
  .select('*')
  .in('status', ['CONFIRMED', 'AWAITING_BALANCE']);

// 3. Orders (pour enrichir)
const { data: ordersData } = await supabase
  .from('orders')
  .select('*');
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

### 6. `/admin/clients` - Clients

**Fichier** : `app/admin/clients/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Orders (groupement par email)
const { data: ordersData } = await supabase
  .from('orders')
  .select('customer_email, customer_name, customer_phone, total, created_at')
  .order('created_at', { ascending: false });

// 2. Orders pour client spécifique
const { data: ordersData } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_email', email);

// 3. Réservations legacy pour client
const { data: reservationsData } = await supabase
  .from('reservations')
  .select('*')
  .eq('user_id', userId);
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

### 7. `/admin/etats-des-lieux` - États des Lieux

**Fichier** : `app/admin/etats-des-lieux/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Réservations (pour filtrer)
const { data: reservationsData } = await supabase
  .from('reservations')
  .select('*');

// 2. États des lieux
const { data: etatsLieuxData } = await supabase
  .from('etat_lieux')
  .select('*')
  .order('created_at', { ascending: false });

// 3. Création état des lieux
const { data: newEtatLieux } = await supabase
  .from('etat_lieux')
  .insert({
    reservation_id,
    status: 'livraison_complete',
    photos: [],
    notes: ''
  })
  .select()
  .single();

// 4. Mise à jour état des lieux
const { data: updatedEtatLieux } = await supabase
  .from('etat_lieux')
  .update({
    status: 'reprise_complete',
    photos: photosArray,
    notes: notesText
  })
  .eq('id', etatLieuxId)
  .select()
  .single();
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

### 8. `/admin/livraisons` - Livraisons

**Fichier** : `app/admin/livraisons/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Orders
const { data: ordersData } = await supabase
  .from('orders')
  .select('*');

// 2. Réservations (pour delivery_status)
const { data: reservationsData } = await supabase
  .from('reservations')
  .select('*');

// 3. Mise à jour delivery_status
const { data: updatedReservation } = await supabase
  .from('reservations')
  .update({ delivery_status: 'en_cours' })
  .eq('id', reservationId)
  .select()
  .single();

// 4. Finalisation livraison
const { data: updatedReservation } = await supabase
  .from('reservations')
  .update({ delivery_status: 'termine' })
  .eq('id', reservationId)
  .select()
  .single();
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

### 9. `/admin/catalogue` - Catalogue Produits

**Fichier** : `app/admin/catalogue/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Liste produits
const { data: productsData } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

### 10. `/admin/packs` - Packs

**Fichier** : `app/admin/packs/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Liste packs
const { data: packsData } = await supabase
  .from('packs')
  .select('*')
  .order('created_at', { ascending: false });
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

### 11. `/admin/planning` - Planning

**Fichier** : `app/admin/planning/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Réservations (pour calendrier)
const { data: reservationsData } = await supabase
  .from('reservations')
  .select('*');

// 2. Orders (pour enrichir)
const { data: ordersData } = await supabase
  .from('orders')
  .select('*');

// 3. User profiles (pour noms)
const { data: userProfiles } = await supabase
  .from('user_profiles')
  .select('user_id, first_name, last_name, email');
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

### 12. `/admin/parametres` - Paramètres

**Fichier** : `app/admin/parametres/page.tsx`

#### Requêtes Supabase :

```typescript
// 1. Statistiques générales
const [
  { count: productsCount },
  { count: packsCount },
  { count: reservationsCount },
  { count: ordersCount }
] = await Promise.all([
  supabase.from('products').select('*', { count: 'exact', head: true }),
  supabase.from('packs').select('*', { count: 'exact', head: true }),
  supabase.from('reservations').select('*', { count: 'exact', head: true }),
  supabase.from('orders').select('customer_email', { count: 'exact', head: true })
]);

// 2. Clients uniques
const { data: ordersData } = await supabase
  .from('orders')
  .select('customer_email');
```

**Client Supabase utilisé** : `supabase` (client normal)
**Bypass RLS** : ❌ Non

---

## 🔧 API ROUTES AVEC SERVICE ROLE

### 1. `/api/admin/client-reservations/adjust`

**Fichier** : `app/api/admin/client-reservations/adjust/route.ts`

**Service Role** : ✅ Oui (`supabaseAdmin`)

**Requêtes Supabase** :

```typescript
// 1. Lecture réservation
const { data: reservation } = await supabaseAdmin
  .from('client_reservations')
  .select('*')
  .eq('id', id)
  .single();

// 2. Mise à jour réservation
const { data: updatedReservation } = await supabaseAdmin
  .from('client_reservations')
  .update({
    final_items,
    base_pack_price,
    extras_total,
    price_total,
    balance_amount,
    customer_summary,
    final_validated_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .eq('id', id)
  .select()
  .single();
```

**Bypass RLS** : ✅ Oui
**Authentification** : Vérification admin via `user.user_metadata.role === 'admin'`

---

### 2. `/api/admin/reservation-requests`

**Fichier** : `app/api/admin/reservation-requests/route.ts`

**Service Role** : ✅ Oui (`supabaseAdmin`)

**Requêtes Supabase** :

```typescript
// Lecture toutes les demandes
const { data: requests } = await supabaseAdmin
  .from('reservation_requests')
  .select('*')
  .order('created_at', { ascending: false });
```

**Bypass RLS** : ✅ Oui

---

### 3. `/api/admin/reservation-requests/approve`

**Fichier** : `app/api/admin/reservation-requests/approve/route.ts`

**Service Role** : ✅ Oui (`supabaseAdmin`)

**Requêtes Supabase** :

```typescript
// 1. Mise à jour demande
const { data: updatedRequest } = await supabaseAdmin
  .from('reservation_requests')
  .update({ status: 'APPROVED' })
  .eq('id', requestId)
  .select()
  .single();

// 2. Création client_reservation
const { data: newReservation } = await supabaseAdmin
  .from('client_reservations')
  .insert({
    request_id: requestId,
    customer_email,
    pack_key,
    status: 'AWAITING_PAYMENT',
    price_total,
    deposit_amount,
    start_at,
    end_at,
    address
  })
  .select()
  .single();
```

**Bypass RLS** : ✅ Oui

---

## 📈 INDEX ET PERFORMANCES

### Index sur `client_reservations`

```sql
-- Index user_id (pour filtrage user)
CREATE INDEX idx_client_reservations_user_id ON client_reservations(user_id);

-- Index customer_email (pour filtrage email)
CREATE INDEX idx_client_reservations_customer_email ON client_reservations(customer_email);

-- Index status (pour filtrage statut)
CREATE INDEX idx_client_reservations_status ON client_reservations(status);

-- Index request_id (pour liaison demande)
CREATE INDEX idx_client_reservations_request_id ON client_reservations(request_id);

-- Index stripe_session_id (pour webhooks)
CREATE INDEX idx_client_reservations_stripe_session_id ON client_reservations(stripe_session_id);

-- Index start_at (pour planning et filtres date)
-- À créer si non existant
CREATE INDEX IF NOT EXISTS idx_client_reservations_start_at ON client_reservations(start_at);

-- Index end_at (pour retours en retard)
CREATE INDEX IF NOT EXISTS idx_client_reservations_end_at ON client_reservations(end_at);

-- Index composite pour automatisation (balance_due_at)
CREATE INDEX IF NOT EXISTS idx_client_reservations_balance_due ON client_reservations(balance_due_at) 
WHERE balance_due_at IS NOT NULL AND balance_paid_at IS NULL;

-- Index composite pour automatisation (deposit_requested_at)
CREATE INDEX IF NOT EXISTS idx_client_reservations_deposit_requested ON client_reservations(deposit_requested_at) 
WHERE deposit_requested_at IS NOT NULL AND deposit_session_id IS NULL;
```

### Index sur `orders`

```sql
-- Index customer_email (pour filtrage client)
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Index client_reservation_id (pour liaison réservation)
CREATE INDEX IF NOT EXISTS idx_orders_client_reservation_id ON orders(client_reservation_id);

-- Index reservation_id (pour liaison legacy)
CREATE INDEX IF NOT EXISTS idx_orders_reservation_id ON orders(reservation_id);

-- Index created_at (pour tri)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
```

### Index sur `reservation_requests`

```sql
-- Index status (pour filtrage)
CREATE INDEX idx_reservation_requests_status ON reservation_requests(status);

-- Index customer_email (pour RLS)
CREATE INDEX idx_reservation_requests_customer_email ON reservation_requests(customer_email);

-- Index created_at (pour tri)
CREATE INDEX idx_reservation_requests_created_at ON reservation_requests(created_at DESC);
```

---

## 🔐 SÉCURITÉ ET AUTHENTIFICATION

### Vérification Admin

**Hook** : `hooks/useAdmin.ts`

```typescript
// Vérifie user_profiles.is_admin = true
const { data: profile } = await supabase
  .from('user_profiles')
  .select('is_admin')
  .eq('user_id', user.id)
  .single();

const isAdmin = profile?.is_admin === true;
```

### Service Role Key

**Configuration** :
```typescript
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Secret, jamais exposé côté client
);
```

**Utilisation** :
- ✅ API routes uniquement (côté serveur)
- ❌ Jamais dans les composants React (côté client)
- ✅ Bypass RLS automatique

### Authentification API Routes

**Pattern** :
```typescript
// 1. Vérifier token Bearer
const authHeader = req.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');

// 2. Vérifier utilisateur
const { data: { user } } = await supabaseAdmin.auth.getUser(token);

// 3. Vérifier admin
const isAdmin = user.user_metadata?.role === 'admin' || 
                user.email === 'yvann.guyonnet@gmail.com' ||
                user.email === 'sndrush12@gmail.com';

if (!isAdmin) {
  return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
}
```

---

## 🚨 PROBLÈMES POTENTIELS ET SOLUTIONS

### Problème 1 : RLS bloque les requêtes admin

**Symptôme** : Dashboard admin ne charge pas les données

**Cause** : Utilisation de `supabase` (client normal) au lieu de `supabaseAdmin` (service role)

**Solution** :
1. Utiliser `supabaseAdmin` dans les pages admin (si possible)
2. OU créer des API routes avec service role
3. OU créer une policy RLS admin :

```sql
CREATE POLICY "Admins can view all client reservations"
  ON client_reservations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );
```

### Problème 2 : Performances lentes

**Symptôme** : Dashboard admin met du temps à charger

**Cause** : Trop de requêtes séquentielles

**Solution** :
- ✅ Utiliser `Promise.all()` pour requêtes parallèles
- ✅ Limiter les résultats avec `.limit()`
- ✅ Utiliser des index sur les colonnes filtrées
- ✅ Utiliser `count: 'exact', head: true` pour les comptages

### Problème 3 : Données manquantes

**Symptôme** : Certaines réservations n'apparaissent pas

**Cause** : RLS bloque ou filtre incorrect

**Solution** :
- Vérifier les policies RLS
- Utiliser service role pour admin
- Vérifier les filtres dans les requêtes

---

## 📝 RÉSUMÉ

### Tables Principales Dashboard Admin

1. **`client_reservations`** ⭐ (table principale)
2. **`orders`** (factures, clients)
3. **`reservation_requests`** (demandes)
4. **`reservations`** (legacy)
5. **`etat_lieux`** (états des lieux)
6. **`user_profiles`** (profils utilisateurs)
7. **`products`** (catalogue)
8. **`packs`** (packs)

### RLS Policies

- ✅ `client_reservations` : RLS activé (users voient leurs propres réservations)
- ✅ `reservation_requests` : RLS activé (users voient leurs propres demandes)
- ❓ Autres tables : À vérifier dans migrations

### Service Role

- ✅ Utilisé dans API routes admin
- ✅ Bypass RLS automatique
- ❌ Jamais exposé côté client

### Optimisations

- ✅ Requêtes parallèles avec `Promise.all()`
- ✅ Limites sur résultats (50-100 items)
- ✅ Index sur colonnes filtrées
- ✅ Map pour recherche O(1) des orders

---

**Documentation générée le** : 2025-01-05
**Version** : 1.0
