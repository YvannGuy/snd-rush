# 🔒 Sécurisation du flow `/admin/pro`

## ✅ Modifications effectuées

### 1. Création de 3 API routes sécurisées

#### `/api/admin/pro-requests/activate`
- **Fichier** : `app/api/admin/pro-requests/activate/route.ts`
- **Méthode** : POST
- **Body** : `{ user_id: string }`
- **Action** : Met à jour `user_profiles` avec `role='pro'` et `pro_status='active'`
- **Sécurité** :
  - Vérifie le token Authorization Bearer
  - Vérifie que l'utilisateur est admin (email autorisé ou `user_profiles.role='admin'`)
  - Utilise `supabaseAdmin` (service role) pour bypasser RLS
  - Retourne 403 si non admin

#### `/api/admin/pro-requests/block`
- **Fichier** : `app/api/admin/pro-requests/block/route.ts`
- **Méthode** : POST
- **Body** : `{ user_id: string }`
- **Action** : Met à jour `user_profiles` avec `pro_status='blocked'`
- **Sécurité** : Même que `/activate`

#### `/api/admin/pro-requests/reject`
- **Fichier** : `app/api/admin/pro-requests/reject/route.ts`
- **Méthode** : POST
- **Body** : `{ user_id: string }`
- **Action** : Remet à `null` : `role`, `pro_status`, `pro_type`, `pro_usage`
- **Sécurité** : Même que `/activate`

### 2. Mise à jour de `/app/admin/pro/page.tsx`

**Avant** :
```typescript
const { error } = await supabase
  .from('user_profiles')
  .update({ role: 'pro', pro_status: 'active' })
  .eq('user_id', userId);
```

**Après** :
```typescript
const { data: { session } } = await supabase.auth.getSession();
const response = await fetch('/api/admin/pro-requests/activate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({ user_id: userId }),
});
```

**Changements** :
- Les 3 fonctions `handleActivate`, `handleBlock`, `handleReject` utilisent maintenant les API routes
- Récupération du token de session via `supabase.auth.getSession()`
- Envoi du token dans le header `Authorization: Bearer {token}`
- Gestion d'erreur améliorée avec messages explicites

### 3. Correction de la policy RLS `orders`

**Fichier** : `SUPABASE_RLS_ORDERS_FIX.sql`

**Avant** :
```sql
USING (auth.uid()::text = customer_email OR ...)
```

**Après** :
```sql
USING (auth.email() = customer_email);
```

**Note** : Simplifié car `user_profiles` n'a pas de colonne `email`. L'email vient directement de `auth.users` via `auth.email()`.

**Pourquoi** : `auth.uid()::text` ne correspond pas à un email. Il faut utiliser `auth.email()` directement.

## 🔐 Sécurité implémentée

### Vérification admin dans les API routes

Chaque API route vérifie que l'utilisateur est admin via :

1. **Token valide** : `supabaseAdmin.auth.getUser(token)` vérifie que le token est valide
2. **Email autorisé** : Vérifie si `user.email === 'yvann.guyonnet@gmail.com'`
3. **Rôle admin** : Vérifie si `user_profiles.role === 'admin'` pour l'utilisateur

Si l'une de ces conditions n'est pas remplie → **403 Forbidden**

### Utilisation du service role

Toutes les mises à jour passent par `supabaseAdmin` (service role) :
- Bypass RLS automatique
- Pas besoin de politiques RLS supplémentaires pour les admins
- Sécurité renforcée côté serveur

## 📋 Checklist de déploiement

- [x] Créer `/api/admin/pro-requests/activate`
- [x] Créer `/api/admin/pro-requests/block`
- [x] Créer `/api/admin/pro-requests/reject`
- [x] Mettre à jour `/app/admin/pro/page.tsx`
- [x] Créer `SUPABASE_RLS_ORDERS_FIX.sql`
- [ ] **Exécuter le SQL** dans Supabase Dashboard :
  ```sql
  -- Voir SUPABASE_RLS_ORDERS_FIX.sql
  ```
- [ ] Tester les 3 actions (Activer, Bloquer, Refuser) depuis `/admin/pro`
- [ ] Vérifier que les non-admins reçoivent 403
- [ ] Vérifier que les updates fonctionnent correctement

## 🧪 Tests à effectuer

1. **Test admin valide** :
   - Se connecter en tant qu'admin
   - Aller sur `/admin/pro`
   - Activer une demande → Doit fonctionner
   - Bloquer un compte pro → Doit fonctionner
   - Refuser une demande → Doit fonctionner

2. **Test non-admin** :
   - Se connecter en tant qu'utilisateur normal
   - Essayer d'appeler directement les API routes → Doit retourner 403
   - Vérifier que les updates ne passent pas

3. **Test token invalide** :
   - Appeler les API routes sans token → Doit retourner 401
   - Appeler avec un token expiré → Doit retourner 401/403

## 🔄 Compatibilité

- ✅ `/api/admin/pro-requests` (GET) reste inchangé
- ✅ `/dashboard` et autres pages admin non affectées
- ✅ `useAdmin`, `useUser`, `useAuth` non modifiés
- ✅ RLS policies `user_profiles` existantes conservées

## 📝 Notes importantes

1. **Token de session** : Le token est récupéré à chaque action. Si la session expire, l'utilisateur doit se reconnecter.

2. **Validation UUID** : Chaque API route valide que `user_id` est un UUID valide avant de faire l'update.

3. **Gestion d'erreur** : Les erreurs sont capturées et retournent des messages explicites à l'utilisateur.

4. **Refresh automatique** : Après chaque action, la liste des demandes est automatiquement rechargée.

---

**Date de création** : 2024
**Dernière mise à jour** : 2024
