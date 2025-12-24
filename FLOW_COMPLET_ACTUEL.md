# 📋 FLOW UX COMPLET ACTUEL - Documentation Exhaustive

**Date de mise à jour :** 2025-01-03  
**Versions incluses :** V1.2 (Availability Check), V1.3 (Instant Booking), V1.4 (Public Checkout), V1.5 (Public Tracking), HOLD v1

---

## 🎯 FLOW UX COMPLET (Résumé Visuel)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. HOMEPAGE → CHAT                                                      │
│    app/page.tsx                                                          │
│    └─> FloatingChatWidget (components/FloatingChatWidget.tsx)           │
│        └─> useChat hook (hooks/useChat.ts)                              │
│            └─> /api/chat (app/api/chat/route.ts)                        │
│                └─> Mode pack activé                                      │
│                    └─> Vérification disponibilité (V1.2)                 │
│                        └─> /api/availability (app/api/availability/route.ts) │
│                            └─> Vérifie: reservations + client_reservations + holds │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. ENVOI DEMANDE (2 FLUX POSSIBLES)                                     │
│                                                                          │
│ FLUX A: DEMANDE NORMALE                                                  │
│    └─> POST /api/reservation-requests                                   │
│        └─> Crée reservation_requests (status: NEW)                      │
│            └─> Génère token public (V1.5)                               │
│                └─> Retourne publicTrackingUrl                           │
│                    └─> Bouton "Suivre ma demande" dans chat             │
│                        └─> /suivi?rid=...&token=...                     │
│                                                                          │
│ FLUX B: INSTANT BOOKING (V1.3)                                          │
│    └─> Vérifie éligibilité (dispo + simple)                             │
│        └─> POST /api/holds (création hold 10 min)                      │
│            └─> POST /api/instant-reservations                           │
│                └─> Crée client_reservations (status: AWAITING_PAYMENT)   │
│                    └─> Consomme le hold                                   │
│                        └─> POST /api/payments/create-checkout-session   │
│                            └─> Redirection Stripe Checkout               │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. ADMIN VALIDATION                                                     │
│    app/admin/reservation-requests/page.tsx                              │
│    └─> Modal "Voir détails"                                             │
│        └─> Configuration pack (ajout extras depuis products)              │
│            └─> POST /api/admin/reservation-requests/approve            │
│                └─> Crée client_reservations (status: AWAITING_PAYMENT)   │
│                    └─> Génère token public checkout (V1.4)              │
│                        └─> Email client avec lien /checkout/[id]?token= │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. CLIENT → PAIEMENT (2 OPTIONS)                                        │
│                                                                          │
│ OPTION A: DASHBOARD USER                                                 │
│    app/dashboard/page.tsx                                                │
│    └─> Affiche réservations AWAITING_PAYMENT                            │
│        └─> Bouton "Payer maintenant"                                    │
│            └─> POST /api/payments/create-checkout-session               │
│                └─> Redirection Stripe Checkout                           │
│                                                                          │
│ OPTION B: CHECKOUT PUBLIC (V1.4)                                        │
│    app/checkout/[id]/page.tsx                                            │
│    └─> Validation token (hash + expiration)                             │
│        └─> Affiche récap réservation                                     │
│            └─> Bouton "Payer maintenant"                                │
│                └─> POST /api/payments/create-checkout-session             │
│                    └─> Redirection Stripe Checkout                        │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. STRIPE CHECKOUT                                                       │
│    └─> Paiement principal                                                │
│        └─> Si deposit_amount > 0                                        │
│            └─> Redirection automatique                                   │
│                └─> GET /api/payments/create-deposit-session              │
│                    └─> Session Stripe caution                            │
│                        └─> Paiement caution                               │
│                            └─> Retour /dashboard?deposit=success         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. WEBHOOK STRIPE                                                        │
│    app/api/webhooks/stripe/route.ts                                      │
│    └─> checkout.session.completed                                        │
│        └─> Met à jour client_reservations.status → 'PAID'                │
│            └─> Consomme le hold si hold_id présent (HOLD v1)             │
│                └─> checkout.session.expired                               │
│                    └─> Annule le hold si présent                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. DASHBOARD USER                                                        │
│    app/dashboard/page.tsx                                                │
│    └─> Affiche réservations PAID/CONFIRMED                               │
│        └─> Section "Réservations confirmées"                            │
│            └─> app/mes-reservations/page.tsx                             │
│                └─> Liste complète (combine reservations + client_reservations) │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 8. DASHBOARD ADMIN                                                       │
│    app/admin/page.tsx                                                    │
│    └─> Stats et réservations à venir                                     │
│        └─> app/admin/reservations/page.tsx                               │
│            └─> Liste complète (combine reservations + client_reservations) │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 FICHIERS PAR ÉTAPE (Liste Exhaustive)

