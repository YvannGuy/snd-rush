/**
 * Script pour créer un utilisateur admin
 * Usage: node scripts/create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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
  const email = 'sndrush12@gmail.com';
  const password = 'Yywxcjji2025@';

  try {
    console.log('🔐 Création de l\'utilisateur admin...');
    
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        role: 'admin'
      }
    });

    if (authError) {
      // Si l'utilisateur existe déjà, on récupère son ID
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        console.log('⚠️ L\'utilisateur existe déjà, récupération de l\'ID...');
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === email);
        
        if (!user) {
          throw new Error('Utilisateur existe mais introuvable');
        }

        const userId = user.id;

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

          if (updateError) throw updateError;
          console.log('✅ Rôle admin attribué à l\'utilisateur existant');
        } else {
          // Créer le profil avec le rôle admin
          const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
              user_id: userId,
              role: 'admin'
            });

          if (profileError) throw profileError;
          console.log('✅ Profil admin créé pour l\'utilisateur existant');
        }
      } else {
        throw authError;
      }
    } else {
      const userId = authData.user.id;
      console.log('✅ Utilisateur créé dans Auth:', userId);

      // Créer le profil utilisateur avec le rôle admin
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (profileError) {
        // Si le profil existe déjà, mettre à jour le rôle
        if (profileError.code === '23505') { // Unique violation
          const { error: updateError } = await supabaseAdmin
            .from('user_profiles')
            .update({ role: 'admin' })
            .eq('user_id', userId);

          if (updateError) throw updateError;
          console.log('✅ Profil existant mis à jour avec le rôle admin');
        } else {
          throw profileError;
        }
      } else {
        console.log('✅ Profil admin créé avec succès');
      }
    }

    console.log('\n✅ Utilisateur admin créé avec succès !');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('👤 Rôle: admin');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
