/**
 * Script pour vérifier l'accès admin d'un utilisateur
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminAccess(email) {
  console.log(`\n🔍 Vérification de l'accès admin pour: ${email}\n`);

  try {
    // 1. Vérifier si l'utilisateur existe dans Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', listError);
      return;
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log(`❌ Utilisateur ${email} non trouvé dans Auth`);
      return;
    }

    console.log(`✅ Utilisateur trouvé dans Auth:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email vérifié: ${user.email_confirmed_at ? '✅ Oui' : '❌ Non'}`);
    console.log(`   Métadonnées:`, JSON.stringify(user.user_metadata || {}, null, 2));

    // 2. Vérifier le rôle dans user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, user_id, email')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erreur lors de la récupération du profil:', profileError);
    } else if (profile) {
      console.log(`\n✅ Profil trouvé dans user_profiles:`);
      console.log(`   Rôle: ${profile.role || 'Non défini'}`);
      console.log(`   Email: ${profile.email || 'Non défini'}`);
    } else {
      console.log(`\n⚠️  Aucun profil trouvé dans user_profiles`);
    }

    // 3. Vérifier les conditions d'accès admin
    const isAdminByEmail = user.email?.toLowerCase() === 'yvann.guyonnet@gmail.com';
    const isAdminByRole = profile?.role?.toLowerCase() === 'admin';
    const isAdminByMetadata = user.user_metadata?.role?.toLowerCase() === 'admin';

    console.log(`\n📋 Vérification des conditions d'accès admin:`);
    console.log(`   Email yvann.guyonnet@gmail.com: ${isAdminByEmail ? '✅ Oui' : '❌ Non'}`);
    console.log(`   Rôle dans user_profiles: ${isAdminByRole ? '✅ Oui' : '❌ Non'}`);
    console.log(`   Rôle dans user_metadata: ${isAdminByMetadata ? '✅ Oui' : '❌ Non'}`);

    const hasAdminAccess = isAdminByEmail || isAdminByRole || isAdminByMetadata;

    console.log(`\n${hasAdminAccess ? '✅' : '❌'} Accès admin: ${hasAdminAccess ? 'AUTORISÉ' : 'REFUSÉ'}\n`);

    if (!hasAdminAccess) {
      console.log('💡 Pour donner l\'accès admin:');
      console.log('   1. Ajouter le rôle "admin" dans user_profiles:');
      console.log(`      UPDATE user_profiles SET role = 'admin' WHERE user_id = '${user.id}';`);
      console.log('\n   2. Ou utiliser le script:');
      console.log(`      node scripts/create-admin-yvann.js\n`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2] || 'yvann.guyonnet@gmail.com';

checkAdminAccess(email).catch(console.error);