### 🏠 ÉTAPE 0 : HOMEPAGE → CHAT

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/page.tsx` | Page d'accueil principale | Sections hero, IA, solutions, FAQ |
| `app/layout.tsx` | Layout global | Inclut FloatingChatWidget |
| `components/HeroSection.tsx` | Section hero avec CTA | Bouton "Demander un devis" |
| `components/FloatingChatWidget.tsx` | Widget chat flottant | Visible sur toutes les pages |
| `components/FloatingChatButton.tsx` | Bouton flottant | Ouvre le chat |
| `hooks/useChat.ts` | Hook React chat | Gère état (messages, loading, pack, etc.) |
| `lib/chatState.ts` | Logique état chat | Détection intention, mode pack, persistance |
| `types/chat.ts` | Types TypeScript | ChatMessage, DraftFinalConfig, ReservationRequestDraft, AvailabilityStatus |

---

### 💬 ÉTAPE 1 : CONVERSATION CHAT → VÉRIFICATION DISPONIBILITÉ

| Fichier | Rôle | Notes |
|---------|------|-------|
| `components/FloatingChatWidget.tsx` | Interface utilisateur | Collecte téléphone, affiche disponibilité (V1.2) |
| `hooks/useChat.ts` | État et logique | `availabilityStatus`, `availabilityDetails`, `checkAvailability()` |
| `app/api/chat/route.ts` | API IA (OpenAI/Anthropic) | Recommande packs, active mode pack |
| `app/api/availability/route.ts` | **V1.2** - Vérification disponibilité | Vérifie: `reservations` + `client_reservations` + `reservation_holds` |

**Fonctionnalités V1.2 (Availability Check) :**
- Appel automatique `/api/availability` quand dates/heures connues
- Affichage badge: "Vérification...", "✅ Disponible", "❌ Indisponible"
- Bloque envoi demande si indisponible

---

### 📤 ÉTAPE 2 : CRÉATION DEMANDE (2 FLUX)

#### FLUX A : DEMANDE NORMALE

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/api/reservation-requests/route.ts` | POST - Créer demande | Crée `reservation_requests` (status: NEW) |
| `lib/token.ts` | **V1.5** - Génération token | `generateTokenWithHash()` pour suivi public |
| `lib/reservation-email-templates.ts` | Templates emails | Email admin (nouvelle demande) |
| `lib/resend.ts` | Configuration Resend | Envoi emails |
| `components/FloatingChatWidget.tsx` | **V1.5** - Bouton suivi | Affiche "Suivre ma demande" après création |

**Fonctionnalités V1.5 (Public Tracking) :**
- Génère token public (hash SHA256) lors création demande
- Retourne `publicTrackingUrl` dans réponse API
- Bouton "Suivre ma demande" dans chat → ouvre `/suivi?rid=...&token=...`

#### FLUX B : INSTANT BOOKING (V1.3)

| Fichier | Rôle | Notes |
|---------|------|-------|
| `components/FloatingChatWidget.tsx` | **V1.3** - Éligibilité instant | `isInstantBookingEligible()` |
| `app/api/holds/route.ts` | **HOLD v1** - Création hold | POST: crée hold 10 min, vérifie conflits |
| `app/api/instant-reservations/route.ts` | **V1.3** - Réservation instant | Crée `client_reservations` directement |
| `app/api/payments/create-checkout-session/route.ts` | Session Stripe | Accepte `hold_id` optionnel |

**Fonctionnalités V1.3 (Instant Booking) :**
- Si disponible + simple → bouton "✅ Confirmer & payer"
- Crée hold avant réservation (évite double-booking)
- Crée `client_reservations` directement (status: AWAITING_PAYMENT)
- Redirige vers Stripe Checkout immédiatement

