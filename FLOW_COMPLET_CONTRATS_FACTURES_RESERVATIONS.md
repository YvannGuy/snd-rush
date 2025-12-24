# 📋 FLOW COMPLET : CONTRATS, FACTURES, RÉSERVATIONS & ÉTATS DES LIEUX

## 📚 Table des matières
1. [Kit PDF utilisé](#kit-pdf-utilisé)
2. [Flow User Dashboard](#flow-user-dashboard)
3. [Flow Admin Dashboard](#flow-admin-dashboard)
4. [Fichiers liés](#fichiers-liés)
5. [Architecture des PDFs](#architecture-des-pdfs)

---

## 🛠️ KIT PDF UTILISÉ

### Bibliothèque principale : **jsPDF** (v2.5.2)

**Package utilisé :**
```json
"jspdf": "^2.5.2"
```

**Installation :**
```bash
npm install jspdf
```

**Utilisation dans le projet :**
- Génération de PDFs côté serveur (Next.js API Routes)
- Format A4 portrait
- Support des images (JPEG/PNG) via base64
- Gestion automatique des sauts de page
- Personnalisation des polices, couleurs, et mises en page

**Fichiers utilisant jsPDF :**
1. `app/api/contract/download/route.ts` - Génération de contrats PDF
2. `app/api/invoice/download/route.ts` - Génération de factures PDF
3. `app/api/etat-lieux/download/route.ts` - Génération d'états des lieux PDF

---

## 👤 FLOW USER DASHBOARD

### 1. **Signature de Contrat**

#### Flow complet :
```
1. User Dashboard → Section "Mes réservations"
2. Réservation avec statut CONFIRMED sans signature
3. Bouton "Signer le contrat" visible
4. Redirection vers /sign-contract?reservationId={id}
5. Page de signature :
   - Affichage du contrat en iframe (PDF généré dynamiquement)
   - Champ de saisie pour signature (nom complet)
   - Validation et envoi via POST /api/contract/sign
6. Mise à jour de la réservation (client_signature, client_signed_at)
7. Redirection vers /mes-reservations
```

#### Fichiers impliqués :
- **`app/dashboard/page.tsx`** (lignes 598-602) : Détection des contrats à signer
- **`app/mes-reservations/page.tsx`** (lignes 858-880) : Affichage du bouton de signature
- **`app/sign-contract/page.tsx`** : Page de signature complète
- **`app/api/contract/sign/route.ts`** : API de signature (POST)
- **`app/api/contract/download/route.ts`** : Génération PDF du contrat (GET)

#### Détails techniques :

**`app/sign-contract/page.tsx`** :
- Composant client (`'use client'`)
- Utilise `useUser` pour vérifier l'authentification
- Modal pour afficher le contrat PDF dans un iframe
- Validation côté client avant envoi
- Gestion des erreurs et états de chargement

**`app/api/contract/sign/route.ts`** :
```typescript
POST /api/contract/sign
Body: {
  reservationId: string,
  signature: string,
  signedAt: string (ISO),
  userId: string
}
```
- Vérifie que la réservation appartient à l'utilisateur
- Vérifie que le contrat n'est pas déjà signé
- Met à jour `reservations.client_signature` et `reservations.client_signed_at`

**`app/api/contract/download/route.ts`** :
```typescript
GET /api/contract/download?reservationId={id}&display=inline|attachment
```
- Récupère la réservation depuis Supabase
- Récupère les infos client (user_profiles, auth.users, notes)
- Génère le PDF avec jsPDF
- Inclut :
  - En-tête avec numéro de contrat
  - Informations contractuelles (locataire, prestataire, SIRET)
  - Détails de la location (dates, durée, adresse)
  - Conditions financières (montant total, dépôt, statut)
  - Conditions générales complètes (15 articles)
  - Signatures (client + prestataire avec image)
- Retourne le PDF en stream ou en téléchargement

---

### 2. **Consultation et Téléchargement des Contrats**

#### Flow complet :
```
1. User Dashboard → Menu "Mes contrats" (/mes-contrats)
2. Liste des contrats signés (filtrés par client_signature IS NOT NULL)
3. Pour chaque contrat :
   - Numéro de réservation
   - Date de signature
   - Dates de location
   - Bouton télécharger PDF
4. Téléchargement via GET /api/contract/download?reservationId={id}
```

#### Fichiers impliqués :
- **`app/mes-contrats/page.tsx`** : Page complète de gestion des contrats
- **`app/api/contract/download/route.ts`** : Génération PDF

#### Détails techniques :

**`app/mes-contrats/page.tsx`** :
- Charge uniquement les réservations avec `client_signature` non null
- Tri par `client_signed_at` décroissant
- Recherche par numéro, date, prix, adresse
- Pagination (2 contrats par page)
- Marque automatiquement les contrats comme "viewés" pour mettre à jour les compteurs du dashboard

---

### 3. **Consultation et Téléchargement des Factures**

#### Flow complet :
```
1. User Dashboard → Menu "Mes factures" (/mes-factures)
2. Liste des orders (factures) liées à l'email de l'utilisateur
3. Pour chaque facture :
   - Numéro de facture (8 premiers caractères de l'ID)
   - Date d'émission
   - Montant total
   - Statut (PAID, PENDING, CANCELLED, REFUNDED)
   - Bouton télécharger PDF
4. Téléchargement via GET /api/invoice/download?orderId={id}
```

#### Fichiers impliqués :
- **`app/mes-factures/page.tsx`** : Page complète de gestion des factures
- **`app/api/invoice/download/route.ts`** : Génération PDF de facture

#### Détails techniques :

**`app/mes-factures/page.tsx`** :
- Charge les `orders` où `customer_email` = email de l'utilisateur
- Tente de lier les orders aux réservations via :
  1. `order.reservation_id` (direct)
  2. `order.stripe_session_id` → `reservation.notes.sessionId`
  3. `order.metadata.reservationId` ou `order.metadata.sessionMetadata.reservationId`
- Recherche par numéro, date, prix, statut, client
- Pagination (2 factures par page)
- Marque automatiquement les factures comme "viewées"

**`app/api/invoice/download/route.ts`** :
```typescript
GET /api/invoice/download?orderId={id}
```
- Récupère l'order avec ses `order_items`
- Génère le PDF avec jsPDF incluant :
  - En-tête "FACTURE" avec numéro
  - Informations entreprise (SoundRush, adresse, contact)
  - Informations client (nom, email, adresse)
  - Tableau des produits (nom, quantité, prix unitaire, durée, total)
  - Frais de livraison si applicable
  - Total TTC en gras
  - Dépôt de garantie si applicable
  - Statut et référence paiement Stripe
- Retourne le PDF en téléchargement

---

### 4. **Consultation des États des Lieux**

#### Flow complet :
```
1. User Dashboard → Menu "Mes états des lieux" (/mes-etats-lieux)
2. Liste des états des lieux validés (status = 'livraison_complete' ou 'reprise_complete')
3. Pour chaque état des lieux :
   - Numéro de réservation
   - Statut (Livraison complète / Reprise complète)
   - Date de création
   - Nombre de photos avant/après
   - Bouton télécharger PDF
   - Bouton voir détails (carrousel de photos)
4. Téléchargement via GET /api/etat-lieux/download?reservationId={id}
```

#### Fichiers impliqués :
- **`app/mes-etats-lieux/page.tsx`** : Page complète de gestion des états des lieux
- **`app/api/etat-lieux/download/route.ts`** : Génération PDF d'état des lieux

#### Détails techniques :

**`app/mes-etats-lieux/page.tsx`** :
- Charge uniquement les états des lieux avec statut `livraison_complete` ou `reprise_complete`
- Filtre par réservations de l'utilisateur
- Affiche un seul état des lieux par réservation (le plus récent)
- Carrousel de photos avec navigation
- Pagination (2 états des lieux par page)
- Marque automatiquement comme "viewés"

**`app/api/etat-lieux/download/route.ts`** :
```typescript
GET /api/etat-lieux/download?etatLieuxId={id}|reservationId={id}&display=inline|attachment
```
- Récupère l'état des lieux depuis Supabase
- Parse les items JSONB (structure avec zones `before`/`after` ou ancienne structure)
- Extrait les photos depuis les zones
- Télécharge et convertit les images en base64 pour inclusion dans le PDF
- Génère le PDF avec jsPDF incluant :
  - En-tête "Etat des lieux" avec numéro de réservation
  - Informations de la réservation (client, contact, adresse, statut)
  - Photos avant livraison avec légendes (zone, date)
  - Commentaires avant si présents
  - Date de validation avant si présente
  - Photos après récupération avec légendes
  - Commentaires après si présents
  - Date de validation après si présente
  - Anomalies constatées (rayures, chocs, casse, etc.) si présentes
  - Date de finalisation si présente
- Retourne le PDF en stream ou téléchargement

---

### 5. **Dashboard Principal - Vue d'ensemble**

#### Flow complet :
```
1. User Dashboard (/dashboard)
2. Affichage des sections :
   - Statistiques (contrats signés, dépôts totaux, locations totales)
   - Prochain service (réservation la plus proche)
   - Services à venir (2 prochaines réservations)
   - Documents (factures récentes avec badge "nouveau" si non consultées)
   - Paiements (pour client_reservations : acompte, solde, caution)
   - Actions en attente (contrats à signer, états des lieux à consulter, etc.)
```

#### Fichiers impliqués :
- **`app/dashboard/page.tsx`** : Dashboard principal utilisateur
- **`components/DashboardSidebar.tsx`** : Sidebar avec compteurs d'actions en attente

#### Détails techniques :

**`app/dashboard/page.tsx`** :
- Charge les réservations (`reservations` + `client_reservations`)
- Charge les orders (factures) pour l'utilisateur
- Calcule les actions en attente :
  - Contrats à signer (CONFIRMED sans `client_signature`)
  - États des lieux à consulter (non marqués comme "viewés")
  - Livraisons non retournées
  - Nouvelles factures (non marquées comme "viewées")
- Affiche les paiements pour `client_reservations` :
  - Acompte (30%) : statut payé/non payé avec bouton
  - Solde (70%) : statut payé/non payé avec bouton (J-5)
  - Caution : statut demandé/non demandé (J-2)
- Gère les redirections vers Stripe Checkout pour les paiements

**`components/DashboardSidebar.tsx`** :
- Affiche les compteurs d'actions en attente dans le menu
- Met à jour automatiquement via événements `pendingActionsUpdated`
- Utilise `localStorage` pour tracker les éléments consultés

---

## 👨‍💼 FLOW ADMIN DASHBOARD

### 1. **Gestion des Contrats**

#### Flow complet :
```
1. Admin Dashboard → Menu "Contrats" (/admin/contrats)
2. Liste de TOUS les contrats signés (toutes les réservations avec client_signature)
3. Pour chaque contrat :
   - Nom du client
   - Email du client
   - Dates de location
   - Date de signature
   - Bouton télécharger PDF
4. Recherche par nom, email, ID, adresse
5. Pagination (4 contrats par page)
```

#### Fichiers impliqués :
- **`app/admin/contrats/page.tsx`** : Page admin de gestion des contrats
- **`app/api/contract/download/route.ts`** : Génération PDF (même endpoint que user)

#### Détails techniques :

**`app/admin/contrats/page.tsx`** :
- Utilise `supabaseAdmin` (service role) pour accéder à toutes les réservations
- Enrichit avec les informations des `orders` pour obtenir nom/email client
- Recherche multi-critères
- Pagination (4 contrats par page)
- Marque les contrats comme "viewés" dans `localStorage` pour les notifications

---

### 2. **Gestion des Factures**

#### Flow complet :
```
1. Admin Dashboard → Menu "Factures" (/admin/factures)
2. Liste de TOUTES les factures (orders)
3. Pour chaque facture :
   - Nom du client
   - Email du client
   - Date d'émission
   - Montant total
   - Statut (PAID, PENDING, CANCELLED, REFUNDED)
   - Bouton télécharger PDF
   - Bouton voir détails
4. Bouton "+ Générer une facture" (modal de création)
5. Recherche par nom, email, ID, statut
6. Pagination (4 factures par page)
```

#### Fichiers impliqués :
- **`app/admin/factures/page.tsx`** : Page admin de gestion des factures
- **`app/admin/factures/nouvelle/page.tsx`** : Page de création de facture (si existe)
- **`app/api/invoice/download/route.ts`** : Génération PDF (même endpoint que user)

#### Détails techniques :

**`app/admin/factures/page.tsx`** :
- Utilise `supabaseAdmin` pour accéder à toutes les `orders`
- Affiche les badges de statut avec couleurs (vert=PAID, orange=PENDING, etc.)
- Recherche multi-critères
- Pagination (4 factures par page)
- Bouton pour générer une nouvelle facture (modal ou page dédiée)

---

### 3. **Gestion des Réservations**

#### Flow complet :
```
1. Admin Dashboard → Menu "Réservations" (/admin/reservations)
2. Liste de TOUTES les réservations (reservations + client_reservations)
3. Pour chaque réservation :
   - Nom du client
   - Email du client
   - Dates de location
   - Statut (CONFIRMED, PENDING, CANCELLED, etc.)
   - Montant total
   - Bouton "Voir" (modal de détails)
4. Recherche par nom, email, ID, statut, adresse
5. Pagination (5 réservations par page)
6. Modal de détails avec :
   - Informations complètes de la réservation
   - Lien vers le contrat si signé
   - Lien vers la facture si existe
   - Actions admin (valider, annuler, modifier)
```

#### Fichiers impliqués :
- **`app/admin/reservations/page.tsx`** : Page admin de gestion des réservations
- **`app/admin/reservations/[id]/page.tsx`** : Page de détail d'une réservation (si existe)

#### Détails techniques :

**`app/admin/reservations/page.tsx`** :
- Charge toutes les réservations (`reservations` + `client_reservations`)
- Enrichit avec les informations des `user_profiles` et `orders`
- Adapte les `client_reservations` au format des réservations pour l'affichage
- Modal de détails avec toutes les informations
- Marque les réservations comme "viewées" selon leur statut :
  - `PENDING` → `admin_viewed_reservations`
  - `CANCEL_REQUESTED` → `admin_viewed_cancellations`
  - `CHANGE_REQUESTED` → `admin_viewed_modifications`

---

### 4. **Dashboard Principal Admin - Vue d'ensemble**

#### Flow complet :
```
1. Admin Dashboard (/admin)
2. Affichage des sections :
   - Statistiques (réservations à venir, CA du mois, matériel sorti, retours en retard)
   - Automatisation First :
     * Paiements à venir (J-5) - client_reservations avec solde à payer
     * Cautions à demander (J-2) - client_reservations avec caution à demander
     * Événements de la semaine - réservations dans les 7 prochains jours
   - Réservations à venir (prochaines 30 jours)
   - Actions rapides
   - État du matériel
   - Clients récents
   - Planning des réservations (calendrier)
   - Notifications (nouvelles demandes de réservation)
```

#### Fichiers impliqués :
- **`app/admin/page.tsx`** : Dashboard principal admin

#### Détails techniques :

**`app/admin/page.tsx`** :
- Charge les données en parallèle avec `Promise.all` pour optimiser les performances
- Sections "Automatisation First" :
  - **Paiements à venir (J-5)** : `client_reservations` où :
    - `deposit_paid_at` IS NOT NULL (acompte payé)
    - `balance_paid_at` IS NULL (solde non payé)
    - `balance_due_at` <= NOW() (date de solde atteinte)
  - **Cautions à demander (J-2)** : `client_reservations` où :
    - Date de l'événement = J-2 (2 jours avant `start_at`)
    - Caution non encore demandée
  - **Événements de la semaine** : Réservations où `start_at` dans les 7 prochains jours
- Affiche les compteurs d'actions en attente dans la sidebar
- Gère les notifications pour les nouvelles demandes de réservation

---

## 📁 FICHIERS LIÉS

### Pages User :
1. **`app/dashboard/page.tsx`** - Dashboard principal utilisateur
2. **`app/mes-reservations/page.tsx`** - Liste des réservations utilisateur
3. **`app/mes-contrats/page.tsx`** - Liste des contrats signés
4. **`app/mes-factures/page.tsx`** - Liste des factures
5. **`app/mes-etats-lieux/page.tsx`** - Liste des états des lieux
6. **`app/sign-contract/page.tsx`** - Page de signature de contrat

### Pages Admin :
1. **`app/admin/page.tsx`** - Dashboard principal admin
2. **`app/admin/contrats/page.tsx`** - Gestion des contrats admin
3. **`app/admin/factures/page.tsx`** - Gestion des factures admin
4. **`app/admin/reservations/page.tsx`** - Gestion des réservations admin

### API Routes :
1. **`app/api/contract/sign/route.ts`** - POST : Signature d'un contrat
2. **`app/api/contract/download/route.ts`** - GET : Génération PDF contrat
3. **`app/api/invoice/download/route.ts`** - GET : Génération PDF facture
4. **`app/api/etat-lieux/download/route.ts`** - GET : Génération PDF état des lieux

### Composants :
1. **`components/DashboardSidebar.tsx`** - Sidebar utilisateur avec compteurs
2. **`components/AdminSidebar.tsx`** - Sidebar admin
3. **`components/AdminHeader.tsx`** - Header admin
4. **`components/AdminFooter.tsx`** - Footer admin

### Hooks :
1. **`hooks/useUser.ts`** - Hook pour récupérer l'utilisateur connecté
2. **`hooks/useAdmin.ts`** - Hook pour vérifier les droits admin
3. **`hooks/useAuth.ts`** - Hook pour l'authentification
4. **`hooks/useSidebarCollapse.ts`** - Hook pour gérer l'état de la sidebar

### Utilitaires :
1. **`lib/supabase.ts`** - Client Supabase (anon key)
2. **`lib/supabaseAdmin.ts`** - Client Supabase admin (service role key) - si existe
3. **`lib/reservationStatus.ts`** - Utilitaires pour les statuts de réservation

---

## 🏗️ ARCHITECTURE DES PDFs

### Structure commune des PDFs générés :

#### 1. **Contrat PDF** (`app/api/contract/download/route.ts`)
```
- Format : A4 portrait
- Marges : 20mm
- Couleur principale : #F2431E (rouge SoundRush)
- Sections :
  1. En-tête : "CONTRAT DE LOCATION" + numéro + date
  2. Informations contractuelles : Locataire, Prestataire, SIRET, Adresse
  3. Détails de la location : Dates, durée, adresse, pack
  4. Conditions financières : Montant total, dépôt, statut
  5. Message important (fond jaune)
  6. Conditions générales complètes (15 articles)
  7. Signatures : Client (texte) + Prestataire (image depuis public/signature.jpg)
  8. Pied de page : Informations légales
```

#### 2. **Facture PDF** (`app/api/invoice/download/route.ts`)
```
- Format : A4 portrait
- Marges : 20mm
- Couleur principale : #F2431E
- Sections :
  1. En-tête : "FACTURE" + numéro + date
  2. Informations entreprise (droite) : SoundRush, adresse, contact
  3. Informations client (gauche) : Nom, email, adresse
  4. Tableau des produits :
     - Colonnes : Produit | Qté | Prix unit. | Durée | Total
     - Lignes : Chaque order_item avec calcul automatique
  5. Frais de livraison (si > 0)
  6. Total TTC (gras, grande taille)
  7. Dépôt de garantie (si > 0)
  8. Pied de page : Statut et référence paiement Stripe
```

#### 3. **État des Lieux PDF** (`app/api/etat-lieux/download/route.ts`)
```
- Format : A4 portrait
- Marges : 20mm
- Couleur principale : #F2431E
- Sections :
  1. En-tête : "Etat des lieux" + numéro réservation + date création
  2. Informations réservation : Client, contact, adresse, statut
  3. Photos avant livraison :
     - Images téléchargées et converties en base64
     - Légendes avec zone et date
     - Commentaires globaux si présents
     - Badge de validation si validé
  4. Photos après récupération :
     - Même structure que "avant"
  5. Anomalies constatées (fond jaune) :
     - Liste des dégâts détectés avec type et note
     - Message informatif
  6. Badge de finalisation (fond vert) si finalisé
  7. Pied de page : Message légal
```

### Fonctions helper communes :

**`splitText(doc: jsPDF, text: string, maxWidth: number): string[]`**
- Divise un texte en lignes pour s'adapter à la largeur maximale
- Utilisée dans tous les PDFs pour gérer les textes longs

**`checkPageBreak(requiredSpace: number)`**
- Vérifie si l'espace requis est disponible sur la page actuelle
- Ajoute une nouvelle page si nécessaire
- Réinitialise `yPos` à la marge

**`fetchImageAsBase64(url: string)`** (uniquement pour états des lieux)
- Télécharge une image depuis une URL
- Convertit en base64 pour inclusion dans le PDF
- Gère les erreurs de téléchargement

---

## 🔐 SÉCURITÉ ET PERMISSIONS

### User Dashboard :
- **RLS (Row Level Security)** : Les utilisateurs ne peuvent voir que leurs propres données
- **Vérification d'authentification** : Toutes les pages vérifient `useUser()`
- **Vérification de propriété** : Les APIs vérifient que les ressources appartiennent à l'utilisateur

### Admin Dashboard :
- **Vérification admin** : Utilise `useAdmin()` hook qui vérifie la table `admins`
- **Service Role Key** : Les pages admin utilisent `supabaseAdmin` (service role) pour bypasser RLS
- **Double vérification** : Vérification côté client ET côté serveur

### Génération PDFs :
- **Contrats** : Vérifie que la réservation appartient à l'utilisateur (user) ou utilise service role (admin)
- **Factures** : Vérifie que l'order appartient à l'utilisateur (user) ou utilise service role (admin)
- **États des lieux** : Vérifie que la réservation appartient à l'utilisateur (user) ou utilise service role (admin)

---

## 📊 BASE DE DONNÉES

### Tables principales :

1. **`reservations`** (ancienne table)
   - `id` (UUID)
   - `user_id` (UUID, FK → auth.users)
   - `client_signature` (text, nullable)
   - `client_signed_at` (timestamptz, nullable)
   - `start_date`, `end_date` (date)
   - `total_price`, `deposit_amount` (numeric)
   - `status` (text)
   - `address` (text)
   - `notes` (jsonb)

2. **`client_reservations`** (nouvelle table)
   - `id` (UUID)
   - `user_id` (UUID, nullable, FK → auth.users)
   - `customer_email` (text, nullable)
   - `customer_name` (text)
   - `pack_key` (text)
   - `start_at`, `end_at` (timestamptz)
   - `price_total` (numeric)
   - `deposit_paid_at`, `balance_paid_at` (timestamptz, nullable)
   - `balance_due_at` (timestamptz, nullable)
   - `status` (text: AWAITING_PAYMENT, AWAITING_BALANCE, CONFIRMED, PAID)

3. **`orders`** (factures)
   - `id` (UUID)
   - `customer_email` (text)
   - `customer_name` (text)
   - `total` (numeric)
   - `status` (text: PAID, PENDING, CANCELLED, REFUNDED)
   - `stripe_session_id` (text, nullable)
   - `reservation_id` (UUID, nullable, FK → reservations)
   - `metadata` (jsonb)
   - `created_at` (timestamptz)

4. **`order_items`** (items de facture)
   - `id` (UUID)
   - `order_id` (UUID, FK → orders)
   - `product_name` (text)
   - `quantity` (integer)
   - `daily_price` (numeric)
   - `rental_days` (integer)

5. **`etat_lieux`** (états des lieux)
   - `id` (UUID)
   - `reservation_id` (UUID, FK → reservations)
   - `status` (text: livraison_complete, reprise_complete)
   - `items` (jsonb) - Structure avec zones before/after ou ancienne structure
   - `created_at` (timestamptz)
   - `pdf_url` (text, nullable)

6. **`user_profiles`** (profils utilisateurs)
   - `user_id` (UUID, FK → auth.users)
   - `first_name`, `last_name` (text)
   - `email` (text)

---

## 🎨 STYLE ET UX

### Couleurs principales :
- **Rouge SoundRush** : `#F2431E` (boutons, badges, titres)
- **Rouge hover** : `#E63A1A`
- **Vert** : Succès, payé, confirmé
- **Orange** : En attente, warning
- **Gris** : Annulé, neutre

### Composants UI utilisés :
- **Shadcn UI** : Card, Button, Badge, Dialog, Input, etc.
- **Lucide React** : Icônes (Download, Calendar, FileText, etc.)
- **Tailwind CSS** : Classes utilitaires pour le styling

### Responsive :
- Toutes les pages sont responsive (mobile-first)
- Sidebar collapsible sur desktop
- Menu hamburger sur mobile
- Pagination adaptative

---

## 📝 NOTES IMPORTANTES

1. **Compatibilité** : Le système gère à la fois les anciennes réservations (`reservations`) et les nouvelles (`client_reservations`)

2. **LocalStorage** : Utilisé pour tracker les éléments "viewés" et mettre à jour les compteurs d'actions en attente

3. **Événements personnalisés** : `pendingActionsUpdated` est dispatché pour synchroniser les compteurs entre les pages

4. **Gestion des erreurs** : Toutes les APIs gèrent les erreurs et retournent des messages clairs

5. **Performance** : Les requêtes Supabase sont optimisées avec des `select()` spécifiques et des limites

6. **Images dans PDFs** : Les images sont téléchargées et converties en base64 pour inclusion dans les PDFs (uniquement pour états des lieux)

7. **Signature prestataire** : L'image de signature est chargée depuis `public/signature.jpg` (doit exister)

---

## 🚀 PROCHAINES ÉTAPES POSSIBLES

1. **Cache des PDFs** : Stocker les PDFs générés dans Supabase Storage pour éviter la régénération
2. **Email automatique** : Envoyer les PDFs par email après génération
3. **Signature électronique** : Intégrer un service de signature électronique (DocuSign, etc.)
4. **Templates personnalisables** : Permettre aux admins de personnaliser les templates PDF
5. **Export Excel** : Ajouter l'export des listes en Excel
6. **Notifications push** : Notifier les utilisateurs quand un nouveau document est disponible

---

**Documentation créée le :** 2025-01-XX
**Version :** 1.0
**Auteur :** Assistant AI
