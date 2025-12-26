# Flow Complet : Réservation Directe "Solution Clé en Main"

## 📋 Vue d'ensemble

Ce document décrit le flow complet depuis le clic sur "Réserver maintenant" sur une des 3 cartes de la homepage jusqu'après le paiement de l'acompte.

---

## 🎯 ÉTAPE 1 : Homepage - Clic sur "Réserver maintenant"

**Fichier :** `components/SolutionsSection.tsx`

**Action utilisateur :**
- Client clique sur le bouton "Réserver maintenant" sur une des 3 cartes :
  - Solution Conférence
  - Solution Soirée  
  - Solution Mariage

**Code exécuté :**
```typescript
handleReservationRequest(packKey) {
  router.push(`/book/${packKey}`);
}
```

**Résultat :**
- Redirection vers `/book/conference`, `/book/soiree` ou `/book/mariage`

---

## 🎯 ÉTAPE 2 : Page de Réservation - Wizard 5 Étapes

**Fichier :** `app/book/[pack_key]/BookPageContent.tsx`

### Étape 2.1 : Affichage du Wizard

Le client voit un wizard avec 5 étapes :

1. **Présentation du Pack** (Step 1)
   - Description du pack
   - Matériel inclus
   - Services inclus
   - Prix de base

2. **Dates et Horaires** (Step 2) - **OBLIGATOIRE**
   - Date de début
   - Heure de début
   - Date de fin
   - Heure de fin

3. **Localisation** (Step 3) - **OBLIGATOIRE**
   - Ville (avec auto-complétion API Adresse)
   - Code postal (avec auto-complétion)
   - Message J+1 si `endTime >= 02:00` (récupération le lendemain)

4. **Nombre de Personnes** (Step 4) - **OBLIGATOIRE**
   - Input nombre de personnes
   - Ajustement automatique du pack (S/M/L) selon le nombre
   - Affichage du pack ajusté (matériel + prix)
   - Option micros supplémentaires (M et L uniquement)

5. **Récapitulatif** (Step 5)
   - Vérification disponibilité automatique
   - Détails de la réservation
   - Prix détaillé (pack + livraison + installation + J+1)
   - Acompte 30%
   - Solde J-5
   - Caution J-2

### Étape 2.2 : Calculs Automatiques

**Fichiers :** `lib/pack-tier-logic.ts`, `lib/zone-detection.ts`, `lib/pack-options.ts`, `lib/time-rules.ts`

**Calculs effectués :**
- **Pack Tier** : S/M/L selon nombre de personnes
- **Prix ajusté** : Prix de base selon tier
- **Livraison** : 0€ (Paris), 60€ (Petite couronne), 90€ (Grande couronne)
- **Installation** : Automatique pour M (+59€) et L (+89€)
- **Récupération J+1** : Automatique si `endTime >= 02:00` (+45€ Paris, +70€ Petite, +110€ Grande)
- **Micros supplémentaires** : +10€ filaire, +20€ sans-fil (M et L uniquement)

**Prix total calculé :**
```
Prix total = Prix pack ajusté + Livraison + Installation + J+1 + Micros supplémentaires
Acompte = Prix total × 30%
Solde = Prix total - Acompte
```

### Étape 2.3 : Vérification Disponibilité

**Fichier :** `app/api/availability/route.ts`

**Vérifications :**
- Holds actifs (`status='ACTIVE'` et `expires_at > now()`)
- Réservations bloquantes (`status IN ('AWAITING_BALANCE', 'PAID', 'CONFIRMED')`)
- **IMPORTANT** : `AWAITING_PAYMENT` ne bloque PAS la disponibilité

**Résultat :**
- `available` : Créneau disponible → Bouton "Payer l'acompte" activé
- `unavailable` : Créneau occupé → Message d'erreur

---

## 🎯 ÉTAPE 3 : Clic sur "Payer l'acompte (30%)"

**Fichier :** `app/book/[pack_key]/BookPageContent.tsx` → `handlePayDeposit()`

### Étape 3.1 : Préparation des Données

**Données collectées :**
```typescript
{
  pack_key: 'conference' | 'soiree' | 'mariage',
  start_at: ISO string (date + heure début),
  end_at: ISO string (date + heure fin),
  customer_email: email depuis auth ou 'pending@stripe.com',
  price_total: nombre calculé,
  deposit_amount: nombre (30%),
  balance_amount: nombre (70%),
  city: string,
  postal_code: string,
  final_items: jsonb (matériel inclus),
  source: 'direct_solution'
}
```

### Étape 3.2 : Appel API Direct Checkout

**Fichier :** `app/api/book/direct-checkout/route.ts`

**POST** `/api/book/direct-checkout`

**Ce qui se passe côté serveur :**

1. **Validation des paramètres**
   - Vérification `pack_key`, dates, prix, email

