# Guide de mise à jour des images des produits dans Supabase

Ce document explique comment mettre à jour les images des produits dans la base de données Supabase.

## 📋 Produits concernés

1. **Enceinte Mac Mah AS 115** → `/enceintemacmah.png`
2. **Enceinte FBT X-Lite 115A** → `/enceintefbt.png`
3. **HPA Promix 8** → `/hpa8.png`
4. **HPA Promix 16** → `/hpa16.png`

## ✅ Vérification des fichiers

Tous les fichiers d'images sont présents dans le dossier `public/` :
- ✅ `public/enceintemacmah.png`
- ✅ `public/enceintefbt.png`
- ✅ `public/hpa8.png`
- ✅ `public/hpa16.png`

## 🔧 Méthode 1 : Via l'interface Supabase (Recommandé)

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu du fichier `supabase-migrations/006_update_product_images.sql`
4. Exécutez la requête

## 🔧 Méthode 2 : Via script Node.js (Automatisé)

1. Assurez-vous que les variables d'environnement sont configurées dans `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url
   SUPABASE_SERVICE_ROLE_KEY=votre_cle_service
   ```

2. Exécutez le script :
   ```bash
   node scripts/update-product-images.js
   ```

   Ou avec les variables d'environnement en ligne de commande :
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/update-product-images.js
   ```

Le script affichera un résumé des mises à jour effectuées.

## 🔧 Méthode 3 : Via l'interface Admin de l'application

1. Connectez-vous à `/admin/catalogue`
2. Pour chaque produit concerné :
   - Cliquez sur le produit
   - Modifiez le champ "Images" avec le chemin de l'image (ex: `/enceintemacmah.png`)
   - Sauvegardez

## 🔧 Méthode 4 : Requêtes SQL individuelles

### Mettre à jour l'image de l'enceinte Mac Mah AS 115
```sql
UPDATE products 
SET 
  images = ARRAY['/enceintemacmah.png'],
  updated_at = NOW()
WHERE LOWER(name) LIKE '%mac mah%as 115%' 
   OR LOWER(name) LIKE '%macmah%as115%'
   OR (LOWER(name) LIKE '%mac mah%' AND LOWER(name) LIKE '%115%');
```

### Mettre à jour l'image de l'enceinte FBT X-Lite 115A
```sql
UPDATE products 
SET 
  images = ARRAY['/enceintefbt.png'],
  updated_at = NOW()
WHERE LOWER(name) LIKE '%fbt%x-lite%115a%'
   OR LOWER(name) LIKE '%fbt%xlite%115a%'
   OR (LOWER(name) LIKE '%fbt%' AND LOWER(name) LIKE '%115%');
```

### Mettre à jour l'image du HPA Promix 8
```sql
UPDATE products 
SET 
  images = ARRAY['/hpa8.png'],
  updated_at = NOW()
WHERE (LOWER(name) LIKE '%hpa%promix%8%' 
    OR LOWER(name) LIKE '%promix%8%')
   AND LOWER(name) NOT LIKE '%16%';
```

### Mettre à jour l'image du HPA Promix 16
```sql
UPDATE products 
SET 
  images = ARRAY['/hpa16.png'],
  updated_at = NOW()
WHERE LOWER(name) LIKE '%hpa%promix%16%' 
   OR LOWER(name) LIKE '%promix%16%';
```

## ✅ Vérification

Après la mise à jour, vérifiez que les images sont correctes :

```sql
SELECT 
  id,
  name,
  images,
  updated_at
FROM products
WHERE images && ARRAY['/enceintemacmah.png', '/enceintefbt.png', '/hpa8.png', '/hpa16.png']
ORDER BY name;
```

## ⚠️ Notes importantes

1. **Sauvegarde** : Faites une sauvegarde de votre base de données avant d'exécuter les requêtes
2. **Test** : Testez d'abord sur un environnement de développement si possible
3. **Vérification** : Vérifiez que les produits existants dans la base correspondent aux noms utilisés dans les requêtes
4. **Chemins d'images** : Les chemins d'images doivent commencer par `/` pour être accessibles depuis le dossier `public/`

