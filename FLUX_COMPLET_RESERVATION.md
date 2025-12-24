# 📋 FLUX COMPLET DE RÉSERVATION - Documentation Détaillée

## 🏠 ÉTAPE 0 : HOMEPAGE (`app/page.tsx`)

### Fichiers liés :
- **`app/page.tsx`** - Page d'accueil principale
- **`components/HeroSection.tsx`** - Section hero avec bouton CTA
- **`components/FloatingChatWidget.tsx`** - Widget de chat flottant (visible sur toutes les pages)
- **`components/FloatingChatButton.tsx`** - Bouton flottant pour ouvrir le chat
- **`app/layout.tsx`** - Layout global qui inclut le FloatingChatWidget

### Points d'entrée pour démarrer une réservation :

1. **Bouton CTA principal** (HeroSection)
   - Texte : "Demander un devis" / "Get a quote"
   - Action : `window.dispatchEvent(new CustomEvent('openChatWithDraft'))`
   - Ouvre le FloatingChatWidget

2. **Bouton flottant** (FloatingChatButton)
   - Visible en bas à droite de toutes les pages
   - Ouvre le FloatingChatWidget

3. **Scénarios FAQ** (ScenarioFAQSection)
   - Clic sur un scénario → ouvre le chat avec le scénario pré-rempli

---

## 💬 ÉTAPE 1 : ASSISTANT CHAT (`components/FloatingChatWidget.tsx`)

### Fichiers liés :
- **`components/FloatingChatWidget.tsx`** - Interface du chat
- **`hooks/useChat.ts`** - Hook React pour gérer l'état du chat
- **`lib/chatState.ts`** - Logique de gestion de l'état du chat
- **`app/api/chat/route.ts`** - API route pour les messages du chat (AI)
- **`types/chat.ts`** - Types TypeScript pour le chat

### Flux dans le chat :

1. **Conversation initiale**
   - L'utilisateur décrit son événement
   - L'IA pose des questions (type d'événement, nombre de personnes, dates, etc.)
   - L'IA recommande un pack (Conférence, Soirée, Mariage)

2. **Mode Pack activé**
   - Quand un pack est recommandé, le mode pack s'active (`activePackKey`)
   - Affichage d'un récapitulatif du pack proposé
   - Bouton "Envoyer la demande" apparaît

3. **Collecte du téléphone** (OBLIGATOIRE)
   - Avant d'envoyer la demande, un champ téléphone apparaît
   - Validation : minimum 10 chiffres
   - Stocké dans `customerPhoneInput` puis dans `reservation_requests.customer_phone`

4. **Envoi de la demande**
   - Clic sur "Envoyer la demande"
   - Appel API : `POST /api/reservation-requests`

---

## 📤 ÉTAPE 2 : CRÉATION DE LA DEMANDE (`app/api/reservation-requests/route.ts`)

### Fichiers liés :
- **`app/api/reservation-requests/route.ts`** - API pour créer une demande
- **`lib/reservation-email-templates.ts`** - Templates d'emails
- **`lib/resend.ts`** - Configuration Resend pour l'envoi d'emails

### Ce qui se passe :

1. **Création de l'entrée dans `reservation_requests`**
   ```sql
   INSERT INTO reservation_requests (
     pack_key,           -- 'conference' | 'soiree' | 'mariage'
     status,            -- 'NEW'
     customer_email,     -- Email du client
     customer_phone,    -- Téléphone (OBLIGATOIRE)
     customer_name,     -- Nom si disponible
     payload            -- JSON avec tous les détails (dates, personnes, etc.)
   )
   ```

2. **Email envoyé à l'admin**
   - Template : `getNewRequestEmailTemplate()`
   - Contenu : Détails de la demande, lien vers l'admin

3. **Réponse au client**
   - Message de confirmation dans le chat
   - "Votre demande a été envoyée, vous recevrez un email de confirmation"

---

## 👨‍💼 ÉTAPE 3 : VALIDATION ADMIN (`app/admin/reservation-requests/page.tsx`)

### Fichiers liés :
- **`app/admin/reservation-requests/page.tsx`** - Page admin principale
- **`app/admin/reservation-requests/[id]/page.tsx`** - Page détail d'une demande
- **`app/api/admin/reservation-requests/route.ts`** - API pour lister les demandes
- **`app/api/admin/reservation-requests/[id]/route.ts`** - API pour récupérer une demande
- **`lib/packs/basePacks.ts`** - Définition des packs de base

### Interface admin :

1. **Liste des demandes**
   - Filtres : Toutes / Nouvelles / En attente
   - Affichage : Pack, client, date, statut
   - Bouton "Voir détails" → ouvre le modal

