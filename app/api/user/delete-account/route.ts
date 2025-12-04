import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Configuration Supabase manquante' },
      { status: 500 }
    );
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Extraire le token Bearer
    const token = authHeader.replace('Bearer ', '');

    // Vérifier le token et obtenir l'utilisateur
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Supprimer toutes les données utilisateur dans l'ordre approprié
    // 1. Supprimer le panier
    await supabaseAdmin
      .from('carts')
      .delete()
      .eq('user_id', userId);

    // 2. Supprimer le profil utilisateur
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    // Note: Les réservations et commandes sont conservées pour des raisons légales/financières
    // mais peuvent être anonymisées si nécessaire

    // 3. Supprimer le compte auth (nécessite service role)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Erreur suppression compte:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression du compte' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Compte supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur API delete account:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

