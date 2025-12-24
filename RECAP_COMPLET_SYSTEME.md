# 📋 Récapitulatif Complet du Système - Assistant Chat & Packs

## 🎯 Vue d'ensemble

Ce document détaille l'architecture complète du système de réservation via assistant chat, incluant les 3 packs (Conférence, Soirée, Mariage), leurs interactions avec le chat, et le flux UX complet.

---

## 📁 Architecture des Fichiers

### 1. **Composants Principaux**

#### `components/FloatingChatWidget.tsx`
**Rôle** : Interface utilisateur principale du chat flottant

**Fonctionnalités principales** :
- Affichage des messages (user/assistant)
- Gestion de l'état d'ouverture/fermeture
- Collecte du numéro de téléphone (obligatoire)
- Affichage du statut de disponibilité (V1.2)
- Boutons conditionnels :
  - "✅ Confirmer & payer" (instant booking V1.3) si éligible
  - "Envoyer la demande" (flux normal)
  - "Suivre ma demande" (V1.5) après création de demande
- Gestion des erreurs et messages d'aide
- Scroll automatique vers les nouveaux messages

**États locaux** :
```typescript
- inputValue: string
- customerPhoneInput: string
- isCreatingInstantReservation: boolean
- trackingUrl: string | null (V1.5)
```

**Hooks utilisés** :
- `useChat()` : Logique métier du chat
- `useCart()` : Gestion du panier

**Fonctions clés** :
- `sendMessage()` : Envoie un message utilisateur et appelle `/api/chat`
- `isInstantBookingEligible()` : Vérifie si instant booking possible
- `handleInstantBooking()` : Crée réservation instantanée + redirige Stripe
- `handleNormalRequest()` : Crée demande normale via `/api/reservation-requests`

---

#### `hooks/useChat.ts`
**Rôle** : Hook React gérant l'état et la logique du chat

**État géré** :
```typescript
- messages: ChatMessage[]
- isOpen: boolean
- isLoading: boolean
- draftConfig: DraftFinalConfig | null
- activeScenarioId: string | null
- activePackKey: 'conference' | 'soiree' | 'mariage' | null
- reservationRequestDraft: ReservationRequestDraft | null
- availabilityStatus: AvailabilityStatus (V1.2)
- availabilityDetails: AvailabilityDetails | null (V1.2)
```

**Fonctionnalités** :
- Persistance des messages dans `localStorage`
- Injection automatique du message de bienvenue
- Gestion de l'inactivité (45s) avec message idle
- Vérification automatique de disponibilité (V1.2) via `checkAvailability()`
- Reset complet du chat

**Fonction `checkAvailability()` (V1.2)** :
- Appelée automatiquement quand `activePackKey`, `startDate`, ou `endDate` changent
- Appelle `/api/availability` avec `packKey`, dates, heures
- Met à jour `availabilityStatus` et `availabilityDetails`

**Persistance** :
- Clé localStorage : `sndrush_chat_messages`
- Sauvegarde automatique après chaque message
- Chargement au mount du composant

---

#### `app/api/chat/route.ts`
**Rôle** : API Route Next.js pour le traitement des messages avec OpenAI

**Fonctionnalités** :
- Analyse des messages utilisateur avec OpenAI GPT
- Détection d'intent (`RECOMMENDATION`, `NEEDS_INFO`, `READY_TO_ADD`)
- Extraction de contexte depuis les messages (dates, personnes, type événement, etc.)
- Gestion des scénarios prédéfinis (dj-lache, evenement-2h, materiel-choisir, etc.)
- Mode pack : pré-remplit `packKey` et services inclus
- Génération de `draftFinalConfig` ou `reservationRequestDraft`

**Flux de traitement** :
1. Normalisation des messages
2. Construction de l'état de conversation (`buildConversationState`)
3. Traitement pré-OpenAI (nombres seuls, salutations, acquittements)
4. Appel OpenAI avec prompt système adapté
5. Extraction de `draftFinalConfig` ou `reservationRequestDraft` depuis la réponse
6. Retour JSON avec `reply`, `intent`, `draftFinalConfig`, `reservationRequestDraft`

**Prompt système** :
- Adapté selon le mode (pack ou catalogue)
- Inclut les informations connues (type événement, nombre personnes, dates, etc.)
- Guide l'IA pour poser les bonnes questions dans le bon ordre

