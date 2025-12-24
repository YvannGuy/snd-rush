# Documentation Complète - Dashboards User et Admin

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Dashboard User](#dashboard-user)
3. [Dashboard Admin](#dashboard-admin)
4. [Pages associées](#pages-associées)
5. [Composants réutilisables](#composants-réutilisables)
6. [Hooks personnalisés](#hooks-personnalisés)
7. [API Routes](#api-routes)
8. [Flux de données](#flux-de-données)
9. [Interactions entre pages](#interactions-entre-pages)

---

## Vue d'ensemble

### Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION SOUNDRUSH                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  DASHBOARD USER  │         │  DASHBOARD ADMIN  │          │
│  │   /dashboard     │         │     /admin        │          │
│  └──────────────────┘         └──────────────────┘          │
│         │                              │                      │
│         ├──────────────────────────────┤                      │
│         │                              │                      │
│    ┌────▼────┐                    ┌───▼────┐                │
│    │ SIDEBAR │                    │ SIDEBAR│                │
│    │  USER   │                    │ ADMIN  │                │
│    └─────────┘                    └────────┘                 │
│         │                              │                      │
│    ┌────▼──────────────────────────────▼────┐                │
│    │         PAGES SPÉCIALISÉES             │                │
│    │  /mes-reservations, /mes-factures, etc. │                │
│    └─────────────────────────────────────────┘                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          COMPOSANTS PARTAGÉS                          │   │
│  │  DocumentsPanel, Header, Footer, SignModal          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          SUPABASE (Database + Auth)                  │   │
│  │  client_reservations, reservations, orders, etc.   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Tables de données principales

- **`client_reservations`** : Réservations du nouveau système (packs)
- **`reservations`** : Réservations de l'ancien système (legacy)
- **`orders`** : Commandes/factures (liées aux réservations)
- **`etat_lieux`** : États des lieux (liés aux réservations)
- **`user_profiles`** : Profils utilisateurs

---

## Dashboard User

### Fichier : `app/dashboard/page.tsx`

#### Structure de la page

```
┌─────────────────────────────────────────────────────────┐
│  Header (avec logo, navigation, panier)                  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌─────────────────────────────────────┐  │
│  │ Sidebar  │  │         CONTENU PRINCIPAL           │  │
│  │  User    │  │                                      │  │
│  │          │  │  SECTION 1: Mes Paiements             │  │
│  │ - Accueil│  │  - Acompte 30% (payé/à payer)        │  │
│  │ - Réserv.│  │  - Solde restant (J-5)               │  │
│  │ - Livrais│  │  - Caution (J-2)                     │  │
│  │ - États  │  │                                      │  │
│  │ - Factur.│  │  SECTION 2: Mes Documents            │  │
│  │ - Contrat│  │  - Contrat (signer/télécharger)      │  │
│  │ - Infos  │  │  - Factures (télécharger)            │  │
│  │          │  │  - États des lieux (télécharger)     │  │
│  │          │  │                                      │  │
│  │          │  │  SECTION 3: Mes Actions               │  │
│  │          │  │  - Contrats à signer (alerte)         │  │
│  │          │  │  - Prochaine prestation (carte)       │  │
│  │          │  │  - Accès rapide (3 boutons)           │  │
│  └──────────┘  └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘
```

#### Sections détaillées

##### SECTION 1: Mes Paiements

**Contenu :**
- Liste des `client_reservations` avec statut `AWAITING_PAYMENT` ou `AWAITING_BALANCE`
- Pour chaque réservation :
  - Nom du pack (Conference/Soirée/Mariage)
  - Résumé client (`customer_summary`) si disponible
  - Liste des items finaux (`final_items`) si disponible
  - Badge "Validé" si `final_validated_at` est défini
  - Détail des paiements :
    - **Acompte 30%** : Statut (payé ✅ / à payer ⏳) + montant
    - **Solde restant** : Statut (payé ✅ / à payer ⏳) + montant + date d'échéance (`balance_due_at`)
    - **Caution** : Montant + date de demande (`deposit_requested_at`)
  - Informations événement : Date (`start_at`) + Lieu (`address`)
  - Bouton CTA : "Payer l'acompte (30%)" ou "Payer le solde maintenant"

**Logique :**
- Filtre : `status === 'AWAITING_PAYMENT' || status === 'AWAITING_BALANCE'`
- Calcul acompte : `Math.round(price_total * 0.3)`
- Calcul solde : `balance_amount` ou `Math.round(price_total * 0.7)`
- Bouton déclenche :
  - Si `AWAITING_PAYMENT` → `/api/payments/create-checkout-session`
  - Si `AWAITING_BALANCE` → `/api/payments/create-balance-session`

##### SECTION 2: Mes Documents

**Contenu :**
- Utilise le composant `DocumentsPanel` (voir section Composants)
- Affiche les documents de la **prochaine réservation** (`nextReservation`)
- Documents disponibles :
  - **Contrat** : Télécharger (si signé) / Signer (si non signé)
  - **Factures** : Liste des factures liées (max 3) avec téléchargement
  - **État des lieux** : Télécharger si disponible

**Logique :**
- `nextReservation` = première réservation avec `start_at >= aujourd'hui`
- Priorité : `client_reservations` > `reservations`
- Chargement des documents via `useEffect` séparé

##### SECTION 3: Mes Actions

**Contenu :**
1. **Alerte contrats à signer** (si applicable)
   - Carte orange avec badge de compteur
   - Liste des réservations avec contrat non signé
   - Bouton "Voir mes contrats à signer" → `/mes-contrats`

2. **Prochaine prestation** (si existe)
   - Carte dégradé orange/rouge avec icône musique
   - Affichage : Pack + Date + Lieu
   - Bouton "Voir la réservation" → `/mes-reservations/[id]` ou `/dashboard?reservation=[id]`

3. **Accès rapide** (3 boutons)
   - Mes Contrats → `/mes-contrats`
   - Mes Factures → `/mes-factures`
   - Mes États des lieux → `/mes-etats-lieux`

#### Hooks utilisés

- `useUser()` : Récupération utilisateur connecté
- `useAuth()` : Fonctions d'authentification (`signOut`)
- `useSidebarCollapse()` : Gestion état sidebar (collapsed/expanded)
- `useRouter()` : Navigation Next.js
- `useSearchParams()` : Paramètres URL (pour `?payment=success`)

#### États React

```typescript
const [reservations, setReservations] = useState<any[]>([]); // Anciennes réservations
const [orders, setOrders] = useState<any[]>([]); // Commandes/factures
const [clientReservations, setClientReservations] = useState<any[]>([]); // Nouvelles réservations
const [nextReservationDocuments, setNextReservationDocuments] = useState<{
  orders: any[];
  etatLieux: any | null;
}>({ orders: [], etatLieux: null });
const [stats, setStats] = useState({
  signedContracts: 0,
  totalDeposit: 0,
  totalRentals: 0,
});
const [pendingActions, setPendingActions] = useState({
  contractsToSign: 0,
  conditionReportsToReview: 0,
  deliveriesNotReturned: 0,
  newInvoices: 0,
  reservationsWithContractsToSign: 0,
});
const [isLoadingData, setIsLoadingData] = useState(true);
const [paymentSuccess, setPaymentSuccess] = useState(false);
const [paymentReservationId, setPaymentReservationId] = useState<string | null>(null);
```

#### Logique de chargement des données

1. **Chargement initial** (`useEffect` sur `user`)
   - Requêtes parallèles vers Supabase :
     - `reservations` : `user_id = user.id`, exclure `PENDING`
     - `orders` : `customer_email = user.email`
     - `client_reservations` : `user_id = user.id OR customer_email = user.email`
   - Calcul des stats et actions en attente
   - Chargement des documents de la prochaine réservation

2. **Gestion retour paiement Stripe** (`useEffect` sur `searchParams`)
   - Détecte `?payment=success&reservation_id=xxx`
   - Polling du statut de la réservation (15 tentatives max)
   - Vérification directe Stripe si nécessaire
   - Rechargement des données après confirmation paiement

3. **Calcul `nextReservation`** (`useMemo`)
   - Filtre : `start_at >= aujourd'hui`
   - Priorité : `client_reservations` > `reservations`
   - Tri : `start_at` croissant

4. **Chargement documents prochaine réservation** (`useEffect` sur `nextReservation`)
   - Chargement des `orders` liés (`reservation_id` ou `client_reservation_id`)
   - Chargement de l'`etat_lieux` si existe

#### Interactions utilisateur

- **Clic "Payer l'acompte/solde"** :
  1. Récupération token auth Supabase
  2. Appel API (`/api/payments/create-checkout-session` ou `create-balance-session`)
  3. Redirection vers Stripe Checkout
  4. Retour avec `?payment=success&reservation_id=xxx`
  5. Polling et rechargement automatique

- **Clic "Signer contrat"** :
  - Redirection vers `/sign-contract?clientReservationId=xxx` ou `?reservationId=xxx`

- **Clic "Télécharger document"** :
  - Ouverture nouvelle fenêtre vers `/api/contract/download?clientReservationId=xxx`
  - Génération PDF côté serveur

---

## Dashboard Admin

### Fichier : `app/admin/page.tsx`

#### Structure de la page

```
┌─────────────────────────────────────────────────────────┐
│  Header (avec logo, navigation)                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌─────────────────────────────────────┐  │
│  │ Sidebar  │  │         CONTENU PRINCIPAL             │  │
│  │  Admin   │  │                                       │  │
│  │          │  │  NOTIFICATION (si nouvelles demandes) │  │
│  │ - Accueil│  │                                       │  │
│  │ - Réserv.│  │  BOUTON "+ Nouvelle réservation"      │  │
│  │ - Demand.│  │                                       │  │
│  │ - Catalog│  │  STATS CARDS (4 cartes)                │  │
│  │ - Packs  │  │  - Réservations à venir               │  │
│  │ - Plan.  │  │  - CA ce mois                         │  │
│  │ - Clients│  │  - Matériel sorti                     │  │
│  │ - Pro    │  │  - Retours en retard                  │  │
│  │ - Factur.│  │                                       │  │
│  │ - Contrat│  │  AUTOMATISATION (3 sections)           │  │
│  │ - Livrais│  │  - Solde à payer (J-5)                 │  │
│  │ - États  │  │  - Caution à demander (J-2)            │  │
│  │ - Param. │  │  - Événements cette semaine            │  │
│  │          │  │                                       │  │
│  │          │  │  RÉSERVATIONS À VENIR (liste)          │  │
│  │          │  │  - Carte par réservation                │  │
│  │          │  │  - Actions rapides                     │  │
│  │          │  │                                       │  │
│  │          │  │  MATÉRIEL EN COURS (liste)            │  │
│  │          │  │  - Statut retour                       │  │
│  │          │  │                                       │  │
│  │          │  │  CLIENTS RÉCENTS (liste)               │  │
│  │          │  │  - Nom + email                         │  │
│  │          │  │  - Nombre réservations + CA            │  │
│  │          │  │                                       │  │
│  │          │  │  PLANNING MOIS (calendrier)            │  │
│  │          │  │  - Jours avec réservations marqués     │  │
│  └──────────┘  └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘
```

#### Sections détaillées

##### STATS CARDS (4 cartes)

1. **Réservations à venir**
   - Source : `client_reservations`
   - Filtre : `start_at >= aujourd'hui AND start_at <= aujourd'hui + 30 jours`
   - Affichage : Compteur

2. **CA ce mois**
   - Source : `client_reservations`
   - Filtre : `created_at >= début du mois`
   - Calcul : Somme de `price_total`
   - Affichage : Montant en €

3. **Matériel sorti**
   - Source : `client_reservations`
   - Filtre : `start_at >= début du mois AND status IN ('CONFIRMED', 'AWAITING_BALANCE')`
   - Affichage : `X / 45` (45 = total matériel fixe)

4. **Retours en retard**
   - Source : `client_reservations`
   - Filtre : `end_at < aujourd'hui AND status IN ('CONFIRMED', 'AWAITING_BALANCE')`
   - Affichage : Compteur

##### AUTOMATISATION (3 sections)

1. **Solde à payer (J-5)**
   - Filtre :
     - `deposit_paid_at IS NOT NULL` (acompte payé)
     - `balance_paid_at IS NULL` (solde non payé)
     - `balance_due_at <= maintenant` (date échéance atteinte)
   - Affichage : Liste des réservations avec pack, email, montant, date échéance
   - Actions : Bouton pour déclencher paiement solde (si endpoint existe)

2. **Caution à demander (J-2)**
   - Filtre :
     - `deposit_requested_at IS NOT NULL` (date caution définie)
     - `deposit_requested_at <= maintenant` (date atteinte)
     - `deposit_session_id IS NULL` (caution non encore demandée)
     - `status IN ('AWAITING_BALANCE', 'CONFIRMED')`
   - Affichage : Liste des réservations avec pack, email, montant caution
   - Actions : Bouton pour déclencher demande caution (si endpoint existe)

3. **Événements cette semaine**
   - Filtre :
     - `start_at >= aujourd'hui AND start_at <= aujourd'hui + 7 jours`
     - `status IN ('CONFIRMED', 'AWAITING_BALANCE')`
   - Affichage : Liste des événements avec date, pack, email
   - Actions : Lien vers détail réservation

##### RÉSERVATIONS À VENIR (liste)

- Source : `client_reservations`
- Filtre : `start_at >= aujourd'hui AND start_at <= aujourd'hui + 30 jours`
- Limite : 50 résultats
- Tri : `start_at` croissant
- Affichage : Carte par réservation avec :
  - Pack + Date + Lieu
  - Statut (badge coloré)
  - Actions rapides : Voir détails, Télécharger contrat, Télécharger facture

##### MATÉRIEL EN COURS (liste)

- Source : `client_reservations`
- Filtre : `start_at <= aujourd'hui AND end_at >= aujourd'hui AND status IN ('CONFIRMED', 'AWAITING_BALANCE')`
- Limite : 5 résultats
- Tri : `end_at` croissant
- Affichage : Carte par réservation avec :
  - Pack + Date retour prévue
  - Statut retour (En cours / Retour aujourd'hui / Retour en retard)
  - Actions : Contacter client

##### CLIENTS RÉCENTS (liste)

- Source : `orders` liés à `client_reservations`
- Filtre : `client_reservation_id IS NOT NULL`
- Limite : 10 résultats
- Tri : `created_at` décroissant
- Groupement : Par `customer_email`
- Affichage : Carte par client avec :
  - Nom + Email
  - Nombre de réservations
  - CA total
  - Date dernière commande

##### PLANNING MOIS (calendrier)

- Source : `client_reservations`
- Filtre : `start_at` dans le mois en cours
- Génération : Calendrier mensuel avec jours marqués si réservation
- Affichage : Grille calendrier avec :
  - Jours du mois
  - Jours avec réservations (badge coloré)
  - Jour actuel (surligné)

#### Hooks utilisés

- `useUser()` : Récupération utilisateur connecté
- `useAdmin()` : Vérification droits admin (`isAdmin`, `checkingAdmin`)
- `useAuth()` : Fonctions d'authentification
- `useRouter()` : Navigation Next.js

#### États React

```typescript
const [stats, setStats] = useState({
  upcomingReservations: 0,
  revenueThisMonth: 0,
  equipmentOut: 0,
  totalEquipment: 45,
  lateReturns: 0,
});
const [upcomingReservations, setUpcomingReservations] = useState<any[]>([]);
const [equipmentStatus, setEquipmentStatus] = useState<any[]>([]);
const [recentClients, setRecentClients] = useState<any[]>([]);
const [calendarData, setCalendarData] = useState<any[]>([]);
const [balanceDueReservations, setBalanceDueReservations] = useState<any[]>([]);
const [depositDueReservations, setDepositDueReservations] = useState<any[]>([]);
const [weekEvents, setWeekEvents] = useState<any[]>([]);
const [pendingActions, setPendingActions] = useState({
  pendingReservations: 0,
  contractsToSign: 0,
  conditionReportsToReview: 0,
  deliveriesInProgress: 0,
  pendingCancellations: 0,
  pendingModifications: 0,
  pendingProRequests: 0,
  pendingReservationRequests: 0,
});
```

#### Logique de chargement des données

1. **Vérification admin** (`useEffect` sur `checkingAdmin`)
   - Redirection vers `/dashboard` si non admin

2. **Chargement données** (`useEffect` sur `user` + `checkingAdmin`)
   - **12 requêtes parallèles** vers Supabase :
     1. Réservations à venir (30 jours)
     2. Orders récents (100 max)
     3. Compteur réservations à venir
     4. Réservations créées ce mois (pour CA)
     5. Matériel sorti ce mois
     6. Retours en retard
     7. Orders récents liés à `client_reservations`
     8. Matériel en cours
     9. Planning mois (calendrier)
     10. Solde à payer (J-5)
     11. Caution à demander (J-2)
     12. Événements semaine (7 jours)
   - Traitement des données :
     - Association `orders` ↔ `client_reservations` via `client_reservation_id`
     - Groupement clients par email
     - Calcul CA mensuel
     - Génération calendrier

3. **Chargement demandes réservation** (séparé)
   - Appel `/api/admin/reservation-requests`
   - Filtre : `status === 'NEW' || status === 'PENDING_REVIEW'`
   - Exclusion des demandes déjà vues (localStorage)
   - Affichage notification si nouvelles demandes

#### Interactions admin

- **Clic "Voir détails réservation"** :
  - Redirection vers `/admin/reservations/[id]`

- **Clic "Télécharger contrat"** :
  - Ouverture nouvelle fenêtre vers `/api/contract/download?clientReservationId=xxx`

- **Clic "Télécharger facture"** :
  - Ouverture nouvelle fenêtre vers `/api/invoice/download?orderId=xxx`

- **Clic "Déclencher paiement solde"** :
  - Appel API `/api/payments/create-balance-session` (si endpoint existe)

- **Clic "Déclencher caution"** :
  - Appel API `/api/payments/create-security-deposit-session` (si endpoint existe)

---

## Pages associées

### Dashboard User - Pages spécialisées

#### 1. `/mes-reservations` (`app/mes-reservations/page.tsx`)

**Contenu :**
- Liste complète des réservations (anciennes + nouvelles)
- Filtre par statut, recherche par texte
- Pagination (2 par page)
- Modal détail réservation avec :
  - Informations complètes
  - Documents (contrat, factures, état des lieux)
  - Actions (annuler, modifier, signer contrat)

**Données chargées :**
- `reservations` : `user_id = user.id`, exclure `PENDING`
- `client_reservations` : `user_id = user.id OR customer_email = user.email`, statut `PAID` ou `CONFIRMED`
- Adaptation : `client_reservations` → format `reservations` (champs `start_date`, `end_date`, `total_price`, `pack_id`)

**Composants utilisés :**
- `DashboardSidebar`
- `CancelRequestModal`
- `ChangeRequestModal`
- `DocumentsPanel` (dans modal détail)

#### 2. `/mes-factures` (`app/mes-factures/page.tsx`)

**Contenu :**
- Liste des factures (`orders`) liées à l'utilisateur
- Association avec réservations (anciennes + nouvelles)
- Filtre par recherche, pagination (2 par page)
- Téléchargement PDF facture

**Données chargées :**
- `orders` : `customer_email = user.email`
- `reservations` : Pour association via `reservation_id`
- `client_reservations` : Pour association via `client_reservation_id`
- Mapping : `orderToReservationMap` et `orderToClientReservationMap`

**Logique d'association :**
1. Priorité 1 : `order.client_reservation_id` → `client_reservations`
2. Priorité 2 : `order.reservation_id` → `reservations`
3. Fallback : `order.metadata` (si présent)

#### 3. `/mes-contrats` (`app/mes-contrats/page.tsx`)

**Contenu :**
- Liste des contrats signés (anciennes + nouvelles réservations)
- Filtre par recherche, pagination (2 par page)
- Téléchargement PDF contrat
- Bouton "Signer" si contrat non signé

**Données chargées :**
- `reservations` : `user_id = user.id`, `client_signature IS NOT NULL`
- `client_reservations` : `user_id = user.id OR customer_email = user.email`, `client_signature IS NOT NULL`
- Adaptation : Format unifié pour affichage

**Actions :**
- Télécharger contrat → `/api/contract/download?reservationId=xxx` ou `?clientReservationId=xxx`
- Signer contrat → `/sign-contract?reservationId=xxx` ou `?clientReservationId=xxx`

#### 4. `/mes-etats-lieux` (`app/mes-etats-lieux/page.tsx`)

**Contenu :**
- Liste des états des lieux liés aux réservations
- Téléchargement PDF état des lieux

**Données chargées :**
- `etat_lieux` : Via `reservation_id` (anciennes réservations uniquement)
- Note : Pas encore de support pour `client_reservations` (à venir)

#### 5. `/mes-livraisons` (`app/mes-livraisons/page.tsx`)

**Contenu :**
- Liste des livraisons en cours
- Statut de livraison, dates prévues

**Données chargées :**
- `reservations` : `user_id = user.id`, `delivery_status` défini
- Note : Pas encore de support pour `client_reservations` (à venir)

#### 6. `/mes-informations` (`app/mes-informations/page.tsx`)

**Contenu :**
- Formulaire édition profil utilisateur
- Informations : Nom, email, téléphone, adresse

**Données chargées :**
- `user_profiles` : `user_id = user.id`

### Dashboard Admin - Pages spécialisées

#### 1. `/admin/reservations` (`app/admin/reservations/page.tsx`)

**Contenu :**
- Liste complète des réservations (anciennes + nouvelles)
- Filtre par statut, recherche par texte
- Pagination (5 par page)
- Modal détail réservation avec :
  - Informations complètes
  - Documents (contrat, factures, état des lieux)
  - Actions admin (valider, ajuster pack, déclencher paiements)
  - Bouton "Ajuster le pack" → Ouvre `AdjustReservationModal`

**Données chargées :**
- `client_reservations` : Toutes (admin)
- `reservations` : Toutes (admin)
- `orders` : Pour association
- `etat_lieux` : Pour association (anciennes réservations)

**Composants utilisés :**
- `AdminSidebar`
- `DocumentsPanel` (dans modal détail)
- `AdjustReservationModal` (pour ajuster `final_items`)

**Actions admin :**
- Valider réservation → Changement statut
- Ajuster pack → Modal avec édition `final_items`, calcul prix, génération `customer_summary`
- Télécharger documents → Contrat, factures, état des lieux
- Déclencher paiements → Solde, caution

#### 2. `/admin/factures` (`app/admin/factures/page.tsx`)

**Contenu :**
- Liste complète des factures (`orders`)
- Association avec réservations (anciennes + nouvelles)
- Filtre par recherche, pagination (4 par page)
- Téléchargement PDF facture
- Création facture manuelle (modal)

**Données chargées :**
- `orders` : Toutes (admin)
- `reservations` : Pour association
- `client_reservations` : Pour association

#### 3. `/admin/contrats` (`app/admin/contrats/page.tsx`)

**Contenu :**
- Liste complète des contrats signés (anciennes + nouvelles réservations)
- Filtre par recherche, pagination (4 par page)
- Téléchargement PDF contrat
- Envoi email contrat (si endpoint existe)

**Données chargées :**
- `reservations` : `client_signature IS NOT NULL`
- `client_reservations` : `client_signature IS NOT NULL`
- `orders` : Pour enrichissement (nom client, email)

#### 4. `/admin/reservation-requests` (`app/admin/reservation-requests/page.tsx`)

**Contenu :**
- Liste des demandes de réservation (`reservation_requests`)
- Filtre par statut (`NEW`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`)
- Actions : Approuver, Rejeter, Ajuster

**Données chargées :**
- `reservation_requests` : Toutes (admin)

**Note :** Cette page concerne l'ancien système de demandes. Le nouveau système utilise directement `client_reservations`.

#### 5. `/admin/clients` (`app/admin/clients/page.tsx`)

**Contenu :**
- Liste des clients (groupés par email)
- Statistiques par client : Nombre réservations, CA total
- Détail client : Page `/admin/clients/[email]`

**Données chargées :**
- `orders` : Groupement par `customer_email`
- Calcul : Nombre réservations, CA total

#### 6. `/admin/planning` (`app/admin/planning/page.tsx`)

**Contenu :**
- Vue calendrier mensuel avec réservations
- Filtre par mois, navigation mois précédent/suivant
- Clic sur jour → Liste réservations du jour

**Données chargées :**
- `client_reservations` : Filtre par mois sélectionné

#### 7. `/admin/packs` (`app/admin/packs/page.tsx`)

**Contenu :**
- Liste des packs disponibles
- Création/édition packs
- Configuration : Items inclus, prix, durée

**Données chargées :**
- `packs` : Toutes (admin)

#### 8. `/admin/catalogue` (`app/admin/catalogue/page.tsx`)

**Contenu :**
- Liste des produits du catalogue
- Création/édition produits
- Configuration : Nom, description, prix, stock

**Données chargées :**
- `catalog` : Toutes (admin)

---

## Composants réutilisables

### 1. `DocumentsPanel` (`components/DocumentsPanel.tsx`)

**Props :**
```typescript
interface DocumentsPanelProps {
  context: 'user' | 'admin';
  reservation: {
    id: string;
    client_signature?: string | null;
    client_signed_at?: string | null;
    status?: string;
    type?: 'client_reservation' | 'reservation';
  };
  orders?: Array<{
    id: string;
    created_at: string;
    total: string | number;
    reservation_id?: string | null;
    client_reservation_id?: string | null;
  }>;
  etatLieux?: {
    id: string;
    created_at: string;
  } | null;
  language?: 'fr' | 'en';
}
```

**Fonctionnalités :**
- Détection automatique type réservation (`client_reservation` vs `reservation`)
- Affichage contrat : Télécharger (si signé) / Signer (si non signé et user)
- Affichage factures : Liste (max 3) avec téléchargement
- Affichage état des lieux : Télécharger si disponible
- URLs adaptatives selon type réservation

**Utilisation :**
- `app/dashboard/page.tsx` (Section "Mes Documents")
- `app/admin/reservations/page.tsx` (Modal détail)
- `app/mes-reservations/page.tsx` (Modal détail)

### 2. `DashboardSidebar` (`components/DashboardSidebar.tsx`)

**Props :**
```typescript
interface DashboardSidebarProps {
  language: 'fr' | 'en';
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingActions?: {
    reservationsWithContractsToSign?: number;
    deliveriesNotReturned?: number;
    conditionReportsToReview?: number;
    newInvoices?: number;
    contractsToSign?: number;
  };
}
```

**Fonctionnalités :**
- Navigation user : Accueil, Réservations, Livraisons, États des lieux, Factures, Contrats, Informations
- Badges de notification sur liens (compteurs)
- Mode collapsed/expanded (localStorage)
- Responsive mobile (drawer)

**Utilisation :**
- Toutes les pages user (`/dashboard`, `/mes-reservations`, etc.)

### 3. `AdminSidebar` (`components/AdminSidebar.tsx`)

**Props :**
```typescript
interface AdminSidebarProps {
  language: 'fr' | 'en';
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingActions?: {
    pendingReservations?: number;
    pendingReservationRequests?: number;
    contractsToSign?: number;
    pendingProRequests?: number;
    pendingCancellations?: number;
    pendingModifications?: number;
  };
}
```

**Fonctionnalités :**
- Navigation admin : Accueil, Réservations, Demandes, Catalogue, Packs, Planning, Clients, Pro, Factures, Contrats, Livraisons, États des lieux, Paramètres
- Badges de notification sur liens (compteurs)
- Mode collapsed/expanded (localStorage)
- Responsive mobile (drawer)

**Utilisation :**
- Toutes les pages admin (`/admin`, `/admin/reservations`, etc.)

### 4. `AdjustReservationModal` (`components/admin/AdjustReservationModal.tsx`)

**Props :**
```typescript
interface AdjustReservationModalProps {
  reservation: any; // client_reservation
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Fonctionnalités :**
- Édition `final_items` (pack + extras)
- Calcul live : `base_pack_price`, `extras_total`, `price_total`, `deposit`, `balance`
- Validation : Quantité >= 1, prix >= 0, label non vide
- Sauvegarde : POST `/api/admin/client-reservations/adjust`
- Génération automatique `customer_summary`

**Utilisation :**
- `app/admin/reservations/page.tsx` (Modal détail)

### 5. `Header` (`components/Header.tsx`)

**Fonctionnalités :**
- Logo SoundRush
- Navigation principale (Home, Packs, Pro, etc.)
- Panier (badge compteur)
- Sélecteur langue (FR/EN)
- Bouton connexion/inscription

**Utilisation :**
- Toutes les pages (user + admin)

### 6. `Footer` (`components/Footer.tsx`)

**Fonctionnalités :**
- Liens légaux (CGV, Mentions légales, Politique confidentialité)
- Informations contact
- Réseaux sociaux

**Utilisation :**
- Toutes les pages (user + admin)

### 7. `SignModal` (`components/auth/SignModal.tsx`)

**Props :**
```typescript
interface SignModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
  isAdmin?: boolean;
  onSuccess?: () => void;
  onOpenUserModal?: () => void;
}
```

**Fonctionnalités :**
- Connexion (email/password, magic link)
- Inscription (email/password)
- Réinitialisation mot de passe
- Mode admin/user (bifurcation)

**Utilisation :**
- Toutes les pages nécessitant authentification

---

## Hooks personnalisés

### 1. `useUser` (`hooks/useUser.ts`)

**Fonctionnalités :**
- Récupération utilisateur connecté via Supabase Auth
- Écoute changements session (connexion/déconnexion)
- Retour : `{ user, loading, error }`

**Utilisation :**
- Toutes les pages nécessitant authentification

### 2. `useAdmin` (`hooks/useAdmin.ts`)

**Fonctionnalités :**
- Vérification droits admin via Supabase RLS ou table `user_profiles`
- Retour : `{ isAdmin, checkingAdmin }`

**Utilisation :**
- Toutes les pages admin

### 3. `useAuth` (`hooks/useAuth.ts`)

**Fonctionnalités :**
- Fonctions authentification :
  - `signUpWithEmail(email, password)`
  - `signInWithEmail(email, password)`
  - `signInWithMagicLink(email)`
  - `resetPasswordForEmail(email)`
  - `signOut()`
- Gestion URLs de redirection (validation robuste)
- Gestion `sessionStorage` pour panier après auth

**Utilisation :**
- `SignModal`, pages d'authentification

### 4. `useSidebarCollapse` (`hooks/useSidebarCollapse.ts`)

**Fonctionnalités :**
- Gestion état sidebar (collapsed/expanded)
- Persistance dans `localStorage`
- Retour : `{ isCollapsed, toggleSidebar }`

**Utilisation :**
- `DashboardSidebar`, `AdminSidebar`

### 5. `useChat` (`hooks/useChat.ts`)

**Fonctionnalités :**
- Gestion état chat (messages, pack sélectionné, draft réservation)
- Persistance dans `localStorage`
- Fonctions : `openChatWithPack(packKey)`, `canCheckout()`

**Utilisation :**
- `FloatingChatWidget`, pages packs

---

## API Routes

### Routes User

#### `/api/payments/create-checkout-session` (POST)

**Body :**
```json
{
  "reservation_id": "uuid" // client_reservation.id
}
```

**Fonctionnalités :**
- Création session Stripe Checkout pour acompte 30%
- Upsert `client_reservations` (statut `AWAITING_PAYMENT`)
- Stockage `stripe_session_id`
- Retour : `{ url: "https://checkout.stripe.com/..." }`

#### `/api/payments/create-balance-session` (POST)

**Body :**
```json
{
  "reservation_id": "uuid" // client_reservation.id
}
```

**Fonctionnalités :**
- Création session Stripe Checkout pour solde restant
- Retour : `{ url: "https://checkout.stripe.com/..." }`

#### `/api/payments/create-security-deposit-session` (POST)

**Body :**
```json
{
  "reservation_id": "uuid" // client_reservation.id
}
```

**Fonctionnalités :**
- Création session Stripe Checkout pour caution
- Retour : `{ url: "https://checkout.stripe.com/..." }`

#### `/api/payments/verify-session` (GET)

**Query params :**
- `session_id` : Stripe session ID
- `reservation_id` : client_reservation.id

**Fonctionnalités :**
- Vérification statut paiement Stripe
- Retour : `{ paid: boolean }`

#### `/api/contract/download` (GET)

**Query params :**
- `reservationId` : ID réservation (ancienne table)
- `clientReservationId` : ID client_reservation (nouvelle table)

**Fonctionnalités :**
- Génération PDF contrat
- Support dual-ID (ancienne + nouvelle table)
- Inclusion signature client si présente
- Retour : PDF binaire

#### `/api/contract/sign` (POST)

**Body :**
```json
{
  "reservationId": "uuid" // OU
  "clientReservationId": "uuid",
  "signature": "base64_image"
}
```

**Fonctionnalités :**
- Enregistrement signature client
- Mise à jour `client_signature` et `client_signed_at`
- Vérification ownership (user_id ou customer_email)
- Retour : `{ success: boolean }`

#### `/api/invoice/download` (GET)

**Query params :**
- `orderId` : ID order

**Fonctionnalités :**
- Génération PDF facture
- Utilisation `final_items` si `client_reservation` liée
- Retour : PDF binaire

#### `/api/etat-lieux/download` (GET)

**Query params :**
- `etatLieuxId` : ID etat_lieux

**Fonctionnalités :**
- Génération PDF état des lieux
- Retour : PDF binaire

### Routes Admin

#### `/api/admin/client-reservations/adjust` (POST)

**Body :**
```json
{
  "id": "uuid", // client_reservation.id
  "final_items": [
    {
      "id": "string",
      "label": "string",
      "qty": number,
      "unitPrice": number,
      "isExtra": boolean,
      "note": "string"
    }
  ],
  "admin_note": "string" // optionnel
}
```

**Fonctionnalités :**
- Ajustement `final_items` et prix
- Calcul automatique : `base_pack_price`, `extras_total`, `price_total`, `balance_amount`
- Génération `customer_summary`
- Mise à jour `final_validated_at`
- Vérification admin (service role)
- Retour : `{ success: boolean, reservation: {...} }`

#### `/api/admin/reservation-requests` (GET)

**Headers :**
- `Authorization: Bearer <token>`

**Fonctionnalités :**
- Liste des demandes de réservation
- Filtre par statut
- Retour : `{ requests: [...] }`

#### `/api/admin/reservation-requests/[id]` (GET/POST)

**Fonctionnalités :**
- Détail demande réservation
- Actions : Approuver, Rejeter, Ajuster

### Routes Webhooks

#### `/api/webhooks/stripe` (POST)

**Fonctionnalités :**
- Écoute événements Stripe
- Mise à jour `client_reservations` :
  - `deposit_paid_at` (acompte payé)
  - `balance_paid_at` (solde payé)
  - `deposit_session_id` (caution)
  - Statut (`AWAITING_BALANCE`, `CONFIRMED`, `PAID`)
- Création `orders` avec `client_reservation_id`

---

## Flux de données

### Flux création réservation (Chat → Paiement → Dashboard)

```
1. CLIENT : Clic "Réserver" sur pack (Home)
   ↓
2. CHAT : Collecte infos (date, lieu, téléphone)
   ↓
3. CHAT : Clic "Payer l'acompte 30%"
   ↓
4. API : POST /api/payments/create-checkout-session
   - Upsert client_reservations (status: AWAITING_PAYMENT)
   - Création session Stripe
   ↓
5. STRIPE : Paiement acompte
   ↓
6. WEBHOOK : POST /api/webhooks/stripe
   - Mise à jour client_reservations :
     * deposit_paid_at = now()
     * status = AWAITING_BALANCE
     * balance_due_at = start_at - 5 jours
   - Création order (client_reservation_id)
   ↓
7. REDIRECTION : /dashboard?payment=success&reservation_id=xxx
   ↓
8. DASHBOARD : Polling statut + rechargement données
   ↓
9. AFFICHAGE : Section "Mes Paiements" avec acompte ✅
```

### Flux ajustement pack (Admin)

```
1. ADMIN : Clic "Ajuster le pack" (modal détail réservation)
   ↓
2. MODAL : Édition final_items (pack + extras)
   - Calcul live : base_pack_price, extras_total, price_total
   ↓
3. ADMIN : Clic "Enregistrer"
   ↓
4. API : POST /api/admin/client-reservations/adjust
   - Mise à jour client_reservations :
     * final_items = [...]
     * base_pack_price = calculé
     * extras_total = calculé
     * price_total = calculé
     * balance_amount = recalculé (si acompte payé)
     * customer_summary = généré
     * final_validated_at = now()
   ↓
5. RETOUR : Modal fermé, données rechargées
   ↓
6. USER : Dashboard affiche "Contenu de la prestation" avec final_items
```

### Flux signature contrat

```
1. USER : Clic "Signer le contrat" (Dashboard ou /mes-contrats)
   ↓
2. REDIRECTION : /sign-contract?clientReservationId=xxx
   ↓
3. PAGE : Affichage PDF contrat (via /api/contract/download)
   ↓
4. USER : Dessine signature sur canvas
   ↓
5. USER : Clic "Signer"
   ↓
6. API : POST /api/contract/sign
   - Vérification ownership (user_id ou customer_email)
   - Mise à jour client_reservations :
     * client_signature = base64_image
     * client_signed_at = now()
   ↓
7. RETOUR : /dashboard ou /mes-contrats
   ↓
8. AFFICHAGE : Badge "Contrat signé" ✅
```

### Flux paiement solde (J-5)

```
1. AUTOMATISATION : Détection balance_due_at <= maintenant
   ↓
2. ADMIN : Affichage dans section "Solde à payer (J-5)"
   ↓
3. ADMIN : Clic "Déclencher paiement solde" (si endpoint existe)
   OU
3. USER : Clic "Payer le solde maintenant" (Dashboard)
   ↓
4. API : POST /api/payments/create-balance-session
   - Création session Stripe Checkout pour solde
   ↓
5. STRIPE : Paiement solde
   ↓
6. WEBHOOK : POST /api/webhooks/stripe
   - Mise à jour client_reservations :
     * balance_paid_at = now()
     * status = CONFIRMED (si caution pas nécessaire)
   - Création order (client_reservation_id)
   ↓
7. REDIRECTION : /dashboard?payment=success&reservation_id=xxx
   ↓
8. AFFICHAGE : Solde ✅ dans "Mes Paiements"
```

---

## Interactions entre pages

### Navigation User

```
/dashboard
  ├─> /mes-reservations (via sidebar ou accès rapide)
  │     └─> /mes-reservations/[id] (détail réservation)
  ├─> /mes-factures (via sidebar ou accès rapide)
  ├─> /mes-contrats (via sidebar ou accès rapide)
  │     └─> /sign-contract?clientReservationId=xxx (signer)
  ├─> /mes-etats-lieux (via sidebar)
  ├─> /mes-livraisons (via sidebar)
  └─> /mes-informations (via sidebar)
```

### Navigation Admin

```
/admin
  ├─> /admin/reservations (via sidebar)
  │     └─> /admin/reservations/[id] (détail réservation)
  │     └─> /admin/reservations/nouvelle (création manuelle)
  ├─> /admin/reservation-requests (via sidebar)
  │     └─> /admin/reservation-requests/[id] (détail demande)
  ├─> /admin/factures (via sidebar)
  │     └─> /admin/factures/nouvelle (création manuelle)
  ├─> /admin/contrats (via sidebar)
  ├─> /admin/clients (via sidebar)
  │     └─> /admin/clients/[email] (détail client)
  ├─> /admin/planning (via sidebar)
  ├─> /admin/packs (via sidebar)
  │     └─> /admin/packs/nouveau (création pack)
  ├─> /admin/catalogue (via sidebar)
  │     └─> /admin/catalogue/nouveau (création produit)
  ├─> /admin/livraisons (via sidebar)
  ├─> /admin/etats-des-lieux (via sidebar)
  │     └─> /admin/etats-des-lieux/[id] (détail état des lieux)
  └─> /admin/parametres (via sidebar)
```

### Redirections conditionnelles

- **User non connecté** → `/` (accueil)
- **User non admin sur page admin** → `/dashboard`
- **Admin non connecté** → Modal connexion admin
- **Retour paiement Stripe** → `/dashboard?payment=success&reservation_id=xxx`
- **Après signature contrat** → `/dashboard` ou `/mes-contrats`

---

## Notes importantes

### Compatibilité dual-ID

- **Documents (contrat, facture)** : Support `reservationId` (ancienne table) ET `clientReservationId` (nouvelle table)
- **Association orders ↔ réservations** : Priorité `client_reservation_id` > `reservation_id` > `metadata`
- **Signature contrat** : Champs `client_signature` et `client_signed_at` dans les deux tables

### Performance

- **Requêtes parallèles** : Utilisation `Promise.all` pour charger plusieurs données simultanément
- **Limites** : Réservations (50 max), Orders (100 max) pour éviter surcharge
- **Chargement différé** : États des lieux chargés en arrière-plan après rendu initial
- **Optimisation colonnes** : Sélection colonnes spécifiques au lieu de `*` quand possible

### Sécurité

- **RLS Supabase** : User peut SELECT ses propres `client_reservations` (user_id ou customer_email)
- **Admin** : Vérification via `useAdmin()` hook (table `user_profiles` ou RLS)
- **API Admin** : Vérification service role ou token admin
- **Ownership** : Vérification ownership avant signature contrat (user_id ou customer_email)

### État local (localStorage)

- **Sidebar collapsed** : `adminSidebarCollapsed`, `sidebarCollapsed`
- **Vues consultées** : `viewed_contracts`, `viewed_invoices`, `viewed_deliveries`, `viewed_condition_reports`
- **Demandes admin vues** : `admin_viewed_reservations`, `admin_viewed_cancellations`, `admin_viewed_modifications`, `admin_viewed_reservation_requests`
- **Panier** : `sndrush_cart` (legacy, à migrer vers sessionStorage)

---

## Conclusion

Cette documentation couvre l'ensemble de la structure des dashboards user et admin, leurs interactions, composants, hooks, API routes et flux de données. Elle sert de référence pour comprendre et maintenir le système SoundRush.

**Points clés à retenir :**
- **Source de vérité** : `client_reservations` pour le nouveau système, `reservations` pour l'ancien (legacy)
- **Compatibilité** : Support dual-ID pour documents et associations
- **Performance** : Requêtes parallèles, limites, chargement différé
- **Sécurité** : RLS Supabase, vérification admin, ownership
- **UX** : Badges notifications, modals, pagination, recherche
