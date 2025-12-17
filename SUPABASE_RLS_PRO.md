# Documentation SQL - Extension user_profiles pour Espace Pro

## 1. Ajouter les colonnes à la table `user_profiles`

Exécutez ces commandes SQL dans le Supabase SQL Editor :

```sql
-- Ajouter la colonne pro_status
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS pro_status TEXT DEFAULT 'pending'
CHECK (pro_status IN ('pending', 'active', 'blocked'));

-- Ajouter la colonne pro_type
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS pro_type TEXT;

-- Ajouter la colonne pro_usage
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS pro_usage TEXT;

-- Ajouter un index pour améliorer les performances des requêtes pro
CREATE INDEX IF NOT EXISTS idx_user_profiles_pro_status 
ON user_profiles(pro_status) 
WHERE pro_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_pro_status 
ON user_profiles(role, pro_status) 
WHERE role = 'pro' AND pro_status IS NOT NULL;
```

## 2. Politiques RLS pour l'Espace Pro

### Politique pour SELECT sur `user_profiles` (pro status)

```sql
-- Les utilisateurs peuvent voir leur propre profil (y compris pro_status)
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leur propre profil (pour demander accès pro)
CREATE POLICY "Users can update own profile for pro request"
ON user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Ne pas permettre de modifier directement pro_status vers 'active' (réservé aux admins)
  (pro_status IS NULL OR pro_status = 'pending' OR OLD.pro_status = NEW.pro_status)
);
```

### Politique pour INSERT sur `user_profiles` (upsert pour demande pro)

```sql
-- Les utilisateurs peuvent créer/mettre à jour leur profil pour demander l'accès pro
CREATE POLICY "Users can upsert own profile for pro request"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Politique pour SELECT sur `products` (catalogue pro)

**Option 1 : Via RLS (si vous voulez restreindre l'accès aux produits)**

```sql
-- Les pros actifs peuvent voir tous les produits
CREATE POLICY "Active pros can view products"
ON products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'pro'
    AND user_profiles.pro_status = 'active'
  )
);
```

**Option 2 : Via API Route avec service role (recommandé pour l'instant)**

Si vous utilisez déjà des API routes avec le service role key pour le catalogue admin, vous pouvez réutiliser la même approche pour le catalogue pro. Dans ce cas, pas besoin de politique RLS supplémentaire sur `products` - l'API route vérifiera `isPro` côté client avant de retourner les produits.

## 3. Notes importantes

- **Ne pas modifier le champ `role` existant** : Le système admin dépend déjà de `role='admin'` ou de l'email `yvann.guyonnet@gmail.com`. Ajoutez simplement `role='pro'` pour les professionnels.

- **Activation manuelle par admin** : Pour activer un compte pro, un admin doit :
  1. Mettre à jour `role='pro'` dans `user_profiles`
  2. Mettre à jour `pro_status='active'` dans `user_profiles`

  Exemple SQL pour activer un compte pro :
  ```sql
  UPDATE user_profiles
  SET role = 'pro', pro_status = 'active'
  WHERE user_id = 'uuid-de-l-utilisateur';
  ```

- **Cart system** : Le système de panier existant (`carts` table) reste inchangé. Le minicart est simplement masqué côté UI sauf pour les pros actifs dans `/pro/*`.

## 4. Vérification

Après avoir exécuté les migrations SQL, vérifiez que :

1. Les colonnes sont bien créées :
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'user_profiles'
   AND column_name IN ('pro_status', 'pro_type', 'pro_usage');
   ```

2. Les politiques RLS sont actives :
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'user_profiles';
   ```

---

**Note** : Ces politiques RLS sont minimales et sécurisées. Elles permettent aux utilisateurs de demander l'accès pro sans pouvoir activer leur propre compte (réservé aux admins).