2. **Appel fonction PostgreSQL atomique** ⚡
   ```sql
   SELECT create_hold_for_checkout(...)
   ```
   
   **Cette fonction fait :**
   - Acquiert un lock transactionnel (`pg_advisory_xact_lock`) basé sur `pack_key + jour`
   - Vérifie les chevauchements avec holds actifs
   - Vérifie les chevauchements avec réservations bloquantes
   - **Si conflit** → Retourne `{ok: false, reason: 'SLOT_HELD' ou 'SLOT_BOOKED'}`
   - **Si OK** → Crée atomiquement :
     - `client_reservations` avec `status='AWAITING_PAYMENT'`
     - `reservation_holds` avec `status='ACTIVE'`, `expires_at = now() + 10 minutes`

3. **Création session Stripe Checkout**
   - Mode : `payment`
   - Montant : `deposit_amount` (30%)
   - Expiration : 10 minutes (alignée avec le hold)
   - Metadata :
     ```json
     {
       "type": "client_reservation_deposit",
       "flow": "direct_solution",
       "pack_key": "...",
       "hold_id": "...",
       "reservation_id": "...",
       "price_total": "...",
       "deposit_amount": "..."
     }
     ```
   - Success URL : `/book/success?reservation_id={id}`
   - Cancel URL : `/book/{pack_key}?cancelled=true`

4. **Mise à jour réservation**
   - `stripe_session_id` = session.id

**Réponse API :**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "reservation_id": "uuid",
  "hold_id": "uuid"
}
```

### Étape 3.3 : Redirection vers Stripe

**Frontend :**
```typescript
window.location.href = data.checkout_url;
```

**Résultat :**
- Client redirigé vers Stripe Checkout
- Hold actif pendant 10 minutes (bloque le créneau)

---

## 🎯 ÉTAPE 4 : Paiement Stripe

**Stripe Checkout :**
- Client saisit ses informations de paiement
- Stripe traite le paiement
- Deux scénarios possibles :

### Scénario A : Paiement Réussi ✅

**Stripe envoie webhook :** `checkout.session.completed`

### Scénario B : Paiement Abandonné ❌

**Stripe envoie webhook :** `checkout.session.expired` (après 10 minutes)

---

## 🎯 ÉTAPE 5 : Webhook Stripe - Paiement Réussi

**Fichier :** `app/api/webhooks/stripe/route.ts`

**Événement :** `checkout.session.completed`

**Métadonnées détectées :**
- `type: 'client_reservation_deposit'`
- `flow: 'direct_solution'`

### Actions Webhook :

1. **Vérification réservation**
   - Récupère `client_reservations` avec `id = reservation_id`
   - Vérifie que `status = 'AWAITING_PAYMENT'`

2. **Mise à jour réservation**
   ```typescript
   {
     status: 'AWAITING_BALANCE',  // Nouveau statut
     stripe_session_id: session.id,
     deposit_paid_at: now(),
     customer_email: email depuis Stripe (si manquant)
   }
   ```

3. **Consommation du hold**
   ```typescript
   reservation_holds.update({
     status: 'CONSUMED',
     reservation_id: reservation_id
   })
   WHERE id = hold_id AND status = 'ACTIVE'
   ```

4. **Création Order** (pour historique)
   - Crée un `orders` avec :
     - `client_reservation_id` = reservation_id
     - `status = 'PAID'`
     - `total = deposit_amount`
     - `metadata.type = 'client_reservation_deposit'`

5. **Génération documents** (si configuré)
   - Facture d'acompte
   - Contrat (non signé)

**Résultat :**
- Réservation passe de `AWAITING_PAYMENT` → `AWAITING_BALANCE`
- Hold consommé (créneau définitivement bloqué)
- Order créé pour historique
- Documents générés

---

## 🎯 ÉTAPE 6 : Redirection Post-Paiement - Page de Succès

**Stripe redirige vers :**
```
/book/success?reservation_id={id}
```

**Fichier :** `app/book/success/page.tsx`

### Étape 6.1 : Récupération des Données (Sans Authentification)

**API Route :** `/api/reservations/public/[id]`

**Fichier :** `app/api/reservations/public/[id]/route.ts`

**Fonctionnalité :**
- Récupère les données publiques de la réservation sans authentification requise
- Utilise `supabaseAdmin` (service role) pour bypass RLS
- Retourne uniquement les données publiques (pas de données sensibles)

### Étape 6.2 : Polling du Statut

**Code exécuté :**
```typescript
useEffect(() => {
  // Récupération via API publique toutes les 2 secondes (max 15 tentatives)
  fetchReservation();
}, [reservationId]);
```

**Vérification :**
- Récupère `client_reservations.status` via API publique
- Attend que `status = 'AWAITING_BALANCE'` (mis à jour par le webhook)
- Une fois confirmé → Affiche les détails complets

### Étape 6.3 : Affichage Page de Succès

**Contenu affiché :**
- ✅ Message de succès avec icône
- ✅ Détails de la réservation :
  - Pack sélectionné
  - Dates et horaires
  - Lieu (si fourni)
  - Montant total, acompte payé, solde restant
- ✅ Prochaines étapes :
  - Email de confirmation envoyé
  - Solde à payer J-5
  - Caution à payer J-2
- ✅ Option création de compte (si non connecté)
- ✅ Bouton "Voir mon dashboard" (si connecté)
- ✅ Informations de contact

**Avantages :**
- ✅ **Pas de connexion requise** : Le client voit immédiatement sa réservation
- ✅ **Expérience fluide** : Pas de friction avec modal de connexion
- ✅ **Optionnel** : Le client peut créer un compte quand il le souhaite

---

## 🎯 ÉTAPE 7 : Après le Paiement - Automatisations

### 7.1 : Relances Paiement Solde (J-5)

**Cron :** `send-balance-reminders-hourly` (toutes les heures)

**Fichier :** `supabase/functions/send-balance-reminders/index.ts`

**Déclenchement :**
- Quand `balance_due_at <= now()` (J-5 atteint)
- Réservation avec `status = 'AWAITING_BALANCE'`
- `balance_reminder_count < 2` (max 2 relances)

**Action :**
- Envoie email avec lien de paiement du solde
- Met à jour `balance_reminder_count`

### 7.2 : Rappels Événement

**Cron :** `send-event-reminders-quarterly` (toutes les 15 minutes)

**Fichier :** `supabase/functions/send-event-reminders/index.ts`

**Rappel J-1 (24h avant) :**
- Entre 23h et 25h avant `start_at`
- Email avec détails événement, matériel, contacts

**Rappel H-3 (3h avant) :**
- Entre 2h45 et 3h15 avant `start_at`
- Email de dernier rappel avec contacts urgents

---

## 🎯 ÉTAPE 8 : Scénario Paiement Abandonné

**Webhook :** `checkout.session.expired`

**Actions :**
1. Hold marqué `EXPIRED`
   ```typescript
   reservation_holds.update({
     status: 'EXPIRED',
     updated_at: now()
   })
   WHERE id = hold_id AND status = 'ACTIVE'
   ```

2. Réservation annulée (optionnel, si > 12h)
   ```typescript
   client_reservations.update({
     status: 'CANCELLED'
   })
   WHERE id = reservation_id 
     AND status = 'AWAITING_PAYMENT'
     AND created_at < now() - 12 hours
   ```

**Résultat :**
- Créneau redevient disponible
- Client peut réessayer de réserver

---

## 📊 Résumé du Flow

```
1. Homepage → Clic "Réserver maintenant"
   ↓
