require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllUserData() {
  const email = 'sndrush12@gmail.com';

  try {
    console.log('🔍 Recherche du compte:', email);
    
    // Trouver l'utilisateur par email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Erreur lors de la liste des utilisateurs: ${listError.message}`);
    }

    const user = users.find(u => u.email === email);
    
    let userId = null;
    if (user) {
      userId = user.id;
      console.log(`📋 Compte trouvé: ${userId}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Créé le: ${user.created_at}`);
    } else {
      console.log('ℹ️ Aucun compte auth trouvé avec cet email');
      console.log('🔍 Recherche des données restantes dans les autres tables...');
    }

    // 1. Récupérer toutes les réservations de l'utilisateur
    console.log('\n📦 Récupération des réservations...');
    let reservationIds = [];
    
    if (userId) {
      const { data: userReservations } = await supabaseAdmin
        .from('reservations')
        .select('id')
        .eq('user_id', userId);
      reservationIds = userReservations?.map(r => r.id) || [];
    }
    
    // Aussi chercher par email dans les notes des réservations
    const { data: reservationsByEmail } = await supabaseAdmin
      .from('reservations')
      .select('id, notes');
    
    if (reservationsByEmail) {
      reservationsByEmail.forEach(r => {
        if (r.notes) {
          try {
            const notes = typeof r.notes === 'string' ? JSON.parse(r.notes) : r.notes;
            if (notes.customerEmail === email && !reservationIds.includes(r.id)) {
              reservationIds.push(r.id);
            }
          } catch (e) {
            // Ignorer les erreurs de parsing
          }
        }
      });
    }
    
    console.log(`   ${reservationIds.length} réservation(s) trouvée(s)`);

    // 2. Supprimer les états des lieux associés aux réservations
    if (reservationIds.length > 0) {
      console.log('\n🗑️ Suppression des états des lieux...');
      const { error: etatLieuxError } = await supabaseAdmin
        .from('etat_lieux')
        .delete()
        .in('reservation_id', reservationIds);
      
      if (etatLieuxError) {
        console.error('   ⚠️ Erreur:', etatLieuxError.message);
      } else {
        console.log('   ✅ États des lieux supprimés');
      }
    }

    // 3. Supprimer les réservations
    console.log('\n🗑️ Suppression des réservations...');
    let reservationsDeleted = 0;
    
    if (userId) {
      const { error: reservationsError } = await supabaseAdmin
        .from('reservations')
        .delete()
        .eq('user_id', userId);
      
      if (reservationsError) {
        console.error('   ⚠️ Erreur (par user_id):', reservationsError.message);
      } else {
        reservationsDeleted++;
      }
    }
    
    // Supprimer aussi par email dans les notes
    if (reservationIds.length > 0) {
      const { error: reservationsByEmailError } = await supabaseAdmin
        .from('reservations')
        .delete()
        .in('id', reservationIds);
      
      if (reservationsByEmailError) {
        console.error('   ⚠️ Erreur (par email):', reservationsByEmailError.message);
      } else {
        console.log('   ✅ Réservations supprimées');
      }
    } else {
      console.log('   ✅ Aucune réservation à supprimer');
    }

    // 4. Récupérer les IDs des commandes
    console.log('\n📦 Récupération des commandes...');
    const { data: userOrders } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('customer_email', email);
    
    const orderIds = userOrders?.map(o => o.id) || [];
    console.log(`   ${orderIds.length} commande(s) trouvée(s)`);

    // 5. Supprimer les order_items associés
    if (orderIds.length > 0) {
      console.log('\n🗑️ Suppression des order_items...');
      const { error: orderItemsError } = await supabaseAdmin
        .from('order_items')
        .delete()
        .in('order_id', orderIds);
      
      if (orderItemsError) {
        console.error('   ⚠️ Erreur:', orderItemsError.message);
      } else {
        console.log('   ✅ Order items supprimés');
      }
    }

    // 6. Supprimer les commandes
    if (orderIds.length > 0) {
      console.log('\n🗑️ Suppression des commandes...');
      const { error: ordersError } = await supabaseAdmin
        .from('orders')
        .delete()
        .eq('customer_email', email);
      
      if (ordersError) {
        console.error('   ⚠️ Erreur:', ordersError.message);
      } else {
        console.log('   ✅ Commandes supprimées');
      }
    }

    // 7. Supprimer le panier
    if (userId) {
      console.log('\n🗑️ Suppression du panier...');
      const { error: cartsError } = await supabaseAdmin
        .from('carts')
        .delete()
        .eq('user_id', userId);
      
      if (cartsError) {
        console.error('   ⚠️ Erreur:', cartsError.message);
      } else {
        console.log('   ✅ Panier supprimé');
      }
    } else {
      console.log('\n⏭️ Pas de panier à supprimer (pas de user_id)');
    }

    // 8. Supprimer le profil utilisateur
    if (userId) {
      console.log('\n🗑️ Suppression du profil utilisateur...');
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) {
        console.error('   ⚠️ Erreur:', profileError.message);
      } else {
        console.log('   ✅ Profil utilisateur supprimé');
      }
    } else {
      console.log('\n⏭️ Pas de profil à supprimer (pas de user_id)');
    }

    // 9. Supprimer le compte auth
    if (userId) {
      console.log('\n🗑️ Suppression du compte auth...');
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteUserError) {
        console.error('   ❌ Erreur:', deleteUserError.message);
        // Ne pas throw si le compte n'existe plus
        if (!deleteUserError.message.includes('not found')) {
          throw deleteUserError;
        }
      } else {
        console.log('   ✅ Compte auth supprimé');
      }
    } else {
      console.log('\n⏭️ Pas de compte auth à supprimer');
    }

    console.log('\n✅ Toutes les données du compte ont été supprimées avec succès !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la suppression:', error.message);
    process.exit(1);
  }
}

deleteAllUserData();
