# 📋 FLOW COMPLET - ESPACE PRO : De la page /pro aux dashboards

## 🎯 Vue d'ensemble

Ce document décrit le flow complet depuis la page `/pro` jusqu'aux dashboards utilisateur et admin, avec tous les fichiers, politiques RLS, tables, hooks, et actions impliqués.

---

## 📍 ÉTAPE 1 : Page `/pro` - Point d'entrée

### Fichier : `app/pro/page.tsx`

**Rôle** : Page de landing pour l'Espace Pro avec affichage conditionnel selon le statut de l'utilisateur.

**Hooks utilisés** :
- `useUser()` : Vérifie si l'utilisateur est connecté
- `usePro()` : Vérifie si l'utilisateur est un pro actif (`role='pro'` ET `pro_status='active'`)

**États affichés** :

1. **Non connecté** (`!user`) :
   - Affiche : "🔒 Accès réservé aux professionnels actifs"
   - Bouton : "Se connecter" → Ouvre `SignModal`

2. **Connecté mais pas pro** (`user` mais `!isPro` et `proStatus !== 'pending'` et `proStatus !== 'blocked'`) :
   - Affiche : "🔒 Accès réservé aux professionnels actifs"
   - Bouton : "👉 Demander l'accès Pro" → Ouvre `RequestProAccess` modal

3. **Demande en attente** (`proStatus === 'pending'`) :
   - Affiche : "Demande en attente" avec message explicatif

4. **Accès bloqué** (`proStatus === 'blocked'`) :
   - Affiche : "Accès bloqué" avec message explicatif

5. **Pro actif** (`isPro === true`) :
   - Affiche : "Accès Pro Actif"
   - Bouton : "Accéder au catalogue" → Redirige vers `/pro/catalogue`

**Composants utilisés** :
- `SignModal` : Modal de connexion/inscription
- `RequestProAccess` : Modal de demande d'accès Pro

---

## 🔐 ÉTAPE 2 : Connexion/Inscription via SignModal

### Fichier : `components/auth/SignModal.tsx`

**Rôle** : Modal de connexion et d'inscription avec deux onglets (`signin` / `signup`).

**Hook utilisé** : `useAuth()` qui expose :
- `signInWithEmail(email, password)`
- `signUpWithEmail(email, password, metadata)`

**Flow SignIn** :
1. Utilisateur saisit email + mot de passe
2. Appel à `supabase.auth.signInWithPassword({ email, password })`
3. Supabase vérifie les credentials dans `auth.users`
4. Si succès → Crée une session → `onAuthStateChange` déclenché
5. `useUser()` détecte la session → `user` devient disponible
6. `onSuccess()` appelé → `window.location.reload()` pour rafraîchir la page `/pro`

**Flow SignUp** :
1. Utilisateur saisit email, mot de passe, titre, prénom, nom, téléphone
2. Appel à `supabase.auth.signUp({ email, password, options: { data: metadata } })`
3. Supabase crée l'utilisateur dans `auth.users`
4. **Création automatique du profil** : Si metadata fournie, insertion dans `user_profiles` :
   ```typescript
   await supabase.from('user_profiles').insert({
     user_id: data.user.id,
     phone: metadata.phone || null,
     address: null,
     company: null,
   });
   ```
5. Redirection vers `/auth/callback` (avec `has_cart=true` si panier présent)

**Fichier callback** : `app/auth/callback/route.ts`
- Échange le code d'authentification pour une session
- Redirige vers `/dashboard` (ou `/panier` si `has_cart=true`)

---

## 🎫 ÉTAPE 3 : Demande d'accès Pro via RequestProAccess

### Fichier : `components/pro/RequestProAccess.tsx`

**Rôle** : Modal de formulaire pour demander l'accès Pro.

**Champs du formulaire** :
- `proType` (requis) : Select avec options (`dj`, `tech`, `orga`, `autre`)
- `proUsage` (requis) : Textarea pour décrire l'usage prévu
- `phone` (optionnel) : Téléphone

**Action lors de la soumission** :

```typescript
await supabase
  .from('user_profiles')
  .upsert({
    user_id: user.id,
    pro_status: 'pending',  // ← Statut mis à 'pending'
    pro_type: proType,
    pro_usage: proUsage,
    phone: phone || null,
  }, {
    onConflict: 'user_id',  // ← Upsert si profil existe déjà
  });
```

**Table concernée** : `user_profiles`

