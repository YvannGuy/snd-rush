# Guide de mise à jour des prix dans Supabase

Ce document explique comment mettre à jour les prix des produits dans la base de données Supabase pour aligner avec la nouvelle stratégie tarifaire (-10€ par rapport à Locasono).

## 📋 Résumé des changements de prix

### Packs
- **Pack Essentiel** : 349€ → **129€**
- **Pack Standard** : 799€ → **179€**
- **Pack Premium** : 1499€ → **229€**
- **Pack Prestige** : Sur devis (inchangé)

### Produits individuels
- **Enceinte** : 70€ (inchangé)
- **Caisson de basse 18"** : 100€ → **90€**
- **HPA Promix 8** : 40€ → **30€**
- **HPA Promix 16** : 80€ → **70€**
- **Micro filaire** : 10€ (inchangé)
- **Micro sans fil** : 20€ (inchangé)

## 🔧 Méthode 1 : Via l'interface Supabase (Recommandé)

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu du fichier `supabase-migrations/005_update_product_prices.sql`
4. Exécutez la requête

## 🔧 Méthode 2 : Via l'interface Admin de l'application

1. Connectez-vous à `/admin/catalogue`
2. Pour chaque produit concerné :
   - Cliquez sur le produit
   - Modifiez le champ "Prix journalier TTC"
   - Sauvegardez

## 🔧 Méthode 3 : Via script Node.js (Automatisé)

1. Assurez-vous que les variables d'environnement sont configurées dans `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url
   SUPABASE_SERVICE_ROLE_KEY=votre_cle_service
   ```

2. Exécutez le script :
   ```bash
   node scripts/update-product-prices.js
   ```

   Ou avec les variables d'environnement en ligne de commande :
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/update-product-prices.js
   ```

Le script affichera un résumé des mises à jour effectuées.

## 🔧 Méthode 4 : Requêtes SQL individuelles

### Mettre à jour le caisson de basse
```sql
UPDATE products 
SET daily_price_ttc = 90
WHERE LOWER(name) LIKE '%caisson%' 
  AND daily_price_ttc = 100;
```

### Mettre à jour Promix 8
```sql
UPDATE products 
SET daily_price_ttc = 30
WHERE (LOWER(name) LIKE '%promix%8%' OR LOWER(name) LIKE '%promix 8%')
  AND daily_price_ttc = 40;
```

### Mettre à jour Promix 16
```sql
UPDATE products 
SET daily_price_ttc = 70
WHERE (LOWER(name) LIKE '%promix%16%' OR LOWER(name) LIKE '%promix 16%')
  AND daily_price_ttc = 80;
```

## ✅ Vérification

Après la mise à jour, vérifiez que les prix sont corrects :

```sql
SELECT 
  id,
  name,
  category,
  daily_price_ttc,
  updated_at
FROM products
WHERE daily_price_ttc IN (30, 70, 90)
ORDER BY daily_price_ttc, name;
```

## ⚠️ Notes importantes

1. **Sauvegarde** : Faites une sauvegarde de votre base de données avant d'exécuter les requêtes
2. **Test** : Testez d'abord sur un environnement de développement si possible
3. **Vérification** : Vérifiez que les produits existants dans la base correspondent aux noms utilisés dans les requêtes
4. **Packs** : Les packs ne sont pas stockés dans la table `products`, leurs prix sont gérés dans le code (`lib/packs.ts` et `types/assistant.ts`)

## 📝 Fichiers de code modifiés

Les prix dans le code ont déjà été mis à jour dans :
- `lib/packs.ts` - Prix de base des packs
- `types/assistant.ts` - Configuration des prix (PRICING_CONFIG)
- `lib/assistant-logic.ts` - Logique de détection de lumière par défaut
- `components/PackDetailContent.tsx` - Prix affichés
- `components/PacksSection.tsx` - Prix des packs
- `app/generateur_de_prix/page.tsx` - Prix des produits individuels
- `lib/computeQuote.ts` - Prix pour les calculs de devis

