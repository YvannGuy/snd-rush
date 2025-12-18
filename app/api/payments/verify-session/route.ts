import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const reservationId = searchParams.get('reservation_id');

    if (!sessionId || !reservationId) {
      return NextResponse.json({ error: 'session_id et reservation_id requis' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 });
    }

    // Vérifier le statut de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('🔍 Vérification session Stripe:', {
      sessionId,
      reservationId,
      paymentStatus: session.payment_status,
      status: session.status,
    });

    // Si le paiement est complété, mettre à jour la réservation
    if (session.payment_status === 'paid' && session.status === 'complete') {
      // Vérifier le statut actuel de la réservation
      const { data: currentReservation } = await supabaseAdmin
        .from('client_reservations')
        .select('status')
        .eq('id', reservationId)
        .single();

      if (currentReservation && currentReservation.status !== 'PAID') {
        // Mettre à jour le statut
        const { error: updateError } = await supabaseAdmin
          .from('client_reservations')
          .update({
            status: 'PAID',
            stripe_session_id: sessionId,
          })
          .eq('id', reservationId);

        if (updateError) {
          console.error('❌ Erreur mise à jour réservation:', updateError);
          return NextResponse.json({ 
            paid: true, 
            updated: false, 
            error: updateError.message 
          });
        }

        console.log('✅ Réservation mise à jour à PAID');
        return NextResponse.json({ paid: true, updated: true });
      }

      return NextResponse.json({ paid: true, updated: false, alreadyPaid: true });
    }

    return NextResponse.json({ paid: false, paymentStatus: session.payment_status });
  } catch (error: any) {
    console.error('❌ Erreur vérification session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