**Fonctionnalités HOLD v1 :**
- Blocage temporaire 10 minutes
- Vérifie conflits avec `client_reservations` + autres holds
- Consommé lors création réservation ou paiement Stripe

---

### 📋 ÉTAPE 3 : PAGE SUIVI PUBLIC (V1.5)

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/suivi/page.tsx` | **V1.5** - Page suivi publique | Validation token, affiche statut demande |
| `lib/token.ts` | Validation token | `verifyToken()` pour valider hash |

**Fonctionnalités V1.5 (Public Tracking) :**
- URL: `/suivi?rid=<request_id>&token=<token>`
- Validation serveur (hash + expiration)
- Affiche statut: NEW, PENDING_REVIEW, APPROVED, ADJUSTED, REJECTED
- Message paiement si APPROVED (lien email sera envoyé)

---

### 👨‍💼 ÉTAPE 4 : VALIDATION ADMIN

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/admin/reservation-requests/page.tsx` | Page admin principale | Liste demandes + modal détail |
| `app/admin/reservation-requests/[id]/page.tsx` | Page détail demande | Alternative page dédiée |
| `app/api/admin/reservation-requests/route.ts` | GET - Lister demandes | |
| `app/api/admin/reservation-requests/[id]/route.ts` | GET - Récupérer demande | |
| `lib/packs/basePacks.ts` | Définition packs | conference, soiree, mariage |
| `app/admin/reservation-requests/page.tsx` | Dialog Catalogue Pro | Ajout extras depuis table `products` |

**Modal "Voir détails" :**
- Section 1: Infos client (nom, email, téléphone)
- Section 2: Résumé événement
- Section 3: Contenu pack (base) [READ-ONLY]
- Section 4: Configuration finale [ÉDITABLE] - ajout extras
- Section 5: Analyse admin (toggles, notes)
- Section 6: Prix & décision
- Section 7: Actions (Valider / Ajuster / Refuser)

---

### ✅ ÉTAPE 5 : APPROBATION ADMIN

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/api/admin/reservation-requests/approve/route.ts` | POST - Valider | Crée `client_reservations` (status: AWAITING_PAYMENT) |
| `app/api/admin/reservation-requests/adjust/route.ts` | POST - Ajuster | Email client + crée `client_reservations` |
| `app/api/admin/reservation-requests/reject/route.ts` | POST - Refuser | Email client avec motif |
| `lib/reservation-email-templates.ts` | Templates emails | Accepté, ajusté, refusé |
| `lib/token.ts` | **V1.4** - Token checkout | Génère token public pour `/checkout/[id]` |

**Fonctionnalités V1.4 (Public Checkout) :**
- Génère token public (hash SHA256) lors création `client_reservations`
- Stocke `public_token_hash` et `public_token_expires_at` (7 jours)
- Email client avec lien `/checkout/<id>?token=<plaintext_token>`

---

### 📧 ÉTAPE 6 : EMAIL → DASHBOARD / CHECKOUT

#### OPTION A : DASHBOARD USER

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/dashboard/page.tsx` | Dashboard user principal | Affiche réservations AWAITING_PAYMENT |
| `app/signup/page.tsx` | Page inscription | Si client non inscrit |
| `app/auth/callback/route.ts` | Callback Supabase Auth | Rattache `client_reservations` via email |
| `components/auth/SignModal.tsx` | Modal connexion/inscription | |

**Rattachement automatique :**
- Après inscription → `auth/callback/route.ts`
- Met à jour `client_reservations.user_id` via `customer_email`

#### OPTION B : CHECKOUT PUBLIC (V1.4)

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/checkout/[id]/page.tsx` | **V1.4** - Page checkout publique | Validation token, affiche récap |
| `app/checkout/[id]/CheckoutButton.tsx` | **V1.4** - Bouton paiement | Client component pour Stripe |

**Fonctionnalités V1.4 (Public Checkout) :**
- URL: `/checkout/<reservation_id>?token=<token>`
- Validation serveur (hash + expiration)
- Affiche récap réservation (pack, dates, prix, matériel)
- Bouton "Payer maintenant" → Stripe Checkout

---

### 💳 ÉTAPE 7 : PAIEMENT STRIPE

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/api/payments/create-checkout-session/route.ts` | POST - Session principale | Crée session Stripe, inclut `hold_id` si présent |
| `app/api/payments/create-deposit-session/route.ts` | GET - Session caution | Crée session caution après paiement principal |
| `app/api/payments/verify-session/route.ts` | GET - Vérifier statut | Fallback si webhook échoue |
| `app/api/webhooks/stripe/route.ts` | POST - Webhook Stripe | Met à jour statut, consomme hold (HOLD v1) |