2. **Modal "Voir les détails"**
   
   **Section 1 : Informations client**
   - Nom, email, téléphone
   - Boutons : Appeler, Envoyer email
   
   **Section 2 : Résumé de l'événement**
   - Type d'événement, lieu, nombre de personnes
   - Dates, heures, ambiance
   
   **Section 3 : Contenu du pack (base)** [READ-ONLY]
   - Liste des items par défaut du pack
   - Prix de base du pack
   - Services inclus (livraison, installation, récupération)
   
   **Section 4 : Configuration finale** [ÉDITABLE]
   - Liste des items finaux (`finalItems`)
   - Boutons : + / - pour modifier les quantités
   - Bouton "Ajouter depuis le catalogue" → ouvre Dialog Catalogue Pro
   - Bouton "Réinitialiser" → revient au pack de base
   - Résumé client généré automatiquement (`customerSummary`)
   
   **Section 5 : Analyse admin**
   - Toggles : Micro supplémentaire, Acoustique complexe, Horaire tardif, Accès compliqué
   - Notes internes
   
   **Section 6 : Prix & décision**
   - Prix de base du pack
   - Extras ajoutés
   - Total estimé
   - Caution (30% du total)
   
   **Section 7 : Actions**
   - **Valider** → Crée une réservation avec statut `AWAITING_PAYMENT`
   - **Ajuster** → Envoie un email au client avec les ajustements
   - **Refuser** → Envoie un email de refus avec motif

3. **Dialog Catalogue Pro**
   - Liste des produits depuis la table `products`
   - Filtre par catégorie
   - Ajout d'items au pack final
   - Recalcul automatique des prix

---

## ✅ ÉTAPE 4 : VALIDATION/APPROBATION (`app/api/admin/reservation-requests/approve/route.ts`)

### Fichiers liés :
- **`app/api/admin/reservation-requests/approve/route.ts`** - API pour valider
- **`app/api/admin/reservation-requests/adjust/route.ts`** - API pour ajuster
- **`app/api/admin/reservation-requests/reject/route.ts`** - API pour refuser
- **`lib/reservation-email-templates.ts`** - Templates d'emails

### Ce qui se passe lors de la validation :

1. **Création de l'entrée dans `client_reservations`**
   ```sql
   INSERT INTO client_reservations (
     request_id,           -- ID de la demande originale
     user_id,             -- NULL si client non inscrit
     customer_email,       -- Email du client
     pack_key,            -- 'conference' | 'soiree' | 'mariage'
     status,              -- 'AWAITING_PAYMENT'
     final_items,          -- JSONB avec les items finaux
     customer_summary,    -- Résumé généré automatiquement
     base_pack_price,     -- Prix du pack de base
     extras_total,        -- Total des extras
     price_total,         -- Prix total (base + extras)
     deposit_amount,      -- Caution (30% du total)
     start_at,            -- Date de début
     end_at,              -- Date de fin
     address              -- Adresse de l'événement
   )
   ```

2. **Mise à jour de la demande**
   - `reservation_requests.status` → `'APPROVED'`

3. **Email envoyé au client**
   - Template : `getAcceptedEmailTemplate()`
   - Contenu :
     - Pack choisi
     - Détail du matériel (`finalItems`)
     - Dates
     - Services inclus
     - Prix total + caution
     - Bouton "Accéder à ma réservation" → `/dashboard?reservation={id}`

---

## 📧 ÉTAPE 5 : EMAIL CLIENT → DASHBOARD (`app/dashboard/page.tsx`)

### Fichiers liés :
- **`app/dashboard/page.tsx`** - Dashboard user principal
- **`app/signup/page.tsx`** - Page d'inscription (si client non inscrit)
- **`app/auth/callback/route.ts`** - Callback Supabase Auth (rattache les réservations)
- **`components/auth/SignModal.tsx`** - Modal de connexion/inscription

### Flux selon le statut du client :

**Cas 1 : Client déjà connecté**
- Clic sur le lien → `/dashboard?reservation={id}`
- La réservation apparaît dans "Réservations en attente de paiement"

**Cas 2 : Client non connecté**
- Clic sur le lien → `/dashboard?reservation={id}`
- Le modal de connexion s'ouvre automatiquement
- Après connexion → la réservation est visible
- Si pas de compte → redirection vers `/signup?email={email}&redirect=/dashboard?reservation={id}`
- Après inscription → rattachement automatique via `auth/callback/route.ts`

### Rattachement automatique :
```typescript
// Dans app/auth/callback/route.ts
// Après création de compte, mettre à jour les client_reservations
UPDATE client_reservations
SET user_id = {new_user_id}
WHERE customer_email = {user_email}
AND user_id IS NULL
```

---

## 💳 ÉTAPE 6 : PAIEMENT (`app/api/payments/create-checkout-session/route.ts`)

### Fichiers liés :
- **`app/api/payments/create-checkout-session/route.ts`** - Création session Stripe principale
- **`app/api/payments/create-deposit-session/route.ts`** - Création session Stripe caution
- **`app/api/payments/verify-session/route.ts`** - Vérification directe du statut Stripe
- **`app/api/webhooks/stripe/route.ts`** - Webhook Stripe pour mettre à jour le statut

### Flux de paiement :

1. **Clic sur "Payer maintenant" dans le dashboard**
   - Appel API : `POST /api/payments/create-checkout-session`
   - Body : `{ reservation_id }`