**Colonnes modifiées** :
- `pro_status` → `'pending'`
- `pro_type` → Valeur sélectionnée
- `pro_usage` → Texte saisi
- `phone` → Numéro saisi (si fourni)

**RLS Policy appliquée** : 
```sql
-- Policy "Users can upsert own profile for pro request"
CREATE POLICY "Users can upsert own profile for pro request"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

Cette politique permet à l'utilisateur de créer/mettre à jour son propre profil pour demander l'accès Pro.

**Après soumission** :
- `setSuccess(true)` → Affiche message de succès
- Après 2 secondes → `onClose()` + `onSuccess()` → `window.location.reload()`
- La page `/pro` se recharge → Affiche maintenant "Demande en attente"

---

## 🔍 ÉTAPE 4 : Vérification du statut Pro (usePro Hook)

### Fichier : `hooks/usePro.ts`

**Rôle** : Hook React qui vérifie si l'utilisateur est un pro actif.

**Logique** :

```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('role, pro_status')
  .eq('user_id', user.id)
  .maybeSingle();

const role = profile?.role?.toLowerCase();
const status = profile?.pro_status?.toLowerCase();

// isPro = true SEULEMENT si role === 'pro' ET pro_status === 'active'
const isProRole = role === 'pro' && status === 'active';
```

**Retourne** :
- `isPro` : `boolean` (true si `role='pro'` ET `pro_status='active'`)
- `proStatus` : `'pending' | 'active' | 'blocked' | null`
- `checkingPro` : `boolean` (état de chargement)

**RLS Policy appliquée** :
```sql
-- Policy "Users can view own profile"
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);
```

Cette politique permet à l'utilisateur de voir uniquement son propre profil.

---

## 👤 ÉTAPE 5 : Dashboard Utilisateur (`/dashboard`)

### Fichier : `app/dashboard/page.tsx`

**Rôle** : Dashboard principal pour les utilisateurs connectés.

**Guard** :
```typescript
useEffect(() => {
  if (loading) return;
  if (!user) {
    router.push('/');
    return;
  }
}, [user, loading, router]);
```

Si l'utilisateur n'est pas connecté → Redirection vers `/`.

**Données chargées** :
- `reservations` : Réservations de l'utilisateur (excluant `PENDING` et `CANCELLED`)
- `orders` : Commandes de l'utilisateur
- `stats` : Statistiques (contrats signés, caution totale, locations totales)
- `pendingActions` : Actions en attente (contrats à signer, états des lieux à réviser, etc.)

**Requêtes Supabase** :
```typescript
// Réservations
const { data: reservationsData } = await supabase
  .from('reservations')
  .select('*')
  .eq('user_id', user.id)
  .not('status', 'eq', 'PENDING')
  .not('status', 'eq', 'CANCELLED')
  .order('start_date', { ascending: true });

// Commandes
const { data: ordersData } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_email', user.email)
  .order('created_at', { ascending: false });
```

**RLS Policies appliquées** :

**Table `reservations`** :
```sql
-- Les utilisateurs peuvent voir leurs propres réservations
CREATE POLICY "Users can view own reservations"
ON reservations
FOR SELECT
USING (auth.uid() = user_id);
```

**Table `orders`** :
```sql
-- Les utilisateurs peuvent voir leurs propres commandes
CREATE POLICY "Users can view own orders"
ON orders
FOR SELECT
USING (auth.email() = customer_email);
```

**Sections du dashboard** :
1. **Statistiques** : Contrats signés, caution totale, locations totales
2. **Réservations** : Liste des réservations avec statuts
3. **Actions en attente** : Badges pour contrats à signer, états des lieux, etc.
4. **Commandes** : Historique des commandes

---

## 🔧 ÉTAPE 6 : Dashboard Admin (`/admin`)

### Fichier : `app/admin/page.tsx`

**Rôle** : Dashboard principal pour les administrateurs.

**Guard** :
```typescript
const { isAdmin, checkingAdmin } = useAdmin();

useEffect(() => {
  if (!checkingAdmin && !isAdmin && user) {
    router.push('/dashboard');
  }
}, [isAdmin, checkingAdmin, user, router]);
```

Si l'utilisateur n'est pas admin → Redirection vers `/dashboard`.

**Hook useAdmin** : `hooks/useAdmin.ts`

**Logique de vérification** :
```typescript
// 1. Vérification rapide via metadata ou email
const isAdminFromMetadata = 
  user.user_metadata?.role?.toLowerCase() === 'admin' ||
  user.email?.toLowerCase() === 'yvann.guyonnet@gmail.com';