**Flux de paiement :**
1. Paiement principal → Stripe Checkout
2. Si `deposit_amount > 0` → redirection automatique vers `/api/payments/create-deposit-session`
3. Session caution → Stripe Checkout (capture_method: manual)
4. Retour `/dashboard?deposit=success`

**Fonctionnalités HOLD v1 (Webhook) :**
- `checkout.session.completed` → consomme hold (status: CONSUMED)
- `checkout.session.expired` → annule hold (status: CANCELLED)
- `metadata.hold_id` passé dans session Stripe

---

### ✅ ÉTAPE 8 : RÉSERVATION PAYÉE → DASHBOARD USER

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/dashboard/page.tsx` | Dashboard user | Affiche réservations PAID/CONFIRMED |
| `app/mes-reservations/page.tsx` | Liste réservations | Combine `reservations` + `client_reservations` |
| `app/mes-reservations/[id]/page.tsx` | Détail réservation | |

**Sections dashboard user :**
- Message succès paiement (si `payment=success`)
- Réservations en attente de paiement (AWAITING_PAYMENT)
- Réservations confirmées (PAID/CONFIRMED)
- Prochaine réservation (card gradient rouge)
- Réservations à venir

---

### 👨‍💼 ÉTAPE 9 : DASHBOARD ADMIN

| Fichier | Rôle | Notes |
|---------|------|-------|
| `app/admin/page.tsx` | Dashboard admin principal | Stats, réservations à venir |
| `app/admin/reservations/page.tsx` | Liste réservations admin | Combine `reservations` + `client_reservations` |
| `app/admin/reservations/[id]/page.tsx` | Détail réservation admin | |
| `components/AdminSidebar.tsx` | Sidebar admin | Navigation |

**Sections dashboard admin :**
- Statistiques (réservations à venir, CA mois)
- Réservations à venir (30 jours)
- Actions rapides

---

## 🗄️ TABLES SUPABASE (Structure Complète)

### Table: `reservation_requests`

**Migration :** `supabase/migrations/20250101000000_create_reservation_requests_tables.sql`  
**Modifications :** `supabase/migrations/20250103000002_add_public_token_to_reservation_requests.sql` (V1.5)

```sql
CREATE TABLE reservation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_key text NOT NULL CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'PENDING_REVIEW', 'APPROVED', 'ADJUSTED', 'REJECTED')),
  customer_email text NOT NULL,
  customer_phone text,
  customer_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason text,
  public_token_hash text,                    -- V1.5 - Hash token suivi public
  public_token_expires_at timestamptz,       -- V1.5 - Expiration token
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Index :**
- `idx_reservation_requests_status`
- `idx_reservation_requests_customer_email`
- `idx_reservation_requests_created_at`
- `idx_reservation_requests_token_hash` (V1.5)
- `idx_reservation_requests_token_expires` (V1.5)

**RLS Policies :**
```sql
-- Policy: Les utilisateurs peuvent voir leurs propres demandes (via email)
CREATE POLICY "Users can view their own reservation requests"
  ON reservation_requests
  FOR SELECT
  USING (auth.email() = customer_email);
```

---

### Table: `client_reservations`

**Migration initiale :** `supabase/migrations/20250101000000_create_reservation_requests_tables.sql`  
**Modifications :**
- `supabase/migrations/20250102000000_add_final_items_to_client_reservations.sql` (final_items, customer_summary)
- `supabase/migrations/20250102000001_add_pricing_fields_to_client_reservations.sql` (base_pack_price, extras_total)
- `supabase/migrations/20250103000001_add_public_token_to_client_reservations.sql` (V1.4 - token checkout)