2. **Création de la session Stripe principale**
   - `line_items` créés depuis `final_items` :
     - Pack de base (si `base_pack_price > 0`)
     - Extras (si `extras_total > 0`)
   - `success_url` :
     - Si `deposit_amount > 0` → `/api/payments/create-deposit-session?session_id={CHECKOUT_SESSION_ID}&deposit={amount}&reservation_id={id}`
     - Sinon → `/dashboard?payment=success&reservation_id={id}`
   - `metadata` : `type: 'client_reservation'`, `reservation_id`, etc.

3. **Redirection vers Stripe Checkout**
   - Client paie le montant principal
   - Après paiement → redirection vers `success_url`

4. **Si caution nécessaire** (`deposit_amount > 0`)
   - Redirection automatique vers `/api/payments/create-deposit-session`
   - Création d'une nouvelle session Stripe pour la caution
   - `capture_method: 'manual'` (autorisation sans débit immédiat)
   - Redirection vers Stripe Checkout pour la caution
   - Après caution → `/dashboard?deposit=success&reservation_id={id}`

5. **Mise à jour du statut** (via webhook ou vérification directe)
   - Webhook Stripe : `checkout.session.completed`
   - Si webhook échoue → vérification directe via `/api/payments/verify-session`
   - Mise à jour : `client_reservations.status` → `'PAID'`

---

## ✅ ÉTAPE 7 : RÉSERVATION PAYÉE (`app/dashboard/page.tsx`)

### Fichiers liés :
- **`app/dashboard/page.tsx`** - Dashboard user
- **`app/mes-reservations/page.tsx`** - Page "Mes réservations"
- **`app/mes-reservations/[id]/page.tsx`** - Détail d'une réservation

### Affichage dans le dashboard user :

**Section 1 : Message de succès** (si `payment=success`)
- Message vert : "✅ Paiement confirmé !"
- Polling automatique pour vérifier le statut

**Section 2 : Réservations en attente de paiement**
- Filtre : `status === 'AWAITING_PAYMENT'`
- Affichage :
  - Pack
  - Résumé client (`customer_summary`)
  - Détail du matériel (`final_items`)
  - Services inclus
  - Prix total + caution
  - Dates
  - Bouton "Payer maintenant"

**Section 3 : Réservations confirmées**
- Filtre : `status === 'PAID' || status === 'CONFIRMED'`
- Affichage :
  - Pack
  - Badge "Payée" / "Confirmée"
  - Résumé client
  - Prix total
  - Dates
  - Lieu

**Section 4 : Prochaine réservation**
- Fonction : `getNextReservation()`
- Combine `reservations` (anciennes) + `client_reservations` (nouvelles)
- Filtre : Date future, statut CONFIRMED ou PAID
- Affichage : Card avec gradient rouge, dates, prix, lien vers détail

**Section 5 : Réservations à venir**
- Fonction : `getUpcomingReservations()`
- Affiche les 2 prochaines réservations (sans la première)

**Section 6 : Mes réservations** (lien sidebar)
- Page : `/mes-reservations`
- Liste complète de toutes les réservations
- Combine `reservations` + `client_reservations` (PAID/CONFIRMED)
- Filtres et recherche

---

## 👨‍💼 ÉTAPE 8 : DASHBOARD ADMIN (`app/admin/page.tsx`)

### Fichiers liés :
- **`app/admin/page.tsx`** - Dashboard admin principal
- **`app/admin/reservations/page.tsx`** - Liste des réservations admin
- **`app/admin/reservations/[id]/page.tsx`** - Détail d'une réservation admin
- **`components/AdminSidebar.tsx`** - Sidebar admin

### Sections du dashboard admin :

**Section 1 : Statistiques**
- Réservations à venir (30 jours)
- CA du mois
- Commandes récentes

**Section 2 : Réservations à venir**
- Liste des réservations des 30 prochains jours
- Combine `reservations` + `client_reservations`
- Affichage : Pack, client, dates, statut

**Section 3 : Actions rapides**
- Créer une réservation
- Créer un paiement
- Créer une facture

### Page "Réservations" (`app/admin/reservations/page.tsx`)

**Liste des réservations**
- Combine `reservations` (anciennes) + `client_reservations` (nouvelles)
- Filtres : Statut, recherche
- Pagination

**Modal détail d'une réservation**
- Informations client
- Détails de la réservation
- Dates et heures
- **Heures de retrait/retour** (si retrait sur place, pas livraison)
- Prix et caution
- Statut
- Actions : Valider, Modifier, Annuler

---

## 🎣 HOOKS REACT

### Fichiers liés :
- **`hooks/useChat.ts`** - Hook principal pour gérer l'état du chat
  - `messages` - Liste des messages
  - `isOpen` - État d'ouverture du chat
  - `isLoading` - État de chargement
  - `draftConfig` - Configuration draft pour ajout au panier
  - `activePackKey` - Pack actif ('conference' | 'soiree' | 'mariage')
  - `reservationRequestDraft` - Draft de demande de réservation
  - `openChat()` - Ouvrir le chat
  - `closeChat()` - Fermer le chat
  - `addUserMessage()` - Ajouter un message utilisateur
  - `addAssistantMessage()` - Ajouter un message assistant