// 2. Si pas admin via metadata, vérifier dans user_profiles
const { data: profile } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('user_id', user.id)
  .maybeSingle();

const isAdminRole = 
  profile?.role?.toLowerCase() === 'admin' || 
  isAdminFromMetadata ||
  user.email?.toLowerCase() === 'yvann.guyonnet@gmail.com';
```

**Données chargées** :
- Réservations du mois
- CA du mois
- Matériel sorti
- Retours en retard
- Clients récents
- État du matériel
- Planning

**RLS Policies** : Les admins utilisent généralement le client `supabase` standard, mais certaines actions nécessitent le service role (via API routes).

---

## 🎯 ÉTAPE 7 : Page Admin Pro Requests (`/admin/pro`)

### Fichier : `app/admin/pro/page.tsx`

**Rôle** : Page de gestion des demandes d'accès Pro pour les admins.

**Guard** : Même guard que `/admin` (vérification `isAdmin`).

**Chargement des données** :

```typescript
const response = await fetch('/api/admin/pro-requests');
const data = await response.json();
setProRequests(data.requests || []);
```

**API Route** : `app/api/admin/pro-requests/route.ts`

**Logique de l'API** :

```typescript
// 1. Récupérer tous les user_profiles avec pro_status ou role='pro'
const { data: profiles } = await supabaseAdmin
  .from('user_profiles')
  .select('*')
  .or('pro_status.not.is.null,role.eq.pro')
  .order('created_at', { ascending: false });

// 2. Récupérer les emails depuis auth.users (nécessite service role)
const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();

// 3. Créer un map user_id -> email
const emailMap = new Map<string, string>();
users.forEach(user => {
  if (user.email) {
    emailMap.set(user.id, user.email);
  }
});

// 4. Enrichir les profils avec les emails
const enrichedProfiles = profiles.map(profile => ({
  ...profile,
  email: emailMap.get(profile.user_id) || null,
}));
```

**Pourquoi une API Route ?**
- `auth.users` nécessite le service role (`SUPABASE_SERVICE_ROLE_KEY`)
- Le client `supabase` côté client ne peut pas accéder à `auth.users` directement
- L'API route utilise `supabaseAdmin` (avec service role) pour bypasser RLS

**Filtres disponibles** :
- Par statut : `all`, `pending`, `active`, `blocked`
- Par recherche : Email, nom, type, usage

**Actions disponibles** :

1. **Activer** (`handleActivate`) :
   ```typescript
   await supabase
     .from('user_profiles')
     .update({
       role: 'pro',
       pro_status: 'active',
     })
     .eq('user_id', userId);
   ```
   → Met `role='pro'` ET `pro_status='active'`

2. **Bloquer** (`handleBlock`) :
   ```typescript
   await supabase
     .from('user_profiles')
     .update({
       pro_status: 'blocked',
     })
     .eq('user_id', userId);
   ```
   → Met `pro_status='blocked'` (garde `role='pro'`)

3. **Refuser** (`handleReject`) :
   ```typescript
   await supabase
     .from('user_profiles')
     .update({
       pro_status: null,
       role: null,
     })
     .eq('user_id', userId);
   ```
   → Remet `pro_status=null` ET `role=null`

**RLS Policy appliquée** :

Les admins utilisent le client `supabase` standard (pas `supabaseAdmin`) pour ces updates. La politique RLS doit permettre aux admins de modifier les profils :

```sql
-- Policy pour UPDATE (simplifiée - les admins peuvent modifier via service role ou RLS spécifique)
CREATE POLICY "Users can update own profile for pro request"
ON user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Note** : En pratique, les admins peuvent avoir besoin d'une politique RLS supplémentaire ou d'utiliser le service role pour modifier les profils d'autres utilisateurs. Actuellement, les updates admin passent probablement via le client standard si l'admin a les permissions nécessaires.

**Badge dans AdminSidebar** :

### Fichier : `components/AdminSidebar.tsx`

**Calcul du badge** :

```typescript
// Dans calculatePendingActions()
const response = await fetch('/api/admin/pro-requests');
const data = await response.json();
const pendingProRequests = (data.requests || []).filter(
  (req: any) => req.pro_status === 'pending'
).length;
```

