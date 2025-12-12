import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(req: NextRequest) {
  // Sécurité: Vérifier une clé secrète pour éviter les appels non autorisés
  const authHeader = req.headers.get('authorization');
  const secretKey = process.env.ADMIN_CREATE_SECRET || 'temporary-secret-key-change-in-production';
  
  if (authHeader !== `Bearer ${secretKey}`) {
    return NextResponse.json(
      { success: false, error: 'Non autorisé' },
      { status: 401 }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Configuration Supabase manquante' },
      { status: 500 }
    );
  }

  const email = 'sndrush12@gmail.com';
  const password = 'Yywxcjji2025@';

  try {
    // Récupérer le body pour vérifier si on doit mettre à jour le mot de passe
    const body = await req.json().catch(() => ({}));
    const updatePassword = body.updatePassword === true;

    // Vérifier si l'utilisateur existe déjà
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // L'utilisateur existe déjà
      userId = existingUser.id;

      // Mettre à jour le mot de passe si demandé
      if (updatePassword) {
        const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password }
        );

        if (updatePasswordError) {
          console.warn('⚠️ Erreur mise à jour mot de passe:', updatePasswordError.message);
        } else {
          console.log('✅ Mot de passe mis à jour');
        }
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
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: 500 }
        );
      }

      userId = authData.user.id;
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
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Rôle admin attribué à l\'utilisateur existant',
        userId
      });
    } else {
      // Créer le profil avec le rôle admin
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (profileError) {
        return NextResponse.json(
          { success: false, error: profileError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Utilisateur admin créé avec succès',
        userId
      });
    }
  } catch (error: any) {
    console.error('Erreur création admin:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