- **`hooks/useUser.ts`** - Hook pour gérer l'utilisateur connecté
  - `user` - Objet utilisateur Supabase
  - `loading` - État de chargement

- **`hooks/useAdmin.ts`** - Hook pour vérifier les droits admin
  - `isAdmin` - Boolean indiquant si l'utilisateur est admin
  - `checkingAdmin` - État de vérification

- **`hooks/useAuth.ts`** - Hook pour l'authentification
  - `signOut()` - Déconnexion

- **`hooks/useSidebarCollapse.ts`** - Hook pour gérer l'état de la sidebar
  - `isCollapsed` - État de collapse
  - `toggleSidebar()` - Basculer l'état

---

## 📁 STRUCTURE COMPLÈTE DES FICHIERS

### 🎨 COMPOSANTS UI
```
components/
├── FloatingChatWidget.tsx          # Widget chat principal (visible partout)
├── FloatingChatButton.tsx           # Bouton flottant pour ouvrir le chat
├── Header.tsx                       # Header avec navigation (toutes pages)
├── Footer.tsx                       # Footer (toutes pages)
├── DashboardSidebar.tsx             # Sidebar dashboard user
│   ├── Sections :
│   │   ├── Mes réservations
│   │   ├── Mes livraisons
│   │   ├── Mes états des lieux
│   │   ├── Mes contrats
│   │   ├── Mes factures
│   │   ├── Mes informations
│   │   └── Déconnexion
│   └── Badges d'actions en attente
├── AdminSidebar.tsx                 # Sidebar admin
│   ├── Sections :
│   │   ├── Dashboard
│   │   ├── Demandes de réservation
│   │   ├── Réservations
│   │   ├── Planning
│   │   ├── Livraisons
│   │   ├── États des lieux
│   │   ├── Contrats
│   │   ├── Factures
│   │   ├── Clients
│   │   ├── Catalogue
│   │   ├── Packs
│   │   ├── Paiements
│   │   ├── Pro
│   │   └── Paramètres
│   └── Badges de notifications
├── auth/
│   └── SignModal.tsx               # Modal connexion/inscription
│       ├── Onglet "Connexion"
│       ├── Onglet "Inscription"
│       └── Gestion redirect après auth
└── ui/                              # Composants Shadcn UI
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── textarea.tsx
    ├── badge.tsx
    ├── separator.tsx
    ├── switch.tsx
    ├── label.tsx
    └── ...
```

### 🗄️ PAGES USER
```
app/
├── page.tsx                         # Homepage
│   ├── HeroSection                  # Section hero avec CTA
│   ├── IASection                    # Section IA
│   ├── SolutionsSection             # Section solutions
│   ├── ScenarioFAQSection           # FAQ scénarios
│   └── FloatingChatWidget           # Widget chat (via layout)
│
├── dashboard/
│   └── page.tsx                     # Dashboard user principal
│       ├── Header + Sidebar
│       ├── Stats Cards (Contrats signés, Caution totale, Locations)
│       ├── Message de succès paiement (si payment=success)
│       ├── Contrats à signer (alerte orange)
│       ├── Prochaine réservation (card gradient rouge)
│       ├── Réservations en attente de paiement (client_reservations AWAITING_PAYMENT)
│       ├── Réservations confirmées (client_reservations PAID/CONFIRMED)
│       ├── Réservations à venir (getUpcomingReservations)
│       └── Footer
│
├── mes-reservations/
│   ├── page.tsx                     # Liste des réservations
│   │   ├── Combine reservations + client_reservations
│   │   ├── Filtres et recherche
│   │   ├── Pagination
│   │   └── Modal détail réservation
│   └── [id]/
│       └── page.tsx                 # Détail d'une réservation
│           ├── Informations complètes
│           ├── Dates et heures
│           ├── Matériel
│           ├── Actions (Modifier, Annuler)
│           └── Heures retrait/retour (si retrait sur place)
│
├── mes-livraisons/
│   └── page.tsx                     # Liste des livraisons
│
├── mes-etats-lieux/
│   └── page.tsx                     # Liste des états des lieux
│
├── mes-contrats/
│   └── page.tsx                     # Liste des contrats à signer
│
├── mes-factures/
│   └── page.tsx                     # Liste des factures
│
├── mes-informations/
│   └── page.tsx                     # Profil utilisateur
│
├── signup/
│   └── page.tsx                     # Page d'inscription
│       ├── Pre-remplissage email depuis URL
│       ├── Redirection après inscription
│       └── Utilise SignModal
│
└── auth/
    └── callback/
        └── route.ts                 # Callback Supabase Auth
            ├── Gestion tokens OAuth
            ├── Rattachement automatique client_reservations
            └── Redirection dashboard
```

