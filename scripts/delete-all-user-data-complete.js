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
  try {
    console.log('🗑️ Suppression de TOUTES les données utilisateurs/clients...\n');

    // 1. Supprimer tous les états des lieux
    console.log('📋 Suppression des états des lieux...');
    const { data: allEtatsLieux, error: etatLieuxListError } = await supabaseAdmin
      .from('etat_lieux')
      .select('id');
    
    if (etatLieuxListError) {
      console.error('   ⚠️ Erreur récupération:', etatLieuxListError.message);
    } else {
      const count = allEtatsLieux?.length || 0;
      if (count > 0) {
        const { error: deleteError } = await supabaseAdmin
          .from('etat_lieux')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Condition toujours vraie pour tout supprimer
        
        if (deleteError) {
          console.error('   ❌ Erreur:', deleteError.message);
        } else {
          console.log(`   ✅ ${count} état(s) des lieux supprimé(s)`);
        }
      } else {
        console.log('   ℹ️ Aucun état des lieux à supprimer');
      }
    }

    // 2. Supprimer tous les order_items
    console.log('\n📋 Suppression des order_items...');
    const { data: allOrderItems, error: orderItemsListError } = await supabaseAdmin
      .from('order_items')
      .select('id');
    
    if (orderItemsListError) {
      console.error('   ⚠️ Erreur récupération:', orderItemsListError.message);
    } else {
      const count = allOrderItems?.length || 0;
      if (count > 0) {
        const { error: deleteError } = await supabaseAdmin
          .from('order_items')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
          console.error('   ❌ Erreur:', deleteError.message);
        } else {
          console.log(`   ✅ ${count} order item(s) supprimé(s)`);
        }
      } else {
        console.log('   ℹ️ Aucun order_item à supprimer');
      }
    }

    // 3. Supprimer toutes les réservations
    console.log('\n📋 Suppression des réservations...');
    const { data: allReservations, error: reservationsListError } = await supabaseAdmin
      .from('reservations')
      .select('id');
    
    if (reservationsListError) {
      console.error('   ⚠️ Erreur récupération:', reservationsListError.message);
    } else {
      const count = allReservations?.length || 0;
      if (count > 0) {
        const { error: deleteError } = await supabaseAdmin
          .from('reservations')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
          console.error('   ❌ Erreur:', deleteError.message);
        } else {
          console.log(`   ✅ ${count} réservation(s) supprimée(s)`);
        }
      } else {
        console.log('   ℹ️ Aucune réservation à supprimer');
      }
    }

    // 4. Supprimer toutes les commandes
    console.log('\n📋 Suppression des commandes...');
    const { data: allOrders, error: ordersListError } = await supabaseAdmin
      .from('orders')
      .select('id');
    
    if (ordersListError) {
      console.error('   ⚠️ Erreur récupération:', ordersListError.message);
    } else {
      const count = allOrders?.length || 0;
      if (count > 0) {
        const { error: deleteError } = await supabaseAdmin
          .from('orders')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
          console.error('   ❌ Erreur:', deleteError.message);
        } else {
          console.log(`   ✅ ${count} commande(s) supprimée(s)`);
        }
      } else {
        console.log('   ℹ️ Aucune commande à supprimer');
      }
    }

    // 5. Supprimer tous les paniers
    console.log('\n📋 Suppression des paniers...');
    const { data: allCarts, error: cartsListError } = await supabaseAdmin
      .from('carts')
      .select('id');
    
    if (cartsListError) {
      console.error('   ⚠️ Erreur récupération:', cartsListError.message);
    } else {
      const count = allCarts?.length || 0;
      if (count > 0) {
        const { error: deleteError } = await supabaseAdmin
          .from('carts')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
          console.error('   ❌ Erreur:', deleteError.message);
        } else {
          console.log(`   ✅ ${count} panier(s) supprimé(s)`);
        }
      } else {
        console.log('   ℹ️ Aucun panier à supprimer');
      }
    }

    // 6. Supprimer tous les profils utilisateurs (sauf admins)
    console.log('\n📋 Suppression des profils utilisateurs (non-admin)...');
    const { data: allProfiles, error: profilesListError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, role');
    
    if (profilesListError) {
      console.error('   ⚠️ Erreur récupération:', profilesListError.message);
    } else {
      const nonAdminProfiles = (allProfiles || []).filter(p => p.role !== 'admin');
      const count = nonAdminProfiles.length;
      
      if (count > 0) {
        const userIdsToDelete = nonAdminProfiles.map(p => p.user_id);
        const { error: deleteError } = await supabaseAdmin
          .from('user_profiles')
          .delete()
          .in('user_id', userIdsToDelete);
        
        if (deleteError) {
          console.error('   ❌ Erreur:', deleteError.message);
        } else {
          console.log(`   ✅ ${count} profil(s) utilisateur(s) supprimé(s) (admins conservés)`);
        }
      } else {
        console.log('   ℹ️ Aucun profil utilisateur non-admin à supprimer');
      }
    }

    // 7. Supprimer tous les comptes auth (sauf admins)
    console.log('\n📋 Suppression des comptes auth (non-admin)...');
    const { data: { users }, error: usersListError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersListError) {
      console.error('   ⚠️ Erreur récupération:', usersListError.message);
    } else {
      // Identifier les admins
      const adminUserIds = new Set();
      if (allProfiles) {
        allProfiles.forEach(p => {
          if (p.role === 'admin') {
            adminUserIds.add(p.user_id);
          }
        });
      }

      const usersToDelete = (users || []).filter(u => !adminUserIds.has(u.id));
      const count = usersToDelete.length;
      
      if (count > 0) {
        console.log(`   Suppression de ${count} compte(s) utilisateur(s)...`);
        let deletedCount = 0;
        let errorCount = 0;
        
        for (const user of usersToDelete) {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (deleteError) {
            console.error(`   ⚠️ Erreur suppression ${user.email}:`, deleteError.message);
            errorCount++;
          } else {
            deletedCount++;
          }
        }
        
        console.log(`   ✅ ${deletedCount} compte(s) auth supprimé(s)`);
        if (errorCount > 0) {
          console.log(`   ⚠️ ${errorCount} erreur(s) lors de la suppression`);
        }
      } else {
        console.log('   ℹ️ Aucun compte utilisateur non-admin à supprimer');
      }
    }

    console.log('\n✅ Nettoyage complet terminé !');
    console.log('📊 La base de données est maintenant vierge (sauf comptes admin).');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage:', error.message);
    process.exit(1);
  }
}

deleteAllUserData();