2. Page /book/[pack_key] → Wizard 5 étapes
   ↓
3. Clic "Payer l'acompte" → Appel API direct-checkout
   ↓
4. Fonction PostgreSQL atomique → Crée hold + réservation AWAITING_PAYMENT
   ↓
5. Stripe Checkout → Client paie 30%
   ↓
6. Webhook checkout.session.completed → Statut AWAITING_BALANCE + Hold CONSUMED
   ↓
7. Redirection /book/success → Page de succès (sans connexion requise)
   ↓
8. Option création compte → Redirection /dashboard si connecté
   ↓
8. Automatisations :
   - Relance solde J-5 (cron toutes les heures)
   - Rappel événement J-1 (cron toutes les 15 min)
   - Rappel événement H-3 (cron toutes les 15 min)
```

---

## 🔒 Garanties Anti-Double-Booking

1. **Atomicité** : Fonction PostgreSQL avec `pg_advisory_xact_lock` garantit qu'une seule réservation peut être créée pour un créneau donné, même avec 100 clics simultanés.

2. **Hold créé uniquement au paiement** : Le hold n'est créé QUE lorsque l'utilisateur clique sur "Payer l'acompte", pas avant.

3. **AWAITING_PAYMENT ne bloque pas** : Les réservations en attente de paiement ne bloquent pas la disponibilité, permettant à d'autres utilisateurs de réserver le même créneau si le premier abandonne.

4. **Expiration automatique** : Holds et sessions Stripe expirent après 10 minutes.

5. **Source de vérité** : Les webhooks Stripe sont la source de vérité pour les transitions de statut.

---

## 📝 Statuts de Réservation

| Statut | Signification | Bloque Disponibilité ? |
|--------|---------------|------------------------|
| `AWAITING_PAYMENT` | Acompte non payé | ❌ NON |
| `AWAITING_BALANCE` | Acompte payé, solde dû J-5 | ✅ OUI |
| `PAID` | Totalement payé | ✅ OUI |
| `CONFIRMED` | Réservation confirmée | ✅ OUI |
| `CANCELLED` | Réservation annulée | ❌ NON |

---

## 🎯 Points Clés

- **Pas de panier** : Le flow direct ne passe pas par le panier
- **Hold atomique** : Création hold + réservation en une seule transaction PostgreSQL
- **Expiration 10 min** : Hold et session Stripe expirent après 10 minutes
- **Webhook source de vérité** : Le statut est mis à jour uniquement via webhook Stripe
- **Polling dashboard** : Le dashboard vérifie le statut toutes les 2 secondes après redirection
- **Automatisations** : Relances et rappels automatiques via crons Supabase