### 🗄️ PAGES ADMIN
```
app/admin/
├── page.tsx                         # Dashboard admin principal
│   ├── Stats (Réservations à venir, CA mois, Équipements)
│   ├── Réservations à venir (30 jours)
│   ├── Actions rapides
│   └── Notifications demandes
│
├── reservation-requests/
│   ├── page.tsx                     # Liste des demandes
│   │   ├── Filtres (Toutes / Nouvelles / En attente)
│   │   ├── Cards avec infos essentielles
│   │   └── Modal "Voir détails" avec :
│   │       ├── Infos client
│   │       ├── Résumé événement
│   │       ├── Contenu pack (base) [READ-ONLY]
│   │       ├── Configuration finale [ÉDITABLE]
│   │       ├── Analyse admin
│   │       ├── Prix & décision
│   │       └── Actions (Valider / Ajuster / Refuser)
│   │   └── Dialog Catalogue Pro (ajout extras)
│   └── [id]/
│       └── page.tsx                 # Détail d'une demande (page dédiée)
│
├── reservations/
│   ├── page.tsx                     # Liste des réservations
│   │   ├── Combine reservations + client_reservations
│   │   ├── Filtres et recherche
│   │   ├── Pagination
│   │   └── Modal détail avec :
│   │       ├── Infos client
│   │       ├── Dates et heures
│   │       ├── Heures retrait/retour (si retrait)
│   │       ├── Prix et caution
│   │       └── Statut
│   └── [id]/
│       └── page.tsx                 # Détail d'une réservation (page dédiée)
│
├── planning/
│   └── page.tsx                     # Planning calendrier
│
├── clients/
│   ├── page.tsx                     # Liste des clients
│   └── [email]/
│       └── page.tsx                 # Détail d'un client
│
├── livraisons/
│   └── page.tsx                     # Gestion livraisons
│
├── contrats/
│   └── page.tsx                     # Gestion contrats
│
├── factures/
│   ├── page.tsx                     # Liste factures
│   └── nouvelle/
│       └── page.tsx                 # Créer facture
│
├── etats-des-lieux/
│   ├── page.tsx                     # Liste états des lieux
│   └── [id]/
│       └── page.tsx                 # Détail état des lieux
│
├── catalogue/
│   ├── page.tsx                     # Liste produits
│   └── nouveau/
│       └── page.tsx                 # Créer produit
│
├── packs/
│   ├── page.tsx                     # Liste packs
│   └── nouveau/
│       └── page.tsx                 # Créer pack
│
├── paiement/
│   ├── page.tsx                     # Gestion paiements
│   └── success/
│       └── page.tsx                 # Succès paiement
│
├── pro/
│   └── page.tsx                     # Gestion comptes pro
│
└── parametres/
    └── page.tsx                     # Paramètres admin
```

### 🔌 API ROUTES
```
app/api/
├── chat/
│   └── route.ts                     # API chat (AI)
├── reservation-requests/
│   └── route.ts                     # Créer une demande
├── admin/reservation-requests/
│   ├── route.ts                     # Lister les demandes
│   ├── [id]/route.ts                # Récupérer une demande
│   ├── approve/route.ts             # Valider une demande
│   ├── adjust/route.ts               # Ajuster une demande
│   └── reject/route.ts               # Refuser une demande
├── payments/
│   ├── create-checkout-session/route.ts    # Session Stripe principale
│   ├── create-deposit-session/route.ts     # Session Stripe caution
│   └── verify-session/route.ts              # Vérifier statut Stripe
├── webhooks/
│   └── stripe/
│       └── route.ts                 # Webhook Stripe
└── reservations/
    └── attach/route.ts              # Rattacher réservations (obsolète, intégré dans auth/callback)
```

### 📚 LIBRAIRIES & UTILITAIRES
```
lib/
├── packs/
│   └── basePacks.ts                 # Définition des packs de base
│       ├── Interface BasePack
│       ├── Interface PackItem
│       ├── Interface PackServices
│       ├── BASE_PACKS (conference, soiree, mariage)
│       ├── getBasePack()            # Récupérer un pack par clé
│       ├── generateCustomerSummary() # Générer résumé client
│       └── calculateExtrasTotal()   # Calculer total extras
│
├── chatState.ts                     # Gestion état du chat
│   ├── Détection d'intention
│   ├── Gestion mode pack
│   ├── Persistance localStorage
│   └── Gestion scénarios
│
├── reservation-email-templates.ts   # Templates emails
│   ├── getNewRequestEmailTemplate() # Email admin (nouvelle demande)
│   ├── getAcceptedEmailTemplate()   # Email client (demande acceptée)
│   ├── getAdjustedEmailTemplate()   # Email client (demande ajustée)
│   └── getRejectedEmailTemplate()   # Email client (demande refusée)
│
├── resend.ts                        # Configuration Resend
│   └── Instance Resend configurée
│
├── supabase.ts                      # Client Supabase
│   ├── supabase (client anon)
│   └── Configuration
│
├── cart-utils.ts                    # Utilitaires panier
├── catalog.ts                       # Catalogue produits
├── inventory.ts                     # Inventaire
└── utils.ts                         # Utilitaires généraux
```

### 🗃️ BASE DE DONNÉES
```
supabase/migrations/
├── 20250101000000_create_reservation_requests_tables.sql
├── 20250102000000_add_final_items_to_client_reservations.sql
└── 20250102000001_add_pricing_fields_to_client_reservations.sql
```