**Affichage** :
```typescript
<Link href="/admin/pro">
  {currentTexts.proAccess}
  {pendingProRequests > 0 && (
    <span className="bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5">
      {pendingProRequests}
    </span>
  )}
</Link>
```

---

## 📊 STRUCTURE DES TABLES

### Table `user_profiles`

**Colonnes principales** :
- `user_id` (UUID, PK, FK vers `auth.users.id`)
- `role` (TEXT) : `'admin'`, `'pro'`, ou `null`
- `pro_status` (TEXT) : `'pending'`, `'active'`, `'blocked'`, ou `null`
- `pro_type` (TEXT) : `'dj'`, `'tech'`, `'orga'`, `'autre'`, ou `null`
- `pro_usage` (TEXT) : Description de l'usage prévu, ou `null`
- `phone` (TEXT) : Numéro de téléphone
- `first_name` (TEXT)
- `last_name` (TEXT)
- `email` (TEXT)
- `address` (TEXT)
- `company` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Index** :
```sql
CREATE INDEX idx_user_profiles_pro_status 
ON user_profiles(pro_status) 
WHERE pro_status IS NOT NULL;

CREATE INDEX idx_user_profiles_role_pro_status 
ON user_profiles(role, pro_status) 
WHERE role = 'pro' AND pro_status IS NOT NULL;
```

### Table `auth.users` (Supabase Auth)

**Colonnes principales** :
- `id` (UUID, PK)
- `email` (TEXT)
- `user_metadata` (JSONB)
- `created_at` (TIMESTAMP)

**Accès** : Uniquement via service role (`SUPABASE_SERVICE_ROLE_KEY`) ou via `supabase.auth.admin.listUsers()`

---

## 🔒 POLITIQUES RLS COMPLÈTES

### Table `user_profiles`

**SELECT** :
```sql
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);
```
→ Les utilisateurs peuvent voir uniquement leur propre profil.

**INSERT** :
```sql
CREATE POLICY "Users can upsert own profile for pro request"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```
→ Les utilisateurs peuvent créer leur propre profil (pour demande Pro).