---

### 2. **Types & Interfaces**

#### `types/chat.ts`
**Types définis** :
```typescript
- ChatMessageRole: 'user' | 'assistant'
- ChatMessageKind: 'welcome' | 'idle' | 'normal'
- ChatIntent: 'RECOMMENDATION' | 'NEEDS_INFO' | 'READY_TO_ADD'
- AvailabilityStatus: 'idle' | 'checking' | 'available' | 'unavailable' | 'error'
- AvailabilityDetails: { remaining?, bookedQuantity?, totalQuantity?, reason?, alternatives? }
- DraftFinalConfig: { selections, event?, needsConfirmation, withInstallation? }
- ReservationRequestDraft: { pack_key, payload: { eventType?, peopleCount?, dates?, etc. } }
```

---

### 3. **Logique Métier**

#### `lib/chatState.ts`
**Rôle** : Gestion de l'état de conversation et extraction de contexte

**Fonction principale** : `buildConversationState()`
- Analyse tous les messages pour extraire le contexte connu
- Détecte : type événement, nombre personnes, intérieur/extérieur, ambiance, dates, livraison, installation
- Gère le mode pack (`packKey`)
- Retourne un `ConversationState` avec toutes les informations connues

**Fonctions d'extraction** :
- `extractPeopleCount()` : Détecte nombre de personnes
- `extractEventType()` : Détecte type d'événement (mariage, conférence, etc.)
- `extractIndoorOutdoor()` : Détecte intérieur/extérieur
- `extractVibe()` : Détecte ambiance (dj, discours, ambiance, mix, voix, présentation)
- `extractDateISO()` : Extrait dates/heures depuis texte
- `extractDeliveryChoice()` : Détecte retrait ou livraison
- `getNextQuestion()` : Détermine la prochaine question à poser

**Anti-mélange** : Empêche de détecter "dj" pour un pack conférence

---

#### `lib/packs/basePacks.ts`
**Rôle** : Définition des 3 packs de base

**Structure** :
```typescript
interface BasePack {
  key: 'conference' | 'soiree' | 'mariage'
  title: string
  description: string
  defaultItems: PackItem[] // [{ label: 'Enceinte', qty: 2 }, ...]
  services: PackServices // { deliveryIncluded, installationIncluded, pickupIncluded }
  basePrice: number
}
```

**Packs définis** :
1. **Pack Conférence** (279€)
   - 2 Enceintes
   - 2 Micros HF
   - 1 Console de mixage
   - Services inclus : livraison, installation, récupération

2. **Pack Soirée** (329€)
   - 2 Enceintes
   - 1 Micro
   - 1 Console de mixage
   - Services inclus : livraison, installation, récupération

3. **Pack Mariage** (449€)
   - 2 Enceintes
   - 1 Caisson de basses
   - 2 Micros
   - 1 Console de mixage
   - Services inclus : livraison, installation, récupération

**Fonctions utilitaires** :
- `getBasePack(key)` : Récupère un pack par sa clé
- `generateCustomerSummary()` : Génère résumé texte pour le client
- `getAdjustments()` : Compare items base vs finaux pour détecter ajustements
- `calculateExtrasTotal()` : Calcule le total des extras (items hors pack de base)

---

### 4. **Composants Packs**

#### `components/SolutionsSection.tsx`
**Rôle** : Section affichant les 3 cards packs sur la homepage

**Structure** :
- 3 cards en grid responsive (1 colonne mobile, 3 colonnes desktop)
- Chaque card affiche :
  - Image du pack
  - Nom (Pack Conférence/Soirée/Mariage)
  - Description
  - Liste de features
  - Prix ("À partir de X€")
  - Badge "Recommandé" pour Pack Soirée
  - Bouton "Demande de réservation"

**Interaction avec le chat** :
```typescript
const handleReservationRequest = (packKey: 'conference' | 'soiree' | 'mariage') => {
  window.dispatchEvent(new CustomEvent('openChatWithDraft', { 
    detail: { 
      message: `Je souhaite faire une demande de réservation pour le ${packName}.`,
      packKey: packKey
    } 
  }));
};
```

