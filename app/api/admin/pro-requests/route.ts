import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Récupérer tous les user_profiles avec pro_status ou role='pro'
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .or('pro_status.not.is.null,role.eq.pro')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Récupérer les emails depuis auth.users
    const userIds = profiles?.map(p => p.user_id).filter(Boolean) || [];
    
    if (userIds.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    // Récupérer les utilisateurs depuis auth
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('Erreur récupération users:', usersError);
      // Retourner quand même les profils sans emails
      return NextResponse.json({ requests: profiles || [] });
    }

    // Créer un map user_id -> email
    const emailMap = new Map<string, string>();
    users.forEach(user => {
      if (user.email) {
        emailMap.set(user.id, user.email);
      }
    });

    // Enrichir les profils avec les emails
    const enrichedProfiles = (profiles || []).map(profile => ({
      ...profile,
      email: emailMap.get(profile.user_id) || null,
    }));

    return NextResponse.json({ requests: enrichedProfiles });
  } catch (error: any) {
    console.error('Erreur récupération demandes pro:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
