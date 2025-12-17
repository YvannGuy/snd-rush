import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper pour vérifier si l'utilisateur est admin
async function verifyAdmin(token: string): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  try {
    // Vérifier le token et obtenir l'utilisateur
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return { isAdmin: false, error: 'Token invalide ou expiré' };
    }

    // Vérifier si admin via email autorisé
    const authorizedEmail = 'yvann.guyonnet@gmail.com';
    if (user.email?.toLowerCase() === authorizedEmail.toLowerCase()) {
      return { isAdmin: true, userId: user.id };
    }

    // Vérifier si admin via user_profiles.role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erreur vérification profil admin:', profileError);
      return { isAdmin: false, error: 'Erreur vérification profil' };
    }

    const isAdminRole = profile?.role?.toLowerCase() === 'admin';
    
    return { isAdmin: isAdminRole, userId: user.id };
  } catch (error: any) {
    console.error('Erreur vérification admin:', error);
    return { isAdmin: false, error: error.message || 'Erreur serveur' };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Vérifier le token Authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token d\'autorisation manquant' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Vérifier que l'utilisateur est admin
    const { isAdmin, userId: adminUserId, error: adminError } = await verifyAdmin(token);
    
    if (!isAdmin || adminError) {
      return NextResponse.json(
        { success: false, error: adminError || 'Accès non autorisé. Seuls les administrateurs peuvent effectuer cette action.' },
        { status: 403 }
      );
    }

    // Récupérer le user_id depuis le body
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id manquant' },
        { status: 400 }
      );
    }

    // Valider que c'est un UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      return NextResponse.json(
        { success: false, error: 'user_id invalide' },
        { status: 400 }
      );
    }

    // Mettre à jour via supabaseAdmin (service role)
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        pro_status: 'blocked',
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Erreur blocage pro:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message || 'Erreur lors du blocage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Accès Pro bloqué avec succès',
    });
  } catch (error: any) {
    console.error('Erreur API block pro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