### 📊 TABLES SUPABASE

**`reservation_requests`**
- Stocke les demandes initiales du client
- Statuts : `NEW`, `PENDING_REVIEW`, `APPROVED`, `ADJUSTED`, `REJECTED`

**`client_reservations`**
- Stocke les réservations après validation admin
- Statuts : `AWAITING_PAYMENT`, `PAID`, `CONFIRMED`, `CANCELLED`
- Contient : `final_items`, `customer_summary`, `base_pack_price`, `extras_total`, `price_total`, `deposit_amount`

**`reservations`** (ancienne table)
- Réservations de l'ancien système
- Toujours utilisée pour compatibilité

---

## 🔄 FLUX COMPLET RÉSUMÉ

```
1. Homepage
   └─> Clic CTA / Bouton chat
       └─> FloatingChatWidget s'ouvre

2. Conversation avec l'IA
   └─> L'IA recommande un pack
       └─> Mode pack activé
           └─> Collecte téléphone (OBLIGATOIRE)
               └─> Envoi demande
                   └─> POST /api/reservation-requests
                       └─> Création reservation_requests (status: NEW)
                           └─> Email admin

3. Admin reçoit la demande
   └─> Ouvre modal "Voir détails"
       └─> Configure le pack (ajoute extras si besoin)
           └─> Valide / Ajuste / Refuse
               └─> POST /api/admin/reservation-requests/approve
                   └─> Création client_reservations (status: AWAITING_PAYMENT)
                       └─> Email client avec lien dashboard

4. Client clique sur le lien email
   └─> Redirection /dashboard?reservation={id}
       └─> Si non connecté → Modal connexion
           └─> Si pas de compte → /signup
               └─> Après inscription → Rattachement automatique
                   └─> Réservation visible dans dashboard

5. Client clique "Payer maintenant"
   └─> POST /api/payments/create-checkout-session
       └─> Redirection Stripe Checkout (paiement principal)
           └─> Après paiement → /api/payments/create-deposit-session (si caution)
               └─> Redirection Stripe Checkout (caution)
                   └─> Après caution → /dashboard?deposit=success

6. Webhook Stripe ou vérification directe
   └─> Mise à jour client_reservations.status → 'PAID'
       └─> Réservation apparaît dans "Réservations confirmées"
           └─> Réservation apparaît dans "Mes réservations"
               └─> Réservation apparaît dans admin "Réservations"
```

---

## 🎯 POINTS CLÉS

1. **Téléphone obligatoire** : Collecté avant l'envoi de la demande
2. **Packs de base** : Définis dans `lib/packs/basePacks.ts`
3. **Configuration admin** : Possibilité d'ajouter des extras depuis le catalogue
4. **Flux de paiement** : Paiement principal → Caution automatique (si nécessaire)
5. **Vérification statut** : Webhook Stripe + vérification directe en fallback
6. **Rattachement automatique** : Les réservations sont rattachées après inscription
7. **Affichage** : Les réservations PAID apparaissent dans user ET admin

---

## 📝 NOTES IMPORTANTES

- Les `client_reservations` sont le nouveau système
- Les `reservations` (ancienne table) sont toujours utilisées pour compatibilité
- Le dashboard combine les deux sources de données
- Les packs sont définis dans `basePacks.ts` avec prix de base et items par défaut
- Les extras sont ajoutés depuis la table `products`
- Le calcul des prix est automatique : `base_pack_price + extras_total = price_total`
- La caution est fixée à 30% du total : `deposit_amount = price_total * 0.3`

---

## 📋 RÉCAPITULATIF DES FICHIERS PAR ÉTAPE

### ÉTAPE 0 : Homepage → Chat
| Fichier | Rôle |
|---------|------|
| `app/page.tsx` | Page d'accueil avec sections et modals |
| `components/HeroSection.tsx` | Section hero avec bouton CTA principal |
| `components/FloatingChatWidget.tsx` | Widget chat (inclus dans layout) |
| `components/FloatingChatButton.tsx` | Bouton flottant pour ouvrir le chat |
| `app/layout.tsx` | Layout global incluant FloatingChatWidget |

### ÉTAPE 1 : Chat → Demande
| Fichier | Rôle |
|---------|------|
| `components/FloatingChatWidget.tsx` | Interface utilisateur du chat |
| `hooks/useChat.ts` | Hook React pour état du chat (messages, loading, etc.) |
| `lib/chatState.ts` | Logique de détection d'intention, mode pack, persistance |
| `app/api/chat/route.ts` | API route pour l'IA (OpenAI/Anthropic) |
| `types/chat.ts` | Types TypeScript (ChatMessage, DraftFinalConfig, etc.) |
| `components/FloatingChatWidget.tsx` | Collecte téléphone avant envoi |

### ÉTAPE 2 : Création demande
| Fichier | Rôle |
|---------|------|
| `app/api/reservation-requests/route.ts` | POST : Créer une demande dans `reservation_requests` |
| `lib/reservation-email-templates.ts` | Template email admin (nouvelle demande) |
| `lib/resend.ts` | Configuration Resend pour envoi emails |