```sql
CREATE TABLE client_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES reservation_requests(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  pack_key text NOT NULL CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text NOT NULL DEFAULT 'AWAITING_PAYMENT' CHECK (status IN ('AWAITING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED')),
  price_total numeric NOT NULL CHECK (price_total >= 0),
  deposit_amount numeric NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  base_pack_price numeric DEFAULT 0 CHECK (base_pack_price >= 0),  -- V1.2
  extras_total numeric DEFAULT 0 CHECK (extras_total >= 0),         -- V1.2
  final_items jsonb DEFAULT '[]'::jsonb,                           -- V1.2
  customer_summary text,                                            -- V1.2
  start_at timestamptz,
  end_at timestamptz,
  address text,
  notes text,
  stripe_session_id text,
  public_token_hash text,                    -- V1.4 - Hash token checkout public
  public_token_expires_at timestamptz,       -- V1.4 - Expiration token
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Index :**
- `idx_client_reservations_user_id`
- `idx_client_reservations_customer_email`
- `idx_client_reservations_status`
- `idx_client_reservations_request_id`
- `idx_client_reservations_stripe_session_id`
- `idx_client_reservations_token_hash` (V1.4)
- `idx_client_reservations_token_expires` (V1.4)

**RLS Policies :**
```sql
-- Policy: Les utilisateurs peuvent voir leurs propres réservations (via user_id ou email)
CREATE POLICY "Users can view their own client reservations"
  ON client_reservations
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.email() = customer_email
  );