**UPDATE** :
```sql
CREATE POLICY "Users can update own profile for pro request"
ON user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
→ Les utilisateurs peuvent mettre à jour leur propre profil (pour demande Pro).

**Note** : Les admins peuvent avoir besoin d'une politique supplémentaire ou d'utiliser le service role pour modifier les profils d'autres utilisateurs.

### Table `reservations`

**SELECT** :
```sql
CREATE POLICY "Users can view own reservations"
ON reservations
FOR SELECT
USING (auth.uid() = user_id);
```
→ Les utilisateurs peuvent voir uniquement leurs propres réservations.

### Table `orders`

**SELECT** :
```sql
CREATE POLICY "Users can view own orders"
ON orders
FOR SELECT
USING (
  auth.uid()::text = customer_email OR 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.email = orders.customer_email
  )
);
```
→ Les utilisateurs peuvent voir leurs propres commandes (via email).

---

## 🔄 FLOW COMPLET RÉCAPITULATIF

### Scénario 1 : Nouvel utilisateur demande accès Pro

1. **Utilisateur non connecté** visite `/pro`
   - Voit : "🔒 Accès réservé aux professionnels actifs"
   - Clique : "Se connecter"
   - → `SignModal` s'ouvre

2. **Inscription** via `SignModal`
   - Remplit formulaire (email, password, nom, prénom, téléphone)
   - `useAuth().signUpWithEmail()` appelé
   - Supabase crée `auth.users` + `user_profiles` (si metadata fournie)
   - Redirection vers `/auth/callback` → `/dashboard`
   - Utilisateur retourne sur `/pro` (maintenant connecté)

3. **Demande accès Pro**
   - Clique : "👉 Demander l'accès Pro"
   - `RequestProAccess` modal s'ouvre
   - Remplit : `proType`, `proUsage`, `phone`
   - Soumet → `upsert` dans `user_profiles` avec `pro_status='pending'`
   - Page `/pro` se recharge → Affiche "Demande en attente"

4. **Admin voit la demande**
   - Admin va sur `/admin/pro`
   - API `/api/admin/pro-requests` récupère toutes les demandes avec emails
   - Badge dans `AdminSidebar` affiche le nombre de demandes `pending`

5. **Admin active le compte**
   - Admin clique "Voir détails" sur une demande
   - Clique "Activer"
   - `handleActivate()` met à jour `user_profiles` : `role='pro'`, `pro_status='active'`

6. **Utilisateur voit l'accès activé**
   - Utilisateur retourne sur `/pro`
   - `usePro()` détecte `role='pro'` ET `pro_status='active'`
   - `isPro` devient `true`
   - Page `/pro` affiche : "Accès Pro Actif" + bouton "Accéder au catalogue"

### Scénario 2 : Utilisateur existant demande accès Pro

1. **Utilisateur connecté** visite `/pro`
   - `useUser()` détecte `user` existant
   - `usePro()` vérifie `user_profiles` → `role` et `pro_status`
   - Si pas pro → Affiche "Demander l'accès Pro"

2. **Demande accès Pro**
   - Même flow que Scénario 1, étape 3

3. **Admin active**
   - Même flow que Scénario 1, étapes 4-5

4. **Utilisateur accède au catalogue**
   - Même flow que Scénario 1, étape 6

---

## 📁 FICHIERS CLÉS RÉCAPITULATIF

### Pages
- `app/pro/page.tsx` : Landing page Espace Pro
- `app/pro/catalogue/page.tsx` : Catalogue Pro (protégé)
- `app/dashboard/page.tsx` : Dashboard utilisateur
- `app/admin/page.tsx` : Dashboard admin
- `app/admin/pro/page.tsx` : Gestion des demandes Pro (admin)

### Composants
- `components/auth/SignModal.tsx` : Modal connexion/inscription
- `components/pro/RequestProAccess.tsx` : Modal demande accès Pro
- `components/AdminSidebar.tsx` : Sidebar admin avec badge Pro

### Hooks
- `hooks/useUser.ts` : Hook pour récupérer l'utilisateur connecté
- `hooks/useAuth.ts` : Hook pour les actions d'authentification
- `hooks/useAdmin.ts` : Hook pour vérifier le rôle admin
- `hooks/usePro.ts` : Hook pour vérifier le statut Pro

### API Routes
- `app/api/admin/pro-requests/route.ts` : API pour récupérer les demandes Pro avec emails
- `app/auth/callback/route.ts` : Callback d'authentification Supabase

### Configuration
- `lib/supabase.ts` : Client Supabase (anon key)
- `SUPABASE_RLS_PRO.md` : Documentation SQL des migrations et RLS

---

## 🔐 VARIABLES D'ENVIRONNEMENT REQUISES

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## ✅ CHECKLIST DE VÉRIFICATION

- [ ] Colonnes `pro_status`, `pro_type`, `pro_usage` ajoutées à `user_profiles`
- [ ] Index créés sur `user_profiles(pro_status)` et `user_profiles(role, pro_status)`
- [ ] RLS Policies créées pour `user_profiles` (SELECT, INSERT, UPDATE)
- [ ] Hook `usePro()` fonctionne correctement
- [ ] Page `/pro` affiche le bon contenu selon le statut
- [ ] Modal `RequestProAccess` fonctionne et upsert correctement
- [ ] API `/api/admin/pro-requests` retourne les données avec emails
- [ ] Page `/admin/pro` affiche les demandes et permet les actions
- [ ] Badge dans `AdminSidebar` affiche le nombre de demandes `pending`
- [ ] Actions admin (Activer, Bloquer, Refuser) fonctionnent
- [ ] Après activation, `usePro()` détecte correctement `isPro=true`

---

## 🎯 RÉSUMÉ DES ACTIONS ENTRE DASHBOARDS

### Dashboard Utilisateur → Admin
- **Aucune action directe** : L'utilisateur ne peut pas modifier son propre `role` ou `pro_status` vers `'active'`
- L'utilisateur peut seulement :
  - Créer/mettre à jour son profil avec `pro_status='pending'`
  - Voir son propre statut Pro

### Dashboard Admin → Utilisateur
- **Activer** : Met `role='pro'` ET `pro_status='active'` → L'utilisateur devient pro actif
- **Bloquer** : Met `pro_status='blocked'` → L'utilisateur perd l'accès Pro
- **Refuser** : Met `pro_status=null` ET `role=null` → Retire complètement le statut Pro

### Synchronisation
- Les changements admin sont immédiatement visibles côté utilisateur car `usePro()` interroge `user_profiles` à chaque rendu
- Un refresh de la page `/pro` suffit pour voir le nouveau statut

---

**Document créé le** : 2024
**Dernière mise à jour** : 2024