### ÉTAPE 3 : Validation admin
| Fichier | Rôle |
|---------|------|
| `app/admin/reservation-requests/page.tsx` | Page admin : liste des demandes + modal détail |
| `app/admin/reservation-requests/[id]/page.tsx` | Page détail d'une demande (alternative) |
| `app/api/admin/reservation-requests/route.ts` | GET : Lister les demandes |
| `app/api/admin/reservation-requests/[id]/route.ts` | GET : Récupérer une demande |
| `lib/packs/basePacks.ts` | Définition packs (conference, soiree, mariage) |
| `app/admin/reservation-requests/page.tsx` | Dialog Catalogue Pro (ajout extras depuis `products`) |

### ÉTAPE 4 : Approbation admin
| Fichier | Rôle |
|---------|------|
| `app/api/admin/reservation-requests/approve/route.ts` | POST : Valider → créer `client_reservations` |
| `app/api/admin/reservation-requests/adjust/route.ts` | POST : Ajuster → email client + créer `client_reservations` |
| `app/api/admin/reservation-requests/reject/route.ts` | POST : Refuser → email client |
| `lib/reservation-email-templates.ts` | Templates emails (accepté, ajusté, refusé) |

### ÉTAPE 5 : Email → Dashboard
| Fichier | Rôle |
|---------|------|
| `app/dashboard/page.tsx` | Dashboard user principal |
| `app/signup/page.tsx` | Page inscription (si client non inscrit) |
| `app/auth/callback/route.ts` | Callback Supabase Auth (rattachement réservations) |
| `components/auth/SignModal.tsx` | Modal connexion/inscription |

### ÉTAPE 6 : Paiement
| Fichier | Rôle |
|---------|------|
| `app/api/payments/create-checkout-session/route.ts` | POST : Créer session Stripe principale |
| `app/api/payments/create-deposit-session/route.ts` | GET : Créer session Stripe caution (après paiement principal) |
| `app/api/payments/verify-session/route.ts` | GET : Vérifier statut Stripe directement (fallback webhook) |
| `app/api/webhooks/stripe/route.ts` | POST : Webhook Stripe (mise à jour statut automatique) |
| `app/dashboard/page.tsx` | Gestion retour paiement (polling statut) |

### ÉTAPE 7 : Réservation payée
| Fichier | Rôle |
|---------|------|
| `app/dashboard/page.tsx` | Affichage "Réservations confirmées" (PAID/CONFIRMED) |
| `app/mes-reservations/page.tsx` | Liste complète des réservations (combine anciennes + nouvelles) |
| `app/mes-reservations/[id]/page.tsx` | Détail d'une réservation |

### ÉTAPE 8 : Dashboard admin
| Fichier | Rôle |
|---------|------|
| `app/admin/page.tsx` | Dashboard admin principal (stats, réservations à venir) |
| `app/admin/reservations/page.tsx` | Liste des réservations admin (combine anciennes + nouvelles) |
| `app/admin/reservations/[id]/page.tsx` | Détail d'une réservation admin |
| `components/AdminSidebar.tsx` | Sidebar admin avec navigation |

---

## 🔗 LIENS ENTRE LES FICHIERS

### Flux de données principal :
```
Homepage (page.tsx)
  └─> FloatingChatWidget (via layout.tsx)
      └─> useChat hook
          └─> chatState.ts (logique)
              └─> /api/chat (IA)
                  └─> Mode pack activé
                      └─> /api/reservation-requests (création demande)
                          └─> Admin reçoit email
                              └─> /admin/reservation-requests/page.tsx
                                  └─> /api/admin/reservation-requests/approve
                                      └─> Création client_reservations
                                          └─> Email client
                                              └─> /dashboard?reservation={id}
                                                  └─> /api/payments/create-checkout-session
                                                      └─> Stripe Checkout
                                                          └─> /api/payments/create-deposit-session (si caution)
                                                              └─> Stripe Checkout caution
                                                                  └─> /dashboard?deposit=success
                                                                      └─> Webhook Stripe ou verify-session
                                                                          └─> Statut → PAID
                                                                              └─> Affichage dans dashboard
```

### Tables Supabase utilisées :
- **`reservation_requests`** : Demandes initiales (statut NEW → APPROVED/ADJUSTED/REJECTED)
- **`client_reservations`** : Réservations après validation (statut AWAITING_PAYMENT → PAID)
- **`reservations`** : Anciennes réservations (compatibilité)
- **`products`** : Catalogue pour ajouter des extras
- **`user_profiles`** : Profils utilisateurs (noms, emails)
- **`orders`** : Commandes (ancien système)

---

## 🎯 FONCTIONS CLÉS PAR FICHIER

### `lib/packs/basePacks.ts`
- `getBasePack(key)` - Récupère un pack par clé
- `generateCustomerSummary(packKey, finalItems, peopleCount)` - Génère résumé client
- `calculateExtrasTotal(finalItems, baseItems, products)` - Calcule total extras

