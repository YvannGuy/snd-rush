# 📚 Documentation Complète : Dashboard Admin, Dashboard User & Homepage

## 📋 Table des matières

1. [Dashboard Admin - Structure Complète](#dashboard-admin)
2. [Dashboard User - Structure Complète](#dashboard-user)
3. [Homepage - Structure & Interactions](#homepage)
4. [Interactions entre les systèmes](#interactions)

---

## 🎛️ DASHBOARD ADMIN

### 📁 Structure des fichiers

```
app/admin/
├── page.tsx                          # Dashboard principal admin
├── reservations/
│   ├── page.tsx                      # Liste des réservations
│   ├── [id]/page.tsx                 # Détail d'une réservation
│   └── nouvelle/page.tsx             # Créer une nouvelle réservation
├── reservation-requests/
│   ├── page.tsx                      # Liste des demandes de réservation
│   └── [id]/page.tsx                 # Détail d'une demande
├── catalogue/
│   ├── page.tsx                      # Liste des produits
│   └── nouveau/page.tsx              # Créer un produit
├── packs/
│   ├── page.tsx                      # Liste des packs
│   └── nouveau/page.tsx              # Créer un pack
├── planning/
│   └── page.tsx                      # Planning & disponibilités
├── clients/
│   ├── page.tsx                      # Liste des clients
│   └── [email]/page.tsx              # Détail d'un client
├── pro/
│   └── page.tsx                      # Accès Pro
├── factures/
│   ├── page.tsx                      # Liste des factures
│   └── nouvelle/page.tsx             # Créer une facture
├── contrats/
│   └── page.tsx                      # Liste des contrats
├── livraisons/
│   └── page.tsx                      # Liste des livraisons
├── etats-des-lieux/
│   ├── page.tsx                      # Liste des états des lieux
│   └── [id]/page.tsx                 # Détail d'un état des lieux
├── paiement/
│   ├── page.tsx                      # Gestion paiements
│   └── success/page.tsx              # Succès paiement
└── parametres/
    └── page.tsx                      # Paramètres admin

components/
└── AdminSidebar.tsx                  # Sidebar navigation admin
```

---

### 🗂️ AdminSidebar - Navigation Complète

**Fichier** : `components/AdminSidebar.tsx`

#### Sections du Sidebar (dans l'ordre) :

1. **Tableau de bord** (`/admin`)
   - Icône : Maison
   - Badge : Aucun
   - Description : Vue d'ensemble avec stats et actions rapides

2. **Réservations** (`/admin/reservations`)
   - Icône : Calendrier
   - Badge : `pendingReservations + pendingCancellations + pendingModifications`
   - Description : Gestion des réservations (client_reservations + reservations legacy)

3. **Demandes de réservation** (`/admin/reservation-requests`)
   - Icône : Clipboard
   - Badge : `pendingReservationRequests` (NEW ou PENDING_REVIEW)
   - Description : Demandes initiales depuis le chat

4. **Catalogue produits** (`/admin/catalogue`)
   - Icône : Cube
   - Badge : Aucun
   - Description : Gestion du catalogue produits

5. **Packs** (`/admin/packs`)
   - Icône : Package
   - Badge : Aucun
   - Description : Gestion des packs (conference, soiree, mariage)

6. **Planning & Disponibilités** (`/admin/planning`)
   - Icône : Calendrier
   - Badge : Aucun
   - Description : Vue calendrier et disponibilités

7. **Clients** (`/admin/clients`)
   - Icône : Users
   - Badge : Aucun
   - Description : Liste des clients et historique

8. **Accès Pro** (`/admin/pro`)
   - Icône : Briefcase
   - Badge : `pendingProRequests`
   - Description : Demandes d'accès professionnel

9. **Factures** (`/admin/factures`)
   - Icône : Document
   - Badge : Aucun
   - Description : Liste et génération de factures

10. **Contrats** (`/admin/contrats`)
    - Icône : Document signé
    - Badge : `contractsToSign` (contrats non signés par clients)
    - Description : Gestion des contrats et signatures

11. **Livraisons** (`/admin/livraisons`)
    - Icône : Truck
    - Badge : `deliveriesInProgress`
    - Description : Suivi des livraisons

12. **États des lieux** (`/admin/etats-des-lieux`)
    - Icône : Document checklist
    - Badge : `conditionReportsToReview`
    - Description : États des lieux à traiter

13. **Paiement** (`/admin/paiement`)
    - Icône : Carte bancaire
    - Badge : Aucun
    - Description : Gestion des paiements

14. **Paramètres** (`/admin/parametres`)
    - Icône : Settings
    - Badge : Aucun
    - Description : Configuration admin

#### Calcul des Pending Actions

Le sidebar calcule automatiquement les badges via `useEffect` :

```typescript
// Réservations en attente
const { data: pendingReservationsData } = await supabase
  .from('reservations')
  .select('id, status')
  .eq('status', 'PENDING');

// Contrats à signer
const { data: contractsData } = await supabase
  .from('reservations')
  .select('id, status, client_signature')
  .in('status', ['CONFIRMED', 'CONTRACT_PENDING'])
  .or('client_signature.is.null,client_signature.eq.');

// États des lieux à traiter
const { data: etatsLieuxData } = await supabase
  .from('etat_lieux')
  .select('id, status')
  .in('status', ['livraison_complete', 'reprise_complete']);

// Demandes de réservation (via API)
const response = await fetch('/api/admin/reservation-requests');
const newRequests = data.requests.filter(
  r => (r.status === 'NEW' || r.status === 'PENDING_REVIEW')
    && !viewedReservationRequests.includes(r.id)
);
```

**Refresh automatique** : Toutes les 30 secondes + événements `storage` et `pendingActionsUpdated`

---

### 📊 Page Dashboard Admin (`app/admin/page.tsx`)

#### Structure de la page :

1. **Header** (Desktop + Mobile)
   - Logo SoundRush
   - Menu hamburger (mobile)
   - AdminHeader component (desktop)

2. **Sidebar** (`AdminSidebar`)
   - Navigation complète (voir ci-dessus)
   - Collapsible (état sauvegardé dans localStorage)
   - Overlay mobile

3. **Contenu Principal** :

   **A. Notification Demandes de Réservation**
   - Affichée si `pendingReservationRequests > 0`
   - Badge bleu avec compteur
   - Bouton "Voir les demandes" → `/admin/reservation-requests`

   **B. Bouton "Nouvelle réservation"**
   - En haut à droite
   - Lien → `/admin/reservations/nouvelle`

   **C. Stats Cards (4 colonnes)** :
   - **Réservations à venir** : Compte des `client_reservations` dans les 30 prochains jours
   - **CA ce mois** : Somme des `price_total` depuis début du mois
   - **Matériel sorti** : Nombre de réservations actives ce mois
   - **Retours en retard** : Réservations avec `end_at < today`

   **D. Sections Automatisation (3 colonnes)** :
   - **Solde à payer (J-5)** : Réservations avec `balance_due_at <= now()` et solde non payé
   - **Cautions à demander (J-2)** : Réservations avec `deposit_requested_at <= now()` et caution non demandée
   - **Événements cette semaine** : Réservations confirmées dans les 7 prochains jours

   **E. Réservations à venir** (Card gauche) :
   - Liste des 3 prochaines réservations
   - Affichage : Pack, client, date, adresse, prix, statut
   - Clic → `/admin/reservations?reservation={id}`
   - Bouton accès documents rapide

   **F. Actions rapides** (Card droite) :
   - "+ Ajouter un produit" → `/admin/catalogue/nouveau`
   - "Créer un pack" → `/admin/packs/nouveau`

   **G. État du matériel** (Card gauche) :
   - Liste des matériels sortis (en cours)
   - Badge "Retour en retard" si `end_at < today`
   - Bouton "Contacter" si retard

   **H. Clients récents** (Card droite) :
   - Top 3 clients depuis `orders` liés à `client_reservations`
   - Affichage : Nom, nombre de réservations, total dépensé
   - Clic → `/admin/clients/{email}`

   **I. Planning des réservations** :
   - Calendrier mensuel
   - Jours avec réservations en bleu
   - Jour actuel en orange

#### Données chargées :

```typescript
// Requêtes parallèles (Promise.all)
1. client_reservations (prochaines 30 jours, limit 50)
2. orders (récents, limit 100)
3. Count réservations à venir
4. Réservations créées ce mois (pour CA)
5. Réservations démarrées ce mois (matériel sorti)
6. Retours en retard
7. Orders récents (clients)
8. Matériel actif
9. Planning mensuel
10. Solde à payer (J-5)
11. Cautions à demander (J-2)
12. Événements semaine
```

**Optimisations** :
- Requêtes en parallèle avec `Promise.all`
- Limites sur les requêtes (50-100 items max)
- Map pour recherche O(1) des orders par `client_reservation_id`

---

### 📄 Pages Admin Détailées

#### 1. `/admin/reservations` - Liste Réservations

**Fichier** : `app/admin/reservations/page.tsx`

**Fonctionnalités** :
- Liste des réservations (`client_reservations` + `reservations` legacy)
- Filtres : Statut, date, pack
- Recherche par email/nom
- Tri : Date, statut, prix
- Actions : Voir détail, télécharger contrat/facture, ajuster pack

**Modal d'ajustement** (`AdjustReservationModal`) :
- Éditer `final_items` (pack + extras)
- Calcul automatique : `base_pack_price`, `extras_total`, `price_total`
- Génération `customer_summary`
- API : `POST /api/admin/client-reservations/adjust`

#### 2. `/admin/reservation-requests` - Demandes de Réservation

**Fichier** : `app/admin/reservation-requests/page.tsx`

**Fonctionnalités** :
- Liste des demandes depuis le chat
- Statuts : NEW, PENDING_REVIEW, APPROVED, ADJUSTED, REJECTED
- Actions : Approuver, Ajuster, Rejeter
- Création automatique de `client_reservation` après approbation

#### 3. `/admin/clients` - Liste Clients

**Fichier** : `app/admin/clients/page.tsx`

**Fonctionnalités** :
- Liste des clients (depuis `orders.customer_email`)
- Statistiques : Nombre de réservations, total dépensé
- Clic → `/admin/clients/{email}` pour détail

#### 4. `/admin/factures` - Factures

**Fichier** : `app/admin/factures/page.tsx`

**Fonctionnalités** :
- Liste des factures (`orders`)
- Filtres : Date, statut, client
- Téléchargement PDF : `/api/invoice/download?orderId={id}`
- Lien vers réservation associée (via `client_reservation_id` ou `metadata`)

#### 5. `/admin/contrats` - Contrats

**Fichier** : `app/admin/contrats/page.tsx`

**Fonctionnalités** :
- Liste des contrats (réservations avec statut CONFIRMED)
- Filtre : Contrats non signés
- Téléchargement PDF : `/api/contract/download?reservationId={id}` ou `clientReservationId={id}`
- Suivi signature : `client_signature`, `client_signed_at`

---

## 👤 DASHBOARD USER

### 📁 Structure des fichiers

```
app/dashboard/
├── page.tsx                          # Dashboard principal user
├── prestation/
│   └── page.tsx                      # Détails de la prestation
├── paiements/
│   └── page.tsx                      # Liste des paiements
├── documents/
│   └── page.tsx                      # Liste des documents
└── support/
    └── page.tsx                      # Page support

components/
└── DashboardSidebar.tsx              # Sidebar navigation user
```

---

### 🗂️ DashboardSidebar User - Navigation

**Fichier** : `components/DashboardSidebar.tsx`

#### Sections du Sidebar (dans l'ordre) :

1. **Tableau de bord** (`/dashboard`)
   - Icône : Maison
   - Description : Vue d'ensemble avec prochaine étape

2. **Ma prestation** (`/dashboard/prestation`)
   - Icône : Music
   - Description : Détails de la prochaine prestation

3. **Paiements** (`/dashboard/paiements`)
   - Icône : DollarSign
   - Description : Liste des paiements en attente (acompte/solde)

4. **Documents** (`/dashboard/documents`)
   - Icône : FileText
   - Description : Contrats, factures, états des lieux

5. **Support** (`/dashboard/support`)
   - Icône : Headphones
   - Description : Contact support (téléphone, WhatsApp, email)

6. **Mes informations** (`/mes-informations`)
   - Icône : User
   - Description : Profil utilisateur et paramètres

**Note** : Pas de badges sur le sidebar user (simplifié)

---

### 📊 Page Dashboard User (`app/dashboard/page.tsx`)

#### Structure de la page :

1. **Header** (Desktop + Mobile)
   - Logo SoundRush
   - Menu hamburger (mobile)
   - Header component (desktop)

2. **Sidebar** (`DashboardSidebar`)
   - Navigation simplifiée
   - Collapsible

3. **Contenu Principal** :

   **A. Message de bienvenue**
   - "Bonjour {prénom} 👋"
   - Description de l'espace client

   **B. Message de succès paiement** (si `payment=success`)
   - Affiché après retour Stripe
   - Polling automatique du statut réservation
   - Masqué après 3 secondes

   **C. BLOC A : Prochaine étape** (Card orange)
   - Affichage de `nextView` (réservation prioritaire)
   - Pack label + summary
   - **CTA principal** selon `nextView.cta.action` :
     - `PAY_DEPOSIT` → Bouton "Payer l'acompte 30%"
     - `PAY_BALANCE` → Bouton "Payer le solde"
     - `SIGN_CONTRACT` → Bouton "Signer le contrat"
     - `CALL_SUPPORT` → Bouton "Appeler le support"
     - `NONE` → Message "Rien à faire pour le moment"

   **D. BLOC B : Ma prestation** (Card blanche)
   - Pack label
   - Date (format français)
   - Adresse
   - Summary (si disponible)
   - Bouton "Voir détails" → `/dashboard/prestation`

   **E. BLOC C : Mes Documents** (Card blanche)
   - Composant `DocumentsPanel` avec :
     - Contrat (signer/télécharger)
     - Factures (télécharger)
     - États des lieux (télécharger)
   - Lien "Voir tous mes documents" → `/dashboard/documents`

#### Données chargées :

```typescript
// Via loadDashboardData(user)
1. reservations (legacy)
2. client_reservations (nouvelles)
3. orders (via customer_email)
4. etat_lieux (via reservation_id)

// Mapping unifié
- ReservationView[] : Modèle unifié pour les deux types
- pickNextReservation() : Sélectionne la prochaine réservation prioritaire
- computePrimaryCTA() : Calcule l'action principale (paiement/signature/appel)
```

**Logique de priorité** :
1. Réservation avec acompte non payé → `PAY_DEPOSIT`
2. Réservation avec solde non payé → `PAY_BALANCE`
3. Réservation confirmée sans signature → `SIGN_CONTRACT`
4. Sinon → `CALL_SUPPORT` ou `NONE`

---

### 📄 Pages User Détailées

#### 1. `/dashboard/prestation` - Détails Prestation

**Fichier** : `app/dashboard/prestation/page.tsx`

**Contenu** :
- Pack label
- Date et heure (start_at, end_at)
- Adresse
- Summary (résumé client)
- `final_items` (si disponible) : Liste des items inclus + extras
- Badge "Validé" si `final_validated_at` non null
- Liens vers paiements et documents

#### 2. `/dashboard/paiements` - Paiements

**Fichier** : `app/dashboard/paiements/page.tsx`

**Contenu** :
- Liste des réservations avec paiements en attente
- Filtre : `depositPaid=false` ou `balancePaid=false`
- Actions :
  - "Payer l'acompte 30%" → `/api/payments/create-checkout-session`
  - "Payer le solde" → `/api/payments/create-balance-session`

#### 3. `/dashboard/documents` - Documents

**Fichier** : `app/dashboard/documents/page.tsx`

**Contenu** :
- Liste des 10 réservations récentes + toutes les à venir
- Pour chaque réservation : `DocumentsPanel`
- Liens vers pages legacy :
  - `/mes-contrats`
  - `/mes-factures`
  - `/mes-etats-lieux`

#### 4. `/dashboard/support` - Support

**Fichier** : `app/dashboard/support/page.tsx`

**Contenu** :
- Informations de contact :
  - Téléphone
  - WhatsApp
  - Email
- Horaires d'ouverture

---

## 🏠 HOMEPAGE

### 📁 Structure des fichiers

```
app/
├── page.tsx                          # Page d'accueil principale
└── layout.tsx                        # Layout global (inclut FloatingChatWidget)

components/
├── SolutionsSection.tsx              # Section 3 cards packs
├── FloatingChatWidget.tsx            # Widget chat flottant
├── FloatingChatButton.tsx            # Bouton pour ouvrir le chat
├── HeroSection.tsx                   # Section hero
├── IASection.tsx                     # Section IA
├── UrgencySection.tsx                # Section urgence
├── CommentCaMarcheSection.tsx        # Comment ça marche
├── PourQuiSection.tsx                # Pour qui
├── AboutSection.tsx                  # À propos
├── GallerySection.tsx                # Galerie
├── TrustedBySection.tsx              # Clients
├── TrustindexReviews.tsx             # Avis
└── ScenarioFAQSection.tsx            # FAQ scénarios
```

---

### 🎯 Page Homepage (`app/page.tsx`)

#### Structure de la page :

1. **SplashScreen** (affiché en premier)
   - Animation de chargement
   - Bloque le rendu jusqu'à `onComplete()`

2. **Header** (`Header` component)
   - Logo SoundRush
   - Navigation
   - Bouton connexion
   - Sélecteur langue (FR/EN)

3. **Sections** (dans l'ordre) :
   - **HeroSection** : Hero avec CTA principal
   - **IASection** : Présentation IA
   - **SolutionsSection** : **3 cards packs** ⭐
   - **UrgencySection** : Besoin urgent
   - **CommentCaMarcheSection** : Processus
   - **PourQuiSection** : Cibles
   - **AboutSection** : À propos
   - **GallerySection** : Vidéos
   - **TrustedBySection** : Clients
   - **TrustindexReviews** : Avis
   - **ScenarioFAQSection** : FAQ avec scénarios

4. **Footer** (`Footer` component)
   - Liens légaux
   - Modals : Mentions légales, CGV

5. **Modals** :
   - `ReservationModal` : Formulaire réservation (legacy)
   - `LegalNoticeModal` : Mentions légales
   - `RentalConditionsModal` : CGV

6. **CookieBanner** : Gestion cookies

---

### 🎴 SolutionsSection - 3 Cards Packs

**Fichier** : `components/SolutionsSection.tsx`

#### Structure des Cards :

**Card 1 : Pack Conférence** (ID: 1, packKey: 'conference')
- Image : Photo conférence
- Nom : "Solution Conférence"
- Description : "Pour réunions, conférences, prises de parole..."
- Features : Livraison, installation, support, récupération
- Prix : "À partir de 279 €"
- Note : "Acompte 30% pour bloquer votre date"
- Bouton : "✨ Préparer mon événement"
- Badge : Aucun

**Card 2 : Pack Soirée** (ID: 2, packKey: 'soiree')
- Image : Photo soirée
- Nom : "Solution Soirée"
- Description : "Pour soirées privées, anniversaires..."
- Features : Livraison, installation, support, récupération
- Prix : "À partir de 329 €"
- Note : "Acompte 30% pour bloquer votre date"
- Bouton : "✨ Préparer mon événement"
- Badge : **⭐ Recommandé**

**Card 3 : Pack Mariage** (ID: 3, packKey: 'mariage')
- Image : Photo mariage
- Nom : "Solution Mariage"
- Description : "Pour mariages, soirées DJ..."
- Features : Livraison, installation, support, récupération
- Prix : "À partir de 449 €"
- Note : "Acompte 30% pour bloquer votre date"
- Bouton : "✨ Préparer mon événement"
- Badge : Aucun

#### Interaction avec le Chat :

```typescript
// Clic sur bouton "Préparer mon événement"
const handleReservationRequest = (packKey: 'conference' | 'soiree' | 'mariage') => {
  // Nouveau système simplifié
  if (process.env.NEXT_PUBLIC_USE_SIMPLIFIED_CHAT === 'true') {
    window.dispatchEvent(new CustomEvent('openChatWithPack', { 
      detail: { packKey } 
    }));
  } else {
    // Ancien système (fallback)
    const packNameMap = {
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage'
    };
    const packName = packNameMap[packKey];
    const message = `Je souhaite faire une demande de réservation pour le ${packName}.`;
    
    window.dispatchEvent(new CustomEvent('openChatWithDraft', { 
      detail: { message, packKey } 
    }));
  }
};
```

**Mapping ID → packKey** :
- ID 1 → 'conference'
- ID 2 → 'soiree'
- ID 3 → 'mariage'

---

### 💬 FloatingChatWidget - Chat Flottant

**Fichier** : `components/FloatingChatWidget.tsx`

#### Événements écoutés :

1. **`openChatWithPack`** (nouveau système)
   ```typescript
   detail: { packKey: 'conference' | 'soiree' | 'mariage' }
   ```
   - Ouvre le chat avec le pack pré-sélectionné
   - Active le mode pack directement

2. **`openChatWithDraft`** (ancien système)
   ```typescript
   detail: { 
     message?: string,
     packKey?: string,
     scenarioId?: string
   }
   ```
   - Ouvre le chat avec un message pré-rempli
   - Injecte le message dans l'input

3. **`openAssistantModal`** (legacy)
   - Redirigé vers `openChatWithDraft`

4. **`openReservationModal`** (legacy)
   - Ouvre le modal de réservation (non utilisé dans le nouveau flow)

#### Flow du Chat :

**Phase 0 : Welcome**
- Message automatique : "Je te propose 3 packs: Conférence / Soirée / Mariage"
- Quick replies : 3 boutons (un par pack)

**Phase 1 : Collecte infos minimales**
- Date + horaire (`start_at`, `end_at`)
- Ville / code postal / département (`address`, `department`)
- Téléphone (obligatoire) (`customer_phone`)

**Phase 2 : Résumé**
- Pack choisi
- Date + lieu
- Total estimé
- Acompte 30% (montant)
- **CTA 1** : "Payer l'acompte 30%" (principal)
- **CTA 2** : "Appeler Soundrush" (secondaire)
- Mention : "solde J-5, caution J-2"

**Phase 3 : Paiement**
- Clic CTA 1 → Création `client_reservation` (status `AWAITING_PAYMENT`)
- Stripe checkout pour acompte 30%
- Après paiement : Webhook → `deposit_paid_at` + status `AWAITING_BALANCE`
- Clic CTA 2 → Ouvre `tel:` avec numéro

#### États du Chat :

- `isOpen` : Chat ouvert/fermé
- `isLoading` : Envoi message en cours
- `activePackKey` : Pack sélectionné ('conference' | 'soiree' | 'mariage')
- `reservationRequestDraft` : Draft de la réservation
- `availabilityStatus` : 'available' | 'unavailable' | 'checking'
- `availabilityDetails` : Détails de disponibilité

#### API utilisée :

- **`POST /api/chat`** : Envoi message (logique rule-based, pas OpenAI)
- **`POST /api/payments/create-checkout-session`** : Création session Stripe acompte
- **`POST /api/payments/create-balance-session`** : Création session Stripe solde
- **`POST /api/holds`** : Création hold temporaire (instant booking)
- **`POST /api/instant-reservations`** : Création réservation instantanée

---

## 🔄 INTERACTIONS ENTRE LES SYSTÈMES

### 1. Homepage → Chat → Dashboard User

```
Homepage (SolutionsSection)
    ↓ (clic bouton pack)
    ↓ (événement openChatWithPack)
FloatingChatWidget
    ↓ (collecte infos)
    ↓ (clic "Payer acompte 30%")
POST /api/payments/create-checkout-session
    ↓ (création client_reservation AWAITING_PAYMENT)
    ↓ (redirection Stripe)
Stripe Checkout
    ↓ (paiement réussi)
Webhook Stripe → /api/webhooks/stripe
    ↓ (mise à jour client_reservation)
    ↓ (status AWAITING_BALANCE, deposit_paid_at)
Redirection → /dashboard?payment=success&reservation_id={id}
Dashboard User
    ↓ (polling statut)
    ↓ (affichage réservation)
BLOC A : "Payer le solde" (CTA)
```

### 2. Dashboard User → Admin

```
Dashboard User
    ↓ (client paie acompte)
client_reservation (status AWAITING_BALANCE)
    ↓ (admin voit dans dashboard)
Dashboard Admin
    ↓ (section "Solde à payer J-5")
    ↓ (admin ajuste final_items)
POST /api/admin/client-reservations/adjust
    ↓ (mise à jour price_total, final_items, customer_summary)
client_reservation (final_validated_at = now())
    ↓ (client voit dans dashboard)
Dashboard User
    ↓ (BLOC B : Ma prestation)
    ↓ (affichage final_items + summary)
```

### 3. Admin → Documents → User

```
Admin Dashboard
    ↓ (clic réservation)
/admin/reservations?reservation={id}
    ↓ (bouton "Télécharger contrat")
GET /api/contract/download?clientReservationId={id}
    ↓ (génération PDF)
PDF Contrat
    ↓ (client signe)
POST /api/contract/sign
    ↓ (mise à jour client_signature, client_signed_at)
client_reservation (contractSigned = true)
    ↓ (affichage dans dashboard)
Dashboard User
    ↓ (BLOC C : Documents)
    ↓ (contrat signé visible)
```

### 4. Homepage → Chat → Admin

```
Homepage (SolutionsSection)
    ↓ (clic pack)
FloatingChatWidget
    ↓ (collecte infos)
    ↓ (si pas instant booking)
    ↓ (création reservation_request)
reservation_requests (status NEW)
    ↓ (admin voit notification)
Dashboard Admin
    ↓ (badge "Demandes de réservation")
    ↓ (clic)
/admin/reservation-requests
    ↓ (admin approuve/ajuste)
    ↓ (création client_reservation)
client_reservation (status AWAITING_PAYMENT)
    ↓ (client reçoit email)
    ↓ (lien checkout)
Stripe Checkout
```

---

## 📊 Modèles de Données

### ReservationView (Modèle Unifié)

```typescript
interface ReservationView {
  id: string;
  source: 'client_reservation' | 'reservation';
  packLabel: string;
  summary?: string | null;
  startAt: string;
  endAt?: string | null;
  address?: string | null;
  status: string;
  priceTotal?: number | null;
  depositAmount?: number | null;
  balanceAmount?: number | null;
  depositPaid: boolean;
  balancePaid: boolean;
  contractSigned: boolean;
  hasInvoices: boolean;
  hasEtatLieux: boolean;
  cta: {
    label: string;
    action: 'PAY_DEPOSIT' | 'PAY_BALANCE' | 'SIGN_CONTRACT' | 'CALL_SUPPORT' | 'NONE';
    href?: string;
  };
  raw?: any;
}
```

### client_reservations (Table Principale)

```sql
CREATE TABLE client_reservations (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  customer_email text,
  pack_key text CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text DEFAULT 'AWAITING_PAYMENT',
  price_total numeric,
  deposit_amount numeric,
  balance_amount numeric,
  base_pack_price numeric,
  extras_total numeric,
  final_items jsonb,
  customer_summary text,
  start_at timestamptz,
  end_at timestamptz,
  address text,
  customer_phone text,
  deposit_paid_at timestamptz,
  balance_paid_at timestamptz,
  balance_due_at timestamptz,
  deposit_requested_at timestamptz,
  deposit_session_id text,
  stripe_session_id text,
  client_signature text,
  client_signed_at timestamptz,
  final_validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 🎨 Composants Réutilisables

### DocumentsPanel

**Fichier** : `components/DocumentsPanel.tsx`

**Props** :
```typescript
{
  context: 'user' | 'admin';
  reservation: {
    id: string;
    type: 'client_reservation' | 'reservation';
    client_signature?: string | null;
    client_signed_at?: string | null;
    status: string;
  };
  orders?: any[];
  etatLieux?: any;
  language?: 'fr' | 'en';
}
```

**Fonctionnalités** :
- Affichage contrat (signer si user, télécharger si admin)
- Liste factures (télécharger)
- État des lieux (télécharger si disponible)

---

## 🔐 Authentification & Autorisation

### Admin

- **Vérification** : `useAdmin()` hook
- **Table** : `user_profiles.is_admin = true`
- **RLS** : Service Role Key pour requêtes admin
- **Redirection** : Si non admin → `/dashboard`

### User

- **Vérification** : `useUser()` hook
- **RLS** : Policies sur `client_reservations` et `reservations`
- **Redirection** : Si non connecté → `/` (homepage)

---

## 📱 Responsive Design

### Mobile (< 1024px)
- Sidebar en overlay (slide depuis gauche)
- Menu hamburger visible
- Cards en 1 colonne
- Stats en 2 colonnes

### Desktop (>= 1024px)
- Sidebar fixe (collapsible)
- Menu hamburger caché
- Cards en 3 colonnes
- Stats en 4 colonnes

---

## 🚀 Optimisations

### Dashboard Admin
- Requêtes parallèles avec `Promise.all`
- Limites sur les requêtes (50-100 items)
- Map pour recherche O(1) des orders
- Refresh automatique toutes les 30 secondes

### Dashboard User
- Chargement unifié via `loadDashboardData()`
- Mapping unifié `ReservationView`
- Polling intelligent après paiement Stripe
- Cache localStorage pour sidebar collapse

### Homepage
- Lazy loading des sections
- Animation progressive (`SectionAnimation`)
- Chat widget chargé uniquement si interaction

---

## 📝 Notes Importantes

1. **Dual-ID Compatibility** : Tous les endpoints documents acceptent `reservationId` OU `clientReservationId`

2. **Orders Linking** : Priorité `client_reservation_id` → `metadata.clientReservationId` → `metadata.reservationId`

3. **Pending Actions** : Calculés localement dans le sidebar si pas fournis en props

4. **Chat Simplifié** : Flow rule-based (pas OpenAI) pour collecte infos minimales

5. **Instant Booking** : Éligible si disponibilité OK + pack standard + pas d'urgence

6. **Automation** : Sections automatisation dans dashboard admin (J-5 solde, J-2 caution)

---

**Documentation générée le** : 2025-01-05
**Version** : 1.0
