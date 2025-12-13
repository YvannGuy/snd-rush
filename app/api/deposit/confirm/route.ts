import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Route pour confirmer le paiement de la caution et mettre à jour le statut de la réservation
 * Appelée depuis le dashboard après le succès du paiement de la caution
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { sessionId, reservationId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId manquant' },
        { status: 400 }
      );
    }

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: 'reservationId manquant' },
        { status: 400 }
      );
    }

    // Récupérer la session Stripe pour vérifier qu'elle est bien complétée
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session Stripe introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que la session est complétée
    if (session.payment_status !== 'paid' && session.payment_status !== 'unpaid') {
      return NextResponse.json(
        { success: false, error: 'Session de paiement non complétée' },
        { status: 400 }
      );
    }

    // Récupérer le PaymentIntent
    let paymentIntentId = null;
    if (session.payment_intent) {
      if (typeof session.payment_intent === 'string') {
        paymentIntentId = session.payment_intent;
      } else {
        paymentIntentId = session.payment_intent.id;
      }
    }

    // Récupérer les notes existantes de la réservation
    let existingNotes = {};
    try {
      const { data: existingReservation } = await supabaseAdmin
        .from('reservations')
        .select('notes')
        .eq('id', reservationId)
        .single();
      
      if (existingReservation?.notes) {
        existingNotes = JSON.parse(existingReservation.notes);
      }
    } catch (e) {
      console.warn('⚠️ Impossible de récupérer les notes existantes:', e);
    }

    // Mettre à jour la réservation pour indiquer que la caution a été autorisée
    // Stocker les infos de caution dans notes (pas de colonnes dédiées)
    const { data: updatedReservation, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({
        status: 'CONFIRMED',
        notes: JSON.stringify({
          ...existingNotes,
          depositAuthorized: true,
          depositSessionId: sessionId,
          depositPaymentIntentId: paymentIntentId,
          depositAuthorizedAt: new Date().toISOString(),
          confirmedViaApi: true, // Indique que la confirmation vient de l'API et non du webhook
        }),
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour réservation pour caution:', updateError);
      return NextResponse.json(
        { success: false, error: `Erreur lors de la mise à jour: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Caution confirmée via API - Réservation mise à jour:', {
      reservationId,
      status: updatedReservation?.status,
      depositSessionId: sessionId,
    });

    // Créer automatiquement un état des lieux pour cette réservation
    try {
      const { data: existingEtatLieux } = await supabaseAdmin
        .from('etat_lieux')
        .select('id')
        .eq('reservation_id', reservationId)
        .maybeSingle();

      if (!existingEtatLieux) {
        const { error: etatLieuxError } = await supabaseAdmin
          .from('etat_lieux')
          .insert({
            reservation_id: reservationId,
            status: 'draft',
            items: JSON.stringify({
              photos_avant: [],
              commentaire_avant: '',
              photos_apres: [],
              commentaire_apres: ''
            })
          });

        if (etatLieuxError) {
          console.error('⚠️ Erreur création état des lieux:', etatLieuxError);
        } else {
          console.log('✅ État des lieux créé automatiquement pour la réservation:', reservationId);
        }
      }
    } catch (e) {
      console.error('⚠️ Erreur création automatique état des lieux:', e);
    }

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
    });
  } catch (error: any) {
    console.error('❌ Erreur confirmation caution:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
