import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabaseAdmin = (supabaseUrl && supabaseKey && supabaseUrl.trim() !== '' && supabaseKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Configuration Supabase manquante' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { reservationId, signature, signedAt, userId } = body;

    if (!reservationId || !signature) {
      return NextResponse.json(
        { error: 'reservationId et signature sont requis' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('id, user_id, client_signature')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que la réservation appartient à l'utilisateur
    if (reservation.user_id !== userId) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à signer ce contrat' },
        { status: 403 }
      );
    }

    // Vérifier si déjà signé
    if (reservation.client_signature) {
      return NextResponse.json(
        { error: 'Ce contrat a déjà été signé' },
        { status: 400 }
      );
    }

    // Mettre à jour la réservation avec la signature
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({
        client_signature: signature,
        client_signed_at: signedAt || new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (updateError) {
      console.error('Erreur mise à jour signature:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde de la signature' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contrat signé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur signature contrat:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

