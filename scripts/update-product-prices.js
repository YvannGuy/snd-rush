/**
 * Script pour mettre à jour les prix des produits dans Supabase
 * 
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/update-product-prices.js
 * 
 * Ou avec dotenv (si installé):
 *   node scripts/update-product-prices.js
 * 
 * Prérequis:
 *   - Variables d'environnement:
 *     - NEXT_PUBLIC_SUPABASE_URL
 *     - SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

// Essayer de charger dotenv si disponible (optionnel)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv n'est pas installé, ce n'est pas grave
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes');
  console.error('   Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateProductPrices() {
  console.log('🔄 Début de la mise à jour des prix...\n');

  try {
    // 1. Mettre à jour le caisson de basse (100€ → 90€)
    console.log('📦 Mise à jour du caisson de basse (100€ → 90€)...');
    const { data: caissonData, error: caissonError } = await supabase
      .from('products')
      .update({ daily_price_ttc: 90 })
      .like('name', '%caisson%')
      .eq('daily_price_ttc', 100)
      .select();

    if (caissonError) {
      console.error('❌ Erreur lors de la mise à jour du caisson:', caissonError);
    } else {
      console.log(`✅ ${caissonData?.length || 0} caisson(s) mis à jour`);
    }

    // 2. Mettre à jour Promix 8 (40€ → 30€)
    console.log('\n📦 Mise à jour du Promix 8 (40€ → 30€)...');
    const { data: promix8Data, error: promix8Error } = await supabase
      .from('products')
      .update({ daily_price_ttc: 30 })
      .or('name.ilike.%promix%8%,name.ilike.%promix 8%')
      .eq('daily_price_ttc', 40)
      .select();

    if (promix8Error) {
      console.error('❌ Erreur lors de la mise à jour du Promix 8:', promix8Error);
    } else {
      console.log(`✅ ${promix8Data?.length || 0} Promix 8 mis à jour`);
    }

    // 3. Mettre à jour Promix 16 (80€ → 70€)
    console.log('\n📦 Mise à jour du Promix 16 (80€ → 70€)...');
    const { data: promix16Data, error: promix16Error } = await supabase
      .from('products')
      .update({ daily_price_ttc: 70 })
      .or('name.ilike.%promix%16%,name.ilike.%promix 16%')
      .eq('daily_price_ttc', 80)
      .select();

    if (promix16Error) {
      console.error('❌ Erreur lors de la mise à jour du Promix 16:', promix16Error);
    } else {
      console.log(`✅ ${promix16Data?.length || 0} Promix 16 mis à jour`);
    }

    // Vérification finale
    console.log('\n📊 Vérification des prix mis à jour...');
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, name, category, daily_price_ttc, updated_at')
      .in('daily_price_ttc', [30, 70, 90])
      .order('daily_price_ttc', { ascending: true });

    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError);
    } else {
      console.log(`\n✅ ${updatedProducts?.length || 0} produit(s) avec les nouveaux prix:`);
      updatedProducts?.forEach(product => {
        console.log(`   - ${product.name} (${product.category}): ${product.daily_price_ttc}€`);
      });
    }

    console.log('\n✅ Mise à jour terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
updateProductPrices();

