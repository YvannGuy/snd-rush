# 🔧 Guide de Configuration Supabase - État du Matériel

Ce guide explique comment configurer Supabase pour que les photos soient bien sauvegardées dans le cloud.

## 📋 Prérequis

1. Un compte Supabase (gratuit sur [supabase.com](https://supabase.com))
2. Un projet Supabase créé

## 🚀 Étape 1 : Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-publique
```

### 🔍 Où trouver ces informations ?

1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Cliquez sur l'icône ⚙️ **Settings** (en bas à gauche)
4. Allez dans **API**
5. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📦 Étape 2 : Exécuter le script SQL

1. Dans votre dashboard Supabase, allez dans **SQL Editor** (icône 🗂️)
2. Créez une nouvelle requête
3. Copiez-collez le contenu complet du fichier `supabase-setup.sql`
4. Cliquez sur **RUN** (ou F5)

Ce script va créer :
- ✅ La table `rapports_materiel` pour stocker les rapports
- ✅ Le bucket `materiel-photos` pour stocker les photos
- ✅ Les policies de sécurité pour permettre l'upload et la lecture

## ✅ Étape 3 : Vérifier que le bucket est créé

1. Dans le dashboard Supabase, allez dans **Storage** (icône 📁)
2. Vous devriez voir un bucket nommé `materiel-photos`
3. Cliquez dessus pour voir sa configuration
4. Assurez-vous qu'il est marqué comme **Public**

### ⚙️ Configuration recommandée du bucket

- **Nom** : `materiel-photos`
- **Public** : ✅ Oui
- **File size limit** : 50MB
- **Allowed MIME types** : `image/*`

## 🧪 Étape 4 : Tester l'upload

1. Redémarrez votre serveur Next.js :
   ```bash
   npm run dev
   ```

2. Allez sur `/etat-materiel`

3. Uploadez une photo

4. Ouvrez la console du navigateur (F12) et regardez les messages :
   - ✅ `Photo uploadée vers Supabase: etat-materiel/...` → **Succès !**
   - ❌ `Le bucket "materiel-photos" n'existe pas` → **Retournez à l'étape 2**
   - ℹ️ `Supabase non configuré` → **Retournez à l'étape 1**

5. Vérifiez dans **Supabase Dashboard → Storage → materiel-photos** que les photos apparaissent

## 🔍 Diagnostic des problèmes

### Problème : "Supabase non configuré"

**Cause** : Les variables d'environnement ne sont pas définies

**Solution** :
1. Vérifiez que `.env.local` existe et contient les bonnes valeurs
2. Redémarrez le serveur Next.js (`npm run dev`)
3. Actualisez la page

### Problème : "Le bucket materiel-photos n'existe pas"

**Cause** : Le script SQL n'a pas été exécuté ou a échoué

**Solution** :
1. Allez dans **Supabase → Storage**
2. Si le bucket n'existe pas, créez-le manuellement :
   - Cliquez sur **New bucket**
   - Nom : `materiel-photos`
   - Public : ✅ Oui
   - Cliquez sur **Create bucket**
3. Puis exécutez uniquement les policies du script SQL (lignes 44-54)

### Problème : "Row Level Security policy violation"

**Cause** : Les policies de sécurité n'ont pas été créées

**Solution** :
1. Dans **SQL Editor**, exécutez :
```sql
CREATE POLICY IF NOT EXISTS "Permettre upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'materiel-photos');

CREATE POLICY IF NOT EXISTS "Permettre lecture photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'materiel-photos');
```

### Problème : Les photos sont en base64 au lieu d'URL Supabase

**Cause** : L'upload vers Supabase a échoué, le système utilise le fallback base64

**Solution** :
1. Ouvrez la console du navigateur (F12)
2. Regardez les messages d'erreur détaillés
3. Vérifiez que les étapes 1 et 2 sont bien complétées
4. Vérifiez que le bucket est **Public**

## 🎯 Comment savoir si ça fonctionne ?

✅ **Les photos sont bien sauvegardées dans Supabase si** :

1. Dans la console du navigateur, vous voyez : `✅ Photo uploadée vers Supabase`
2. Les URLs des photos commencent par `https://votre-projet.supabase.co/storage/v1/object/public/materiel-photos/...`
3. Dans **Supabase Dashboard → Storage → materiel-photos**, vous voyez les photos uploadées

❌ **Les photos sont en base64 (non optimal) si** :

1. Les URLs des photos commencent par `data:image/...`
2. Le PDF généré est très volumineux (plusieurs MB)
3. Dans la console, vous voyez des erreurs d'upload

## 📊 Avantages de Supabase vs Base64

| Critère | Supabase Storage ✅ | Base64 ❌ |
|---------|---------------------|-----------|
| Taille du PDF | Petit (~100KB) | Très gros (plusieurs MB) |
| Vitesse de chargement | Rapide | Lent |
| Stockage persistant | Oui, dans le cloud | Non, perdu au rechargement |
| Bande passante | Optimisée | Très élevée |
| Partage du PDF | Facile | Difficile (fichier trop gros) |

## 💡 Conseils

- Les photos sont automatiquement sauvegardées dans le dossier `etat-materiel/` du bucket
- Chaque photo a un nom unique avec timestamp pour éviter les conflits
- En cas d'échec de l'upload, le système utilise automatiquement base64 (fallback)
- Les photos sont **publiques** pour faciliter la génération de PDF

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Ouvrez la console du navigateur (F12) et regardez les messages
2. Vérifiez le dashboard Supabase → Storage
3. Assurez-vous que les variables d'environnement sont bien définies
4. Redémarrez le serveur Next.js après toute modification du `.env.local`

