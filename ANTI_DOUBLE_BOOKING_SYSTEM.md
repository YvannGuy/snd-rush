# Système Anti-Double-Booking avec Holds Stripe

## Vue d'ensemble

Ce système garantit qu'aucun créneau ne peut être réservé deux fois, même en cas de clics simultanés, grâce à une fonction PostgreSQL atomique utilisant `pg_advisory_xact_lock`.

## Architecture

### 1. Fonction PostgreSQL Atomique (`create_hold_for_checkout`)

**Fichier:** `supabase/migrations/20250106000000_create_atomic_hold_function.sql`

**Fonctionnalités:**
- Utilise `pg_advisory_xact_lock` pour sérialiser les vérifications de chevauchement par pack/jour
- Vérifie les conflits avec:
  - `reservation_holds` (status='ACTIVE' et non expirés)
  - `client_reservations` (status IN ('AWAITING_BALANCE', 'PAID', 'CONFIRMED'))
- Crée atomiquement:
  - Une réservation avec status='AWAITING_PAYMENT' (ne bloque PAS la disponibilité)
  - Un hold avec status='ACTIVE' et expiration dans 10 minutes
- Retourne `{ok: true, hold_id, reservation_id}` ou `{ok: false, reason}`

**Important:** `AWAITING_PAYMENT` ne bloque PAS la disponibilité. Seuls `AWAITING_BALANCE`, `PAID`, et `CONFIRMED` bloquent.

### 2. API Direct Checkout (`/api/book/direct-checkout`)

**Fichier:** `app/api/book/direct-checkout/route.ts`

**Flow:**
1. Reçoit les données de réservation (pack_key, dates, prix, email, etc.)
2. Appelle la fonction RPC `create_hold_for_checkout` (atomique)
3. Si succès → Crée une session Stripe Checkout avec metadata (hold_id, reservation_id)
4. Si échec → Retourne 409 avec reason ('SLOT_HELD' ou 'SLOT_BOOKED')
5. Met à jour `client_reservations.stripe_session_id`

**Idempotency:** Vérifie si une session Stripe existe déjà pour la réservation avant d'en créer une nouvelle.

### 3. Webhook Stripe (`/api/webhooks/stripe`)

**Fichier:** `app/api/webhooks/stripe/route.ts`

**Événements gérés:**

#### `checkout.session.completed`
- Consomme le hold (status='CONSUMED')
- Met à jour la réservation:
  - status='AWAITING_BALANCE'
  - deposit_paid_at=now()
  - stripe_session_id=session.id
  - customer_email (depuis Stripe si non défini)

#### `checkout.session.expired`
- Marque le hold comme 'EXPIRED' (seulement si encore ACTIVE)
- Optionnel: Annule les réservations AWAITING_PAYMENT > 12h

### 4. Vérification Disponibilité (`/api/availability`)

**Fichier:** `app/api/availability/route.ts`

**Statuts bloquants:**
- `reservation_holds`: status='ACTIVE' ET expires_at > now()
- `client_reservations`: status IN ('AWAITING_BALANCE', 'PAID', 'CONFIRMED')

**Important:** `AWAITING_PAYMENT` est EXCLU des vérifications de disponibilité.

### 5. Frontend (`/app/book/[pack_key]/BookPageContent.tsx`)

**Comportement:**
- Le hold n'est créé QUE lorsque l'utilisateur clique sur "Payer l'acompte"
- Envoie tous les paramètres nécessaires à l'API (price_total, deposit_amount, balance_amount, etc.)
- Gère les erreurs 409 avec messages clairs (SLOT_HELD vs SLOT_BOOKED)
- Récupère l'email depuis Supabase auth si disponible, sinon depuis Stripe

## Statuts et Transitions

### `reservation_holds.status`
- `ACTIVE` → Bloque le créneau (10 minutes)
- `CONSUMED` → Hold consommé après paiement réussi
- `EXPIRED` → Hold expiré (après 10 minutes ou session Stripe expirée)
- `CANCELLED` → Hold annulé manuellement

### `client_reservations.status`
- `AWAITING_PAYMENT` → Réservation créée, en attente de paiement acompte (NE BLOQUE PAS)
- `AWAITING_BALANCE` → Acompte payé, en attente du solde (BLOQUE)
- `PAID` → Totalement payé (BLOQUE)
- `CONFIRMED` → Réservation confirmée (BLOQUE)
- `CANCELLED` → Réservation annulée

## Garanties

1. **Atomicité:** La fonction PostgreSQL garantit qu'une seule réservation peut être créée pour un créneau donné, même avec 100 clics simultanés.

2. **Pas de hold avant Stripe:** Le hold n'est créé QUE au clic sur "Payer l'acompte", pas avant.

3. **Expiration automatique:** Les holds expirent après 10 minutes ou si la session Stripe expire.

4. **AWAITING_PAYMENT ne bloque pas:** Les réservations en attente de paiement ne bloquent pas la disponibilité, permettant à d'autres utilisateurs de réserver le même créneau si le premier abandonne.

5. **Source de vérité:** Les webhooks Stripe sont la source de vérité pour les transitions de statut.

## Nettoyage (Optionnel)

**Fichier:** `supabase/functions/cleanup-expired-holds/index.ts`

**Fonctionnalités:**
- Marque les holds ACTIVE expirés comme EXPIRED
- Annule les réservations AWAITING_PAYMENT > 12h

**Déploiement:**
- Peut être appelé manuellement via API
- Peut être configuré comme cron job Supabase (toutes les heures)

## Variables d'environnement requises

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL` ou `NEXT_PUBLIC_BASE_URL`

## Migration

Pour appliquer la migration:
```bash
# Via Supabase CLI
supabase migration up

# Ou via MCP tools
```

## Tests recommandés

1. **Test race condition:** Simuler 10 requêtes simultanées pour le même créneau → Une seule doit réussir
2. **Test expiration:** Créer un hold et attendre 10 minutes → Doit être marqué EXPIRED
3. **Test webhook:** Payer via Stripe → Hold doit être CONSUMED, réservation doit être AWAITING_BALANCE
4. **Test abandon:** Créer un hold et fermer Stripe → Hold doit expirer, créneau doit redevenir disponible
