# 🔓 Configurer le bucket Supabase en PUBLIC

## ⚠️ Problème

OpenAI Vision API ne peut pas télécharger les images depuis Supabase :
```
Error while downloading https://[...].supabase.co/storage/v1/object/public/materiel-photos/...
code: 'invalid_image_url'
```

**Cause** : Le bucket `materiel-photos` n'est pas configuré comme PUBLIC dans Supabase.

---

## ✅ Solution : Rendre le bucket PUBLIC

### Étape 1 : Vérifier le statut actuel

1. Ouvrez votre dashboard Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Dans le menu latéral, cliquez sur **Storage**
4. Vous devriez voir le bucket `materiel-photos`
5. Vérifiez la colonne **"Public"** :
   - ✅ Si elle affiche "Public" → OK, passez à l'étape 2
   - ❌ Si elle affiche "Private" → Continuez ci-dessous

### Étape 2 : Rendre le bucket PUBLIC

**Option A : Via l'interface Supabase (RECOMMANDÉ)**

1. Dans **Storage**, cliquez sur le bucket `materiel-photos`
2. En haut à droite, cliquez sur **"..."** (3 points)
3. Sélectionnez **"Edit bucket"** ou **"Bucket settings"**
4. Cochez **"Public bucket"** ✅
5. Cliquez sur **"Save"**

**Option B : Via SQL (si l'interface ne fonctionne pas)**

Dans **SQL Editor**, exécutez :
```sql
-- Rendre le bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'materiel-photos';
```

### Étape 3 : Configurer les politiques (RLS)

Même avec un bucket public, vous devez configurer les politiques. Dans **SQL Editor** :

```sql
-- 1. D'abord supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Permettre upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Permettre lecture photos" ON storage.objects;
DROP POLICY IF EXISTS "Permettre suppression photos" ON storage.objects;

-- 2. Créer les nouvelles politiques PUBLIQUES
CREATE POLICY "Public upload photos" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'materiel-photos');

CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'materiel-photos');

CREATE POLICY "Public delete photos" ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'materiel-photos');
```

### Étape 4 : Vérifier que ça fonctionne

**Test 1 : Vérifier l'URL dans le navigateur**

1. Uploadez une photo dans l'état du matériel
2. Copiez l'URL de la photo (visible dans la console navigateur)
3. Ouvrez cette URL dans un nouvel onglet
4. ✅ Vous devez voir l'image sans erreur d'authentification
5. ❌ Si erreur 401/403 → Le bucket n'est pas vraiment public

**Test 2 : Vérifier depuis SQL**

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'materiel-photos';
```

**Résultat attendu** :
```
id                | name              | public
materiel-photos   | materiel-photos   | true
```

Si `public = false`, exécutez :
```sql
UPDATE storage.buckets SET public = true WHERE id = 'materiel-photos';
```

---

## 🔍 Diagnostic complet

Si après toutes ces étapes ça ne fonctionne toujours pas :

### 1. Vérifier les politiques actives

```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

### 2. Vérifier la configuration du bucket

```sql
SELECT * FROM storage.buckets WHERE id = 'materiel-photos';
```

### 3. Tester l'upload manuel

1. Allez dans **Storage** → `materiel-photos`
2. Cliquez sur **"Upload file"**
3. Uploadez une image test
4. Cliquez sur l'image
5. Cliquez sur **"Get URL"** ou **"Copy URL"**
6. Ouvrez cette URL dans un navigateur **en navigation privée**
7. ✅ L'image doit s'afficher sans authentification

---

## 🎯 URL correcte

L'URL publique correcte doit être :
```
https://[PROJET_ID].supabase.co/storage/v1/object/public/materiel-photos/etat-materiel/[FICHIER].jpg
```

**⚠️ Attention** :
- `public` doit être dans l'URL (pas `authenticated`)
- L'URL ne doit PAS demander de token d'authentification
- L'URL doit être accessible depuis n'importe où (même sans connexion)

---

## 🚀 Une fois configuré

1. **Redémarrez le serveur dev** :
   ```bash
   # Arrêter : Ctrl+C
   npm run dev
   ```

2. **Testez l'analyse IA** :
   - Uploadez une photo AVANT (JPEG/PNG)
   - Uploadez une photo APRÈS (JPEG/PNG)
   - L'analyse IA devrait se lancer automatiquement
   - Un encadré vert/jaune/rouge apparaît avec le rapport
   - Le rapport est inclus dans le PDF

3. **Vérifiez la console navigateur (F12)** :
   - ✅ `🤖 Lancement analyse IA automatique...`
   - ✅ `✅ Analyse IA reçue avec succès`
   - ❌ Si erreur → Vérifiez que l'URL est bien publique

---

## 📋 Checklist de vérification

- [ ] Bucket `materiel-photos` existe
- [ ] Bucket est marqué comme **Public** ✅
- [ ] Politiques SQL créées sans erreur
- [ ] URL d'image test accessible sans authentification
- [ ] Politique RLS : `FOR SELECT USING (bucket_id = 'materiel-photos')`
- [ ] OpenAI API key dans `.env.local`
- [ ] Serveur redémarré après changements
- [ ] Photos en format JPEG/PNG (pas HEIC)

---

## ⚡ Résolution rapide

**Si pressé, exécutez simplement ceci dans SQL Editor** :

```sql
-- Tout-en-un : bucket public + politiques
UPDATE storage.buckets SET public = true WHERE id = 'materiel-photos';

DROP POLICY IF EXISTS "Permettre upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Permettre lecture photos" ON storage.objects;
DROP POLICY IF EXISTS "Permettre suppression photos" ON storage.objects;

CREATE POLICY "Public upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'materiel-photos');

CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'materiel-photos');

CREATE POLICY "Public delete photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'materiel-photos');
```

Puis redémarrez le serveur ! 🚀

