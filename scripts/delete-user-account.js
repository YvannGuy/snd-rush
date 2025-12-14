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

async function deleteUserAccount() {
  const email = 'sndrush12@gmail.com';

  try {
    console.log('🔍 Recherche des comptes avec l\'email:', email);
    
    // Lister tous les utilisateurs
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Erreur lors de la liste des utilisateurs: ${listError.message}`);
    }

    // Trouver tous les comptes avec cet email
    const matchingUsers = users.filter(u => u.email === email);
    
    if (matchingUsers.length === 0) {
      console.log('ℹ️ Aucun compte trouvé avec cet email');
      return;
    }

    console.log(`📋 ${matchingUsers.length} compte(s) trouvé(s) avec cet email`);

    // Pour chaque compte, vérifier le rôle dans user_profiles
    for (const user of matchingUsers) {
      console.log(`\n👤 Vérification du compte: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Créé le: ${user.created_at}`);

      // Vérifier le profil dans user_profiles
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('   ❌ Erreur lors de la récupération du profil:', profileError.message);
        continue;
      }

      const role = profile?.role || user.user_metadata?.role || 'user';
      console.log(`   Rôle: ${role}`);

      // Si c'est un admin, on le garde
      if (role === 'admin') {
        console.log('   ✅ Compte admin conservé');
        // S'assurer que le rôle admin est bien défini
        if (!profile || profile.role !== 'admin') {
          console.log('   🔧 Mise à jour du profil pour définir le rôle admin...');
          if (profile) {
            await supabaseAdmin
              .from('user_profiles')
              .update({ role: 'admin' })
              .eq('user_id', user.id);
          } else {
            await supabaseAdmin
              .from('user_profiles')
              .insert({ user_id: user.id, role: 'admin' });
          }
          console.log('   ✅ Rôle admin défini');
        }
      } else {
        // Si c'est un utilisateur normal, on le supprime
        console.log('   🗑️ Suppression du compte utilisateur...');
        
        // Supprimer le profil d'abord
        if (profile) {
          const { error: deleteProfileError } = await supabaseAdmin
            .from('user_profiles')
            .delete()
            .eq('user_id', user.id);
          
          if (deleteProfileError) {
            console.error('   ⚠️ Erreur lors de la suppression du profil:', deleteProfileError.message);
          } else {
            console.log('   ✅ Profil supprimé');
          }
        }

        // Supprimer le compte Auth
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (deleteUserError) {
          console.error('   ❌ Erreur lors de la suppression du compte:', deleteUserError.message);
        } else {
          console.log('   ✅ Compte utilisateur supprimé');
        }
      }
    }

    console.log('\n✅ Opération terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error.message);
    process.exit(1);
  }
}

deleteUserAccount();
