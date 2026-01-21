import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    // Vérifier que l'utilisateur est admin (via header Authorization)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const isAdmin = user.user_metadata?.role === 'admin' || 
                    user.email === 'yvann.guyonnet@gmail.com' ||
                    user.email === 'sndrush12@gmail.com';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer toutes les demandes
    const { data, error } = await supabaseAdmin
      .from('reservation_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération demandes:', error);
      return NextResponse.json(
        { error: 'Erreur serveur', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: data || [] });
  } catch (error: any) {
    console.error('Erreur API admin reservation-requests:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}