```

---

### Table: `reservation_holds` (HOLD v1)

**Migration :** `supabase/migrations/20250103000000_create_reservation_holds.sql`

```sql
CREATE TABLE reservation_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,           -- Date expiration (now() + 10 minutes)
  start_at timestamptz NOT NULL,             -- Date/heure début créneau
  end_at timestamptz NOT NULL,               -- Date/heure fin créneau
  pack_key text NOT NULL CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONSUMED', 'CANCELLED', 'EXPIRED')),
  reservation_id uuid REFERENCES client_reservations(id) ON DELETE SET NULL,
  contact_phone text,
  contact_email text,
  source text NOT NULL DEFAULT 'chat' CHECK (source IN ('chat', 'pack_page', 'admin')),
  updated_at timestamptz DEFAULT now()
);
```

**Index :**
- `idx_reservation_holds_status_expires` (status, expires_at) WHERE status = 'ACTIVE'
- `idx_reservation_holds_dates` (start_at, end_at)
- `idx_reservation_holds_pack_key`
- `idx_reservation_holds_reservation_id` WHERE reservation_id IS NOT NULL

**RLS :**
- **Aucune RLS activée** (MVP - accès uniquement via API routes avec service role)

---

### Table: `reservations` (Ancienne table - Compatibilité)

**Utilisée pour :**
- Compatibilité avec ancien système
- Affichage dans dashboard user/admin (combine avec `client_reservations`)

---

### Table: `products`

**Utilisée pour :**
- Catalogue admin
- Ajout d'extras dans modal "Voir détails"
- Calcul prix extras

---

## 🔌 API ROUTES (Liste Complète)

### Chat & Disponibilité

| Route | Méthode | Fichier | Description |
|-------|---------|---------|-------------|
| `/api/chat` | POST | `app/api/chat/route.ts` | API IA (OpenAI/Anthropic) |
| `/api/availability` | GET/POST | `app/api/availability/route.ts` | **V1.2** - Vérification disponibilité |

### Demandes de Réservation

| Route | Méthode | Fichier | Description |
|-------|---------|---------|-------------|
| `/api/reservation-requests` | POST | `app/api/reservation-requests/route.ts` | Créer demande (retourne `publicTrackingUrl` V1.5) |

### Instant Booking & Holds

| Route | Méthode | Fichier | Description |
|-------|---------|---------|-------------|
| `/api/holds` | POST | `app/api/holds/route.ts` | **HOLD v1** - Créer hold (10 min) |
| `/api/holds` | PATCH | `app/api/holds/route.ts` | **HOLD v1** - Consommer hold |
| `/api/instant-reservations` | POST | `app/api/instant-reservations/route.ts` | **V1.3** - Créer réservation instant |

### Admin - Demandes

| Route | Méthode | Fichier | Description |
|-------|---------|---------|-------------|
| `/api/admin/reservation-requests` | GET | `app/api/admin/reservation-requests/route.ts` | Lister demandes |
| `/api/admin/reservation-requests/[id]` | GET | `app/api/admin/reservation-requests/[id]/route.ts` | Récupérer demande |
| `/api/admin/reservation-requests/approve` | POST | `app/api/admin/reservation-requests/approve/route.ts` | Valider demande (génère token checkout V1.4) |
| `/api/admin/reservation-requests/adjust` | POST | `app/api/admin/reservation-requests/adjust/route.ts` | Ajuster demande |
| `/api/admin/reservation-requests/reject` | POST | `app/api/admin/reservation-requests/reject/route.ts` | Refuser demande |

### Paiement

| Route | Méthode | Fichier | Description |
|-------|---------|---------|-------------|
| `/api/payments/create-checkout-session` | POST | `app/api/payments/create-checkout-session/route.ts` | Session Stripe principale (accepte `hold_id`) |
| `/api/payments/create-deposit-session` | GET | `app/api/payments/create-deposit-session/route.ts` | Session Stripe caution |
| `/api/payments/verify-session` | GET | `app/api/payments/verify-session/route.ts` | Vérifier statut Stripe (fallback) |

### Webhooks

| Route | Méthode | Fichier | Description |
|-------|---------|---------|-------------|
| `/api/webhooks/stripe` | POST | `app/api/webhooks/stripe/route.ts` | Webhook Stripe (consomme hold HOLD v1) |

### Pages Publiques

| Route | Type | Fichier | Description |
|-------|------|---------|-------------|
| `/suivi` | Page | `app/suivi/page.tsx` | **V1.5** - Suivi demande publique |
| `/checkout/[id]` | Page | `app/checkout/[id]/page.tsx` | **V1.4** - Checkout public |

---

## 🔐 SÉCURITÉ & RLS

### RLS Policies Actives

**`reservation_requests` :**
- ✅ RLS activé
- ✅ Policy SELECT: `auth.email() = customer_email`
- ❌ Pas de policy INSERT/UPDATE (géré via API routes service role)

**`client_reservations` :**
- ✅ RLS activé
- ✅ Policy SELECT: `auth.uid() = user_id OR auth.email() = customer_email`
- ❌ Pas de policy INSERT/UPDATE (géré via API routes service role)

**`reservation_holds` :**
- ❌ RLS désactivé (MVP - accès uniquement via API routes service role)

### Tokens Publics (V1.4, V1.5)

**Sécurité :**
- Token plaintext généré côté serveur (32 bytes, base64url)
- Hash SHA256 stocké en DB (jamais le plaintext)
- Expiration: 7 jours
- Validation serveur uniquement (pas de client-side)

**Tables avec tokens :**
- `reservation_requests.public_token_hash` (V1.5 - suivi)
- `client_reservations.public_token_hash` (V1.4 - checkout)

---

## 📊 STATUTS & TRANSITIONS

### `reservation_requests.status`

| Statut | Description | Transition |
|--------|-------------|------------|
| `NEW` | Création initiale | → `PENDING_REVIEW` |
| `PENDING_REVIEW` | En cours traitement admin | → `APPROVED` / `ADJUSTED` / `REJECTED` |
| `APPROVED` | Validée | Crée `client_reservations` |
| `ADJUSTED` | Ajustée | Crée `client_reservations` avec ajustements |
| `REJECTED` | Refusée | Fin du flow |

### `client_reservations.status`

| Statut | Description | Transition |
|--------|-------------|------------|
| `AWAITING_PAYMENT` | Créée après validation admin | → `PAID` |
| `PAID` | Après paiement Stripe | → `CONFIRMED` (optionnel) |
| `CONFIRMED` | Confirmée | Fin du flow |
| `CANCELLED` | Annulée | Fin du flow |

### `reservation_holds.status` (HOLD v1)

| Statut | Description | Transition |
|--------|-------------|------------|
| `ACTIVE` | Hold actif (10 min) | → `CONSUMED` / `CANCELLED` / `EXPIRED` |
| `CONSUMED` | Lié à une réservation | Fin du flow |
| `CANCELLED` | Annulé (paiement abandonné) | Fin du flow |
| `EXPIRED` | Expiré (10 min écoulées) | Fin du flow |

---

## 🎯 FONCTIONNALITÉS PAR VERSION

### V1.2 - Availability Check
- ✅ Vérification disponibilité réelle dans chat
- ✅ Appel automatique `/api/availability` quand dates/heures connues
- ✅ Affichage badge disponibilité
- ✅ Blocage envoi demande si indisponible

### V1.3 - Instant Booking
- ✅ Détection éligibilité instant booking
- ✅ Bouton "Confirmer & payer" si éligible
- ✅ Création directe `client_reservations`
- ✅ Redirection Stripe immédiate

### HOLD v1 - Blocage Temporaire
- ✅ Création hold 10 minutes avant réservation
- ✅ Vérification conflits (holds + réservations)
- ✅ Consommation hold via webhook Stripe
- ✅ Annulation hold si paiement abandonné

### V1.4 - Public Checkout
- ✅ Page checkout publique `/checkout/[id]`
- ✅ Token sécurisé (hash + expiration)
- ✅ Lien email direct vers checkout
- ✅ Pas besoin de compte pour payer

### V1.5 - Public Tracking
- ✅ Page suivi publique `/suivi`
- ✅ Token sécurisé (hash + expiration)
- ✅ Bouton "Suivre ma demande" dans chat
- ✅ Affichage statut demande en temps réel

---

## 📧 EMAILS

### Templates (`lib/reservation-email-templates.ts`)

| Template | Destinataire | Déclencheur | Lien inclus |
|----------|--------------|-------------|-------------|
| `getNewRequestEmailTemplate()` | Admin | Création demande | Lien admin |
| `getAcceptedEmailTemplate()` | Client | Approbation admin | **V1.4** - `/checkout/[id]?token=...` |
| `getAdjustedEmailTemplate()` | Client | Ajustement admin | **V1.4** - `/checkout/[id]?token=...` |
| `getRejectedEmailTemplate()` | Client | Refus admin | - |

**Configuration :**
- Resend: `lib/resend.ts`
- From: `onboarding@resend.dev` (à configurer)

---

## 💳 STRIPE

### Sessions

**1. Paiement principal :**
- Mode: `payment`
- Line items: Pack de base + extras
- Success URL: `/api/payments/create-deposit-session` (si caution) ou `/dashboard?payment=success`
- Metadata: `type: 'client_reservation'`, `reservation_id`, `hold_id` (si présent)

**2. Caution :**
- Mode: `payment`
- Capture method: `manual` (autorisation sans débit)
- Success URL: `/dashboard?deposit=success`

### Webhook (`app/api/webhooks/stripe/route.ts`)

**Événements :**
- `checkout.session.completed` → Met à jour `client_reservations.status` → `PAID`, consomme hold si `hold_id`
- `checkout.session.expired` → Annule hold si `hold_id`

**Fallback :**
- `/api/payments/verify-session` si webhook échoue

---

## 🎨 COMPOSANTS UI

### Shadcn UI Utilisés

| Composant | Usage |
|-----------|-------|
| `Button` | Boutons actions |
| `Card`, `CardHeader`, `CardContent`, `CardTitle` | Cards |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` | Modals |
| `Input` | Champs texte |
| `Textarea` | Zones de texte |
| `Badge` | Badges statut |
| `Separator` | Séparateurs |
| `Switch` | Toggles |
| `Label` | Labels |
| `ScrollArea` | Zones scrollables |
| `DropdownMenu` | Menus déroulants |