**Mapping ID → packKey** :
- ID 1 → 'conference'
- ID 2 → 'soiree'
- ID 3 → 'mariage'

---

## 🔄 Flux UX Complet

### **Scénario 1 : Clic sur Card Pack (Homepage)**

1. **Utilisateur clique sur "Demande de réservation"** sur une card pack
2. **Événement déclenché** : `openChatWithDraft` avec `packKey` et message pré-rempli
3. **Chat s'ouvre** : `FloatingChatWidget` écoute l'événement via `useChat().openChatWithDraft()`
4. **Message utilisateur injecté** : "Je souhaite faire une demande de réservation pour le Pack X"
5. **API `/api/chat` appelée** avec :
   - Messages (incluant le message utilisateur)
   - `packKey` : 'conference' | 'soiree' | 'mariage'
   - Mode pack activé
6. **IA répond** : Pose des questions adaptées au pack (dates, nombre personnes, etc.)
7. **État mis à jour** :
   - `activePackKey` = packKey sélectionné
   - `reservationRequestDraft` = draft avec pack_key pré-rempli
   - Services (livraison, installation) pré-remplis = true

---

### **Scénario 2 : Conversation Chat (Mode Pack)**

1. **Utilisateur répond aux questions** de l'IA
2. **Chaque message** :
   - Envoyé via `sendMessage()` dans `FloatingChatWidget`
   - Appelle `/api/chat` avec tous les messages précédents
   - IA analyse et extrait le contexte (dates, personnes, adresse, etc.)
   - Met à jour `reservationRequestDraft.payload` avec les nouvelles infos
3. **Vérification disponibilité automatique (V1.2)** :
   - Quand `startDate` et `endDate` sont renseignés
   - `useChat().checkAvailability()` appelé automatiquement
   - Appelle `/api/availability` avec `packKey`, dates, heures
   - Met à jour `availabilityStatus` ('checking' → 'available' | 'unavailable')
   - Affiche badge dans le chat : "✅ Disponible" ou "❌ Indisponible"
4. **Collecte téléphone** :
   - Champ obligatoire affiché dans le chat
   - Validation : minimum 9 chiffres
   - Stocké dans `reservationRequestDraft.payload.customerPhone`
5. **Collecte email (optionnel pour instant booking)** :
   - Si utilisateur connecté : récupéré automatiquement
   - Sinon : peut être fourni dans le chat ou demandé par Stripe

---

### **Scénario 3 : Instant Booking (V1.3) - Si éligible**

**Conditions d'éligibilité** (`isInstantBookingEligible()`) :
- ✅ `availabilityStatus === 'available'`
- ✅ `pack_key` dans ('conference', 'soiree', 'mariage')
- ✅ Pas d'urgence (pas de flag "urgent" dans payload)
- ✅ Heure de fin ≤ 23:00
- ✅ Pas de flags complexes (acoustique, accès compliqué, besoin spécial)