### `hooks/useChat.ts`
- `openChat()` - Ouvre le chat
- `openChatWithDraft(message)` - Ouvre avec message pré-rempli
- `addUserMessage(content)` - Ajoute message utilisateur
- `addAssistantMessage(content, config)` - Ajoute message assistant
- `resetChat()` - Réinitialise le chat

### `app/dashboard/page.tsx`
- `getNextReservation()` - Prochaine réservation (combine anciennes + nouvelles)
- `getUpcomingReservations()` - Réservations à venir (combine anciennes + nouvelles)
- `getPackName(packId, language)` - Nom du pack traduit
- Polling automatique pour vérifier statut après paiement

### `app/admin/reservation-requests/page.tsx`
- `handleOpenModal(request)` - Ouvre modal détail avec initialisation des données
- `handleApprove()` - Valide la demande
- `handleAdjust()` - Ajuste la demande
- `handleReject()` - Refuse la demande
- Recalcul automatique des prix (base + extras)

---

## 📊 STATUTS ET TRANSITIONS

### `reservation_requests.status` :
- `NEW` → Création initiale
- `PENDING_REVIEW` → En cours de traitement admin
- `APPROVED` → Validée → crée `client_reservations`
- `ADJUSTED` → Ajustée → crée `client_reservations` avec ajustements
- `REJECTED` → Refusée

### `client_reservations.status` :
- `AWAITING_PAYMENT` → Créée après validation admin
- `PAID` → Après paiement Stripe (via webhook ou vérification directe)
- `CONFIRMED` → Confirmée (ancien système)
- `CANCELLED` → Annulée

---

## 🔐 SÉCURITÉ & AUTHENTIFICATION

### Routes protégées :
- **Admin** : Vérification via `useAdmin` hook → redirection si non admin
- **User** : Vérification via `useUser` hook → modal connexion si non connecté
- **API Admin** : Vérification token Bearer + rôle admin dans `user_metadata`

### Rattachement automatique :
- Après inscription → `auth/callback/route.ts` rattache les `client_reservations` via `customer_email`
- Les réservations créées avant inscription sont automatiquement liées après connexion

---

## 📧 EMAILS

### Templates disponibles (`lib/reservation-email-templates.ts`) :
1. **Nouvelle demande** → Admin
2. **Demande acceptée** → Client (avec lien dashboard)
3. **Demande ajustée** → Client (avec message admin)
4. **Demande refusée** → Client (avec motif)

### Configuration :
- **Resend** : `lib/resend.ts`
- **From** : `onboarding@resend.dev` (à configurer)
- **Templates** : HTML avec boutons et styles inline

---

## 💳 STRIPE

### Sessions créées :
1. **Paiement principal** : `create-checkout-session`
   - Mode : `payment`
   - Line items : Pack de base + extras
   - Success URL : `/api/payments/create-deposit-session` (si caution) ou `/dashboard?payment=success`

2. **Caution** : `create-deposit-session`
   - Mode : `payment`
   - Capture method : `manual` (autorisation sans débit)
   - Success URL : `/dashboard?deposit=success`

### Webhook :
- **Événement** : `checkout.session.completed`
- **Action** : Mise à jour `client_reservations.status` → `PAID`
- **Fallback** : Vérification directe via `/api/payments/verify-session`

---

## 🎨 UI/UX

### Composants Shadcn utilisés :
- `Button` - Boutons
- `Card`, `CardHeader`, `CardContent`, `CardTitle` - Cards
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` - Modals
- `Input` - Champs texte
- `Textarea` - Zones de texte
- `Badge` - Badges de statut
- `Separator` - Séparateurs
- `Switch` - Toggles
- `Label` - Labels
- `ScrollArea` - Zones scrollables

### Design :
- Couleur principale : `#F2431E` (rouge Soundrush)
- Cards avec bordures colorées selon statut
- Messages de succès avec fond vert
- Alertes avec fond orange/rouge
- Responsive mobile-first

---

## 🐛 DÉBOGAGE

### Logs importants :
- `📊 Client reservations chargées:` - Nombre de réservations chargées
- `📊 Réservations PAID:` - Nombre de réservations payées
- `🔄 Tentative X/15` - Polling statut après paiement
- `✅ Paiement confirmé` - Webhook ou vérification réussie
- `❌ Erreur` - Erreurs diverses

### Points de vérification :
1. **Webhook Stripe** : Vérifier les logs dans Supabase
2. **Statut réservation** : Vérifier dans `client_reservations` table
3. **Emails** : Vérifier les logs Resend
4. **Rattachement** : Vérifier que `user_id` est bien rempli après inscription

---

## 📝 NOTES FINALES

- Le système combine l'ancien (`reservations`) et le nouveau (`client_reservations`)
- Les packs sont définis dans `basePacks.ts` avec prix fixes
- Les extras sont ajoutés depuis la table `products`
- Le calcul des prix est automatique
- La caution est toujours 30% du total
- Le flux de paiement inclut automatiquement la caution si nécessaire
- Les réservations sont visibles dans user ET admin après paiement
