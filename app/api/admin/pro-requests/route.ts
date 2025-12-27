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

    // OPTIMISATION: Récupérer uniquement les utilisateurs nécessaires au lieu de tous
    const emailMap = new Map<string, string>();
    
    // Récupérer les emails par batch (limite de 1000 par requête)
    const batchSize = 1000;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      try {
        // Utiliser getUserById pour chaque utilisateur (plus efficace que listUsers)
        const userPromises = batch.map(userId => 
          supabaseAdmin.auth.admin.getUserById(userId).then(({ data, error }) => {
            if (!error && data?.user?.email) {
              emailMap.set(userId, data.user.email);
            }
          })
        );
        await Promise.all(userPromises);
      } catch (error) {
        console.error('Erreur récupération batch users:', error);
      }
    }

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