### Design

- Couleur principale: `#F2431E` (rouge Soundrush)
- Cards avec bordures colorées selon statut
- Messages succès: fond vert
- Alertes: fond orange/rouge
- Responsive mobile-first

---

## 🔗 LIENS ENTRE FICHIERS (Graphe)

```
Homepage (app/page.tsx)
  └─> FloatingChatWidget (components/FloatingChatWidget.tsx)
      └─> useChat (hooks/useChat.ts)
          └─> chatState (lib/chatState.ts)
              └─> /api/chat (app/api/chat/route.ts)
                  └─> Mode pack activé
                      ├─> /api/availability (app/api/availability/route.ts) [V1.2]
                      │   └─> Vérifie: reservations + client_reservations + holds
                      │
                      ├─> FLUX A: Demande normale
                      │   └─> /api/reservation-requests (app/api/reservation-requests/route.ts)
                      │       └─> Génère token (lib/token.ts) [V1.5]
                      │           └─> Retourne publicTrackingUrl
                      │               └─> Bouton "Suivre ma demande"
                      │                   └─> /suivi (app/suivi/page.tsx) [V1.5]
                      │
                      └─> FLUX B: Instant booking [V1.3]
                          └─> /api/holds (app/api/holds/route.ts) [HOLD v1]
                              └─> /api/instant-reservations (app/api/instant-reservations/route.ts)
                                  └─> /api/payments/create-checkout-session
                                      └─> Stripe Checkout

Admin (app/admin/reservation-requests/page.tsx)
  └─> Modal "Voir détails"
      └─> Configuration pack (lib/packs/basePacks.ts)
          └─> /api/admin/reservation-requests/approve (app/api/admin/reservation-requests/approve/route.ts)
              └─> Crée client_reservations
                  └─> Génère token checkout (lib/token.ts) [V1.4]
                      └─> Email client (lib/reservation-email-templates.ts)
                          └─> Lien /checkout/[id]?token=... [V1.4]

Client → Paiement
  ├─> OPTION A: Dashboard (app/dashboard/page.tsx)
  │   └─> /api/payments/create-checkout-session
  │
  └─> OPTION B: Checkout public (app/checkout/[id]/page.tsx) [V1.4]
      └─> Validation token (lib/token.ts)
          └─> /api/payments/create-checkout-session
              └─> Stripe Checkout
                  └─> /api/payments/create-deposit-session (si caution)
                      └─> Stripe Checkout caution
                          └─> /api/webhooks/stripe (app/api/webhooks/stripe/route.ts)
                              └─> Met à jour client_reservations.status → PAID
                                  └─> Consomme hold si présent [HOLD v1]
                                      └─> Dashboard user (app/dashboard/page.tsx)
                                          └─> Affiche réservations PAID
```