**Flux** :
1. **Bouton affiché** : "✅ Confirmer & payer" (vert) au lieu de "Envoyer la demande"
2. **Clic sur bouton** → `handleInstantBooking()` :
   - **Étape 1** : Créer un HOLD (10 min) via `POST /api/holds`
     - Vérifie conflits avec autres holds actifs + réservations confirmées
     - Si conflit (409) → erreur "Créneau indisponible"
   - **Étape 2** : Créer réservation instantanée via `POST /api/instant-reservations`
     - Crée `client_reservation` avec `status: 'AWAITING_PAYMENT'`
     - `final_items` = items du pack de base (pas d'extras)
     - `price_total` = `basePackPrice`
     - `deposit_amount` = 30% du total
     - Consomme le hold (status = 'CONSUMED')
   - **Étape 3** : Créer session Stripe via `POST /api/payments/create-checkout-session`
     - Passe `reservation_id` et `hold_id` (dans metadata)
     - Retourne URL Stripe Checkout
   - **Étape 4** : Redirection vers Stripe
     - Stripe demande email si non fourni
     - Paiement de l'acompte (30%)
3. **Après paiement** :
   - Webhook Stripe (`checkout.session.completed`) :
     - Met à jour `client_reservation.status` = 'PAID'
     - Met à jour `customer_email` si fourni par Stripe
     - Consomme le hold (status = 'CONSUMED')
   - Redirection vers `/api/payments/create-deposit-session` pour caution
   - Puis redirection vers dashboard

---

### **Scénario 4 : Demande Normale (Non éligible instant booking)**

**Flux** :
1. **Bouton affiché** : "Envoyer la demande" (rouge)
2. **Clic sur bouton** → `handleNormalRequest()` :
   - Appelle `POST /api/reservation-requests`
   - Crée `reservation_request` avec :
     - `pack_key`
     - `payload` (toutes les infos collectées)
     - `customer_phone` (obligatoire)
     - `customer_email` (si disponible)
     - `status: 'NEW'`
     - `public_token_hash` + `public_token_expires_at` (V1.5)
   - Retourne `publicTrackingUrl` = `/suivi?rid=<id>&token=<token>`
3. **Événement déclenché** : `reservationRequestCreated` avec `trackingUrl`
4. **Chat affiche** :
   - Message de confirmation
   - Bouton "Suivre ma demande" → ouvre `/suivi` dans nouvel onglet
5. **Admin traite** :
   - Voit la demande dans `/admin/reservation-requests`
   - Peut : Approver, Ajuster, Rejeter
   - Si Apprové/Ajusté :
     - Crée `client_reservation` avec `status: 'AWAITING_PAYMENT'`
     - Génère token checkout public (`public_token_hash`)
     - Envoie email avec lien `/checkout/<id>?token=<token>`
6. **Client paie** :
   - Via lien email → `/checkout/[id]` (page publique, pas besoin compte)
   - Valide token (hash + expiration)
   - Affiche récapitulatif + bouton "Payer maintenant"
   - Redirige vers Stripe Checkout

---

### **Scénario 5 : Vérification Disponibilité (V1.2)**

**Déclenchement automatique** :
- Quand `activePackKey` + `startDate` + `endDate` sont renseignés
- Via `useEffect` dans `useChat.ts`

**API `/api/availability`** :
- Paramètres : `packKey`, `startDate`, `endDate`, `startTime?`, `endTime?`
- Vérifie :
  1. Réservations existantes (`client_reservations` avec status AWAITING_PAYMENT/PAID/CONFIRMED)
  2. Holds actifs (`reservation_holds` avec status ACTIVE et non expirés)
  3. Calcul de `bookedQuantity` pour le pack
  4. `totalQuantity` = 1 (1 pack disponible par défaut)
  5. `remaining` = `totalQuantity - bookedQuantity`

**Réponse** :
```json
{
  "available": true/false,
  "remaining": 1,
  "bookedQuantity": 0,
  "totalQuantity": 1
}
```

**Affichage dans chat** :
- Badge "Vérification de la disponibilité…" (loading)
- Badge "✅ Disponible à cette date (X disponible)" (success)
- Badge "❌ Indisponible à cette date" (unavailable)
- Si indisponible : bouton "Envoyer la demande" désactivé

---

## 🔐 Sécurité & Tokens

### **Tokens Publics (V1.4 & V1.5)**

**Génération** :
- Token aléatoire 32 bytes (base64url)
- Hash SHA256 stocké en DB (`public_token_hash`)
- Expiration 7 jours (`public_token_expires_at`)
- Token plaintext jamais stocké en DB (uniquement dans email/lien)

**Utilisation** :
- **Checkout public** (`/checkout/[id]?token=<token>`) : Valide hash + expiration
- **Suivi public** (`/suivi?rid=<id>&token=<token>`) : Valide hash + expiration

**Fonctions** (`lib/token.ts`) :
- `generatePublicToken()` : Génère token aléatoire
- `hashToken()` : Hash SHA256
- `verifyToken()` : Vérifie hash + expiration
- `generateTokenWithHash()` : Combine génération + hash + expiration
- `ensureValidCheckoutToken()` : Régénère token si expiré (pour relances)

---

## 📊 Base de Données

### **Tables Principales**

#### `reservation_requests`
- Demande initiale depuis le chat
- Status : NEW → PENDING_REVIEW → APPROVED/ADJUSTED/REJECTED
- Colonnes : `pack_key`, `customer_email`, `customer_phone`, `payload` (jsonb), `public_token_hash`, `public_token_expires_at`

#### `client_reservations`
- Réservation créée après validation admin OU instant booking
- Status : AWAITING_PAYMENT → PAID → CONFIRMED
- Colonnes : `pack_key`, `final_items` (jsonb), `price_total`, `deposit_amount`, `customer_email` (nullable), `public_token_hash`, `reminder_count`, `last_reminder_at`, `reminder_j1_sent_at`, `reminder_h3_sent_at`

#### `reservation_holds`
- Blocage temporaire 10 minutes (anti double-booking)
- Status : ACTIVE → CONSUMED/CANCELLED/EXPIRED
- Colonnes : `pack_key`, `start_at`, `end_at`, `expires_at`, `reservation_id` (FK), `contact_phone`, `contact_email`

---

## 🤖 Automatisation (Phase C)

### **Relances Paiement (C1)**
- Edge Function : `supabase/functions/send-payment-reminders/index.ts`
- Cron : Toutes les heures
- Règles :
  - Relance #1 : si `created_at <= now() - 2h` et `reminder_count == 0`
  - Relance #2 : si `last_reminder_at <= now() - 24h` et `reminder_count == 1`
  - Max 2 relances
- Email : Lien checkout public avec token régénéré

### **Rappels Événement (C2)**
- Edge Function : `supabase/functions/send-event-reminders/index.ts`
- Cron : Toutes les 15 minutes
- Règles :
  - Rappel J-1 : si `start_at` dans [now()+23h, now()+25h]
  - Rappel H-3 : si `start_at` dans [now()+2h45, now()+3h15]
  - Envoi unique par type

---

## 🎨 UI/UX

### **États Visuels**

**Disponibilité** :
- 🔄 "Vérification de la disponibilité…" (spinner)
- ✅ "Disponible à cette date (X disponible)" (badge vert)
- ❌ "Indisponible à cette date" (badge rouge)

**Boutons** :
- "✅ Confirmer & payer" (vert) : Instant booking éligible
- "Envoyer la demande" (rouge) : Demande normale
- "Suivre ma demande" (lien) : Après création demande (V1.5)

**Messages** :
- Message de bienvenue automatique
- Message idle après 45s d'inactivité
- Messages d'erreur avec scroll automatique
- Messages d'aide contextuels

---

## 🔗 Interactions entre Composants

```
Homepage (SolutionsSection)
    ↓ (clic bouton pack)
    ↓ (événement openChatWithDraft)
FloatingChatWidget
    ↓ (utilise)
useChat Hook
    ↓ (appelle)
/api/chat (OpenAI)
    ↓ (retourne)
reservationRequestDraft
    ↓ (si dates renseignées)
checkAvailability()
    ↓ (appelle)
/api/availability
    ↓ (retourne)
availabilityStatus + availabilityDetails
    ↓ (affiché dans)
FloatingChatWidget (badge)
    ↓ (si instant booking éligible)
handleInstantBooking()
    ↓ (appelle)
POST /api/holds → POST /api/instant-reservations → POST /api/payments/create-checkout-session
    ↓ (redirige vers)
Stripe Checkout
    ↓ (après paiement)
Webhook Stripe → Met à jour client_reservation
```

---

## 📝 Notes Importantes

1. **Mode Pack** : Quand `packKey` est défini, l'IA pré-remplit automatiquement les services (livraison, installation) et adapte ses questions
2. **Persistance** : Tous les messages sont sauvegardés dans `localStorage` pour persister entre rafraîchissements
3. **Anti-double-booking** : Système de HOLD (10 min) + vérification disponibilité avant création réservation
4. **Email optionnel** : Pour instant booking, l'email n'est pas obligatoire (Stripe le demandera)
5. **Téléphone obligatoire** : Toujours requis pour créer une demande/réservation
6. **Tokens sécurisés** : Jamais stockés en clair, toujours hashés (SHA256) + expiration

---

## 🚀 Évolutions Futures Possibles

- Mode catalogue (ajout produits individuels au panier)
- Extras dans instant booking (actuellement pack de base uniquement)
- Notifications push pour statut demande
- Chatbot multi-langues
- Intégration calendrier pour sélection dates visuelle

---

**Dernière mise à jour** : Janvier 2025
**Version** : V1.5 (avec suivi public) + Phase C (automatisation)
