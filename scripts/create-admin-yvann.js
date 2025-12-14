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

async function createAdmin() {
  const email = 'yvann.guyonnet@gmail.com';
  const password = 'Yywxcjji2025@';

  try {
    console.log('🔐 Création/Mise à jour de l\'utilisateur admin...');
    console.log('📧 Email:', email);
    
    // Vérifier si l'utilisateur existe déjà
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    let userId;

    if (existingUser) {
      // L'utilisateur existe déjà
      console.log('⚠️ L\'utilisateur existe déjà, mise à jour...');
      userId = existingUser.id;

      // Mettre à jour le mot de passe
      const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (updatePasswordError) {
        console.warn('⚠️ Erreur mise à jour mot de passe:', updatePasswordError.message);
      } else {
        console.log('✅ Mot de passe mis à jour');
      }

      // Mettre à jour les métadonnées
      const { error: updateMetadataError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { user_metadata: { role: 'admin' } }
      );

      if (updateMetadataError) {
        console.warn('⚠️ Erreur mise à jour métadonnées:', updateMetadataError.message);
      } else {
        console.log('✅ Métadonnées mises à jour');
      }
    } else {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'admin'
        }
      });

      if (authError) {
        throw new Error(`Erreur création utilisateur: ${authError.message}`);
      }

      userId = authData.user.id;
      console.log('✅ Utilisateur créé dans Auth:', userId);
    }

    // Vérifier si le profil existe
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      // Mettre à jour le rôle en admin
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Erreur mise à jour profil: ${updateError.message}`);
      }
      console.log('✅ Rôle admin attribué à l\'utilisateur existant');
    } else {
      // Créer le profil avec le rôle admin
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (profileError) {
        throw new Error(`Erreur création profil: ${profileError.message}`);
      }
      console.log('✅ Profil admin créé pour l\'utilisateur');
    }

    console.log('\n✅ Utilisateur admin créé/mis à jour avec succès !');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('👤 Rôle: admin');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création/mise à jour de l\'admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
