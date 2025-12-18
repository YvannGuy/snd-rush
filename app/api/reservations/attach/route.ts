import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Rattache les réservations (client_reservations) à un utilisateur après son inscription
 * Cette route est appelée automatiquement après la création d'un compte
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    const body = await req.json();
    const { user_id, email } = body;

    if (!user_id || !email) {
      return NextResponse.json({ error: 'user_id et email requis' }, { status: 400 });
    }

    // Rattacher les client_reservations qui correspondent à cet email mais n'ont pas encore de user_id
    const { data: reservations, error: fetchError } = await supabaseAdmin
      .from('client_reservations')
      .select('id')
      .eq('customer_email', email.toLowerCase().trim())
      .is('user_id', null);

    if (fetchError) {
      console.error('Erreur récupération réservations:', fetchError);
      return NextResponse.json({ error: 'Erreur récupération réservations' }, { status: 500 });
    }

    if (reservations && reservations.length > 0) {
      // Mettre à jour toutes les réservations avec le user_id
      const { error: updateError } = await supabaseAdmin
        .from('client_reservations')
        .update({ user_id })
        .eq('customer_email', email.toLowerCase().trim())
        .is('user_id', null);

      if (updateError) {
        console.error('Erreur rattachement réservations:', updateError);
        return NextResponse.json({ error: 'Erreur rattachement réservations' }, { status: 500 });
      }

      console.log(`✅ ${reservations.length} réservation(s) rattachée(s) à l'utilisateur ${user_id}`);
    }

    return NextResponse.json({ 
      success: true, 
      attached_count: reservations?.length || 0 
    });
  } catch (error: any) {
    console.error('Erreur API attach reservations:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}
