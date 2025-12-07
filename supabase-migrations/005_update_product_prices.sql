-- Migration: Mise à jour des prix des produits individuels
-- Date: 2025-01-XX
-- Description: Alignement des prix avec la stratégie tarifaire (-10€ par rapport à Locasono)

-- Mise à jour des prix des produits individuels
-- Note: Les prix sont en euros TTC (daily_price_ttc)

-- 1. Enceinte active 15" (ou similaire) - 70€ (déjà correct, pas de changement)
-- UPDATE products 
-- SET daily_price_ttc = 70
-- WHERE LOWER(name) LIKE '%enceinte%' 
--   AND (LOWER(name) LIKE '%15%' OR LOWER(name) LIKE '%active%')
--   AND daily_price_ttc != 70;

-- 2. Caisson de basse 18" - 100€ → 90€
UPDATE products 
SET daily_price_ttc = 90
WHERE LOWER(name) LIKE '%caisson%' 
  AND daily_price_ttc = 100;

-- 3. HPA Promix 8 - 40€ → 30€
UPDATE products 
SET daily_price_ttc = 30
WHERE (LOWER(name) LIKE '%promix%8%' OR LOWER(name) LIKE '%promix 8%')
  AND daily_price_ttc = 40;

-- 4. HPA Promix 16 - 80€ → 70€
UPDATE products 
SET daily_price_ttc = 70
WHERE (LOWER(name) LIKE '%promix%16%' OR LOWER(name) LIKE '%promix 16%')
  AND daily_price_ttc = 80;

-- 5. Micro filaire (Shure SM58 ou similaire) - 10€ (déjà correct, pas de changement)
-- UPDATE products 
-- SET daily_price_ttc = 10
-- WHERE LOWER(category) = 'micros' 
--   AND (LOWER(name) LIKE '%shure%' OR LOWER(name) LIKE '%sm58%' OR LOWER(name) LIKE '%filaire%')
--   AND daily_price_ttc != 10;

-- 6. Micro sans fil - 20€ (déjà correct, pas de changement)
-- UPDATE products 
-- SET daily_price_ttc = 20
-- WHERE LOWER(category) = 'micros' 
--   AND (LOWER(name) LIKE '%sans%fil%' OR LOWER(name) LIKE '%wireless%' OR LOWER(name) LIKE '%hf%')
--   AND daily_price_ttc != 20;

-- Vérification des mises à jour
-- SELECT 
--   id,
--   name,
--   category,
--   daily_price_ttc,
--   updated_at
-- FROM products
-- WHERE daily_price_ttc IN (30, 70, 90)
-- ORDER BY daily_price_ttc, name;