---

## 📝 NOTES IMPORTANTES

1. **Compatibilité ancien système :**
   - Table `reservations` toujours utilisée
   - Dashboard combine `reservations` + `client_reservations`

2. **Packs de base :**
   - Définis dans `lib/packs/basePacks.ts`
   - Prix fixes: conference, soiree, mariage
   - Items par défaut pour chaque pack

3. **Extras :**
   - Ajoutés depuis table `products`
   - Calcul automatique: `base_pack_price + extras_total = price_total`

4. **Caution :**
   - Fixée à 30% du total: `deposit_amount = price_total * 0.3`
   - Paiement automatique après paiement principal

5. **Tokens publics :**
   - Jamais stockés en clair en DB
   - Hash SHA256 uniquement
   - Expiration: 7 jours
   - Validation serveur uniquement

6. **Holds :**
   - Blocage 10 minutes
   - Vérifie conflits avec réservations + autres holds
   - Consommé via webhook Stripe ou création réservation

---

## 🐛 DÉBOGAGE

### Logs Importants

- `✅ Demande de réservation créée:` - Création demande
- `✅ Réservation instant créée:` - Instant booking
- `✅ Hold créé:` - Création hold
- `✅ Hold consommé:` - Consommation hold
- `📊 Client reservations chargées:` - Chargement réservations
- `✅ Paiement confirmé` - Webhook Stripe
- `❌ Erreur` - Erreurs diverses

### Points de Vérification

1. **Webhook Stripe :** Vérifier logs dans Supabase
2. **Statut réservation :** Vérifier dans `client_reservations` table
3. **Emails :** Vérifier logs Resend
4. **Rattachement :** Vérifier que `user_id` est rempli après inscription
5. **Holds :** Vérifier `reservation_holds` pour conflits
6. **Tokens :** Vérifier hash et expiration dans DB

---

## 📚 RÉFÉRENCES

- **Documentation originale :** `FLUX_COMPLET_RESERVATION.md`
- **Documentation pro :** `FLOW_COMPLET_PRO.md`
- **Corrections chat :** `CORRECTIF_CHAT_STATE.md`
- **Corrections packs :** `CORRECTIF_MODE_PACK.md`
- **Sécurité admin/pro :** `SECURISATION_ADMIN_PRO.md`
- **RLS Supabase :** `SUPABASE_RLS_PRO.md`

---

**Fin de la documentation**

