const { createClient } = require('@supabase/supabase-js');

// Assurez-vous que ces variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function updateProductImages() {
  console.log('🖼️  Début de la mise à jour des images des produits...\n');

  const updates = [
    {
      name: 'Mac Mah AS 115',
      image: '/enceintemacmah.png',
      searchPatterns: [
        '%mac mah%as 115%',
        '%macmah%as115%',
        '%mac mah%115%'
      ]
    },
    {
      name: 'FBT X-Lite 115A',
      image: '/enceintefbt.png',
      searchPatterns: [
        '%fbt%x-lite%115a%',
        '%fbt%xlite%115a%',
        '%fbt%115%'
      ]
    },
    {
      name: 'HPA Promix 8',
      image: '/hpa8.png',
      searchPatterns: [
        '%hpa%promix%8%',
        '%promix%8%'
      ],
      excludePattern: '%16%'
    },
    {
      name: 'HPA Promix 16',
      image: '/hpa16.png',
      searchPatterns: [
        '%hpa%promix%16%',
        '%promix%16%'
      ]
    }
  ];

  for (const item of updates) {
    console.log(`📦 Mise à jour de l'image pour ${item.name}...`);
    
    try {
      // Construire la requête de recherche
      let query = supabase
        .from('products')
        .select('id, name, images');

      // Appliquer les patterns de recherche
      const orConditions = item.searchPatterns.map(pattern => `name.ilike.${pattern}`).join(',');
      query = query.or(orConditions);

      // Exclure certains patterns si nécessaire
      if (item.excludePattern) {
        query = query.not('name', 'ilike', item.excludePattern);
      }

      const { data: products, error: fetchError } = await query;

      if (fetchError) {
        console.error(`❌ Erreur lors de la recherche de ${item.name}:`, fetchError.message);
        continue;
      }

      if (!products || products.length === 0) {
        console.log(`⚠️  Aucun produit trouvé pour ${item.name}`);
        continue;
      }

      // Mettre à jour chaque produit trouvé
      for (const product of products) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            images: [item.image],
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`❌ Erreur lors de la mise à jour de ${product.name} (${product.id}):`, updateError.message);
        } else {
          console.log(`✅ Image mise à jour pour "${product.name}" (${product.id})`);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${item.name}:`, error.message);
    }
  }

  // Vérification finale
  console.log('\n📊 Vérification des images mises à jour...');
  const { data: updatedProducts, error: verifyError } = await supabase
    .from('products')
    .select('id, name, images')
    .or('images.cs.{/enceintemacmah.png},images.cs.{/enceintefbt.png},images.cs.{/hpa8.png},images.cs.{/hpa16.png}');

  if (verifyError) {
    console.error('❌ Erreur lors de la vérification:', verifyError.message);
  } else {
    console.log(`\n✅ ${updatedProducts?.length || 0} produit(s) avec les nouvelles images:`);
    updatedProducts?.forEach(product => {
      console.log(`   - ${product.name}: ${product.images?.join(', ') || 'Aucune image'}`);
    });
  }

  console.log('\n✨ Mise à jour des images terminée.');
}

updateProductImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

