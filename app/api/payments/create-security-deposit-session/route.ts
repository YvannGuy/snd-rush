import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/token';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * API pour créer une session Stripe pour la caution (autorisation ou paiement)
 * Appelée automatiquement J-2 ou manuellement par l'admin
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Configuration Stripe manquante' }, { status: 500 });
    }

    const body = await req.json();
    const { reservation_id, token } = body; // token optionnel pour paiement public

    if (!reservation_id) {
      return NextResponse.json({ error: 'reservation_id requis' }, { status: 400 });
    }

    // Récupérer la réservation
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .eq('id', reservation_id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    if (!reservation.deposit_amount || parseFloat(reservation.deposit_amount.toString()) === 0) {
      return NextResponse.json({ error: 'Aucune caution à payer pour cette réservation' }, { status: 400 });
    }

    // Vérifier le token si fourni (pour paiement public)
    if (token && reservation.public_token_hash) {
      if (!verifyToken(token, reservation.public_token_hash)) {
        return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
      }
    }

    // Calculer le montant de la caution en centimes
    const depositAmountInCents = Math.round(parseFloat(reservation.deposit_amount.toString()) * 100);

    // Créer la session Stripe pour la caution
    // Mode 'setup' pour autorisation uniquement (non débitée) ou 'payment' pour débit immédiat
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Caution - Sécurité matériel',
              description: `Caution de ${depositAmountInCents / 100}€ pour votre événement. Cette caution sera bloquée sur votre carte mais non débitée sauf en cas d'incident. Elle sera libérée après retour du matériel en bon état.`,
            },
            unit_amount: depositAmountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Mode payment pour bloquer la somme (ou setup pour autorisation uniquement)
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success&reservation_id=${reservation.id}&type=deposit`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
      customer_email: reservation.customer_email || undefined,
      metadata: {
        type: 'client_reservation_security_deposit',
        reservation_id: reservation.id,
        pack_key: reservation.pack_key,
        deposit_amount: reservation.deposit_amount.toString(),
      },
    });

    // Mettre à jour la réservation avec le session_id de la caution
    await supabaseAdmin
      .from('client_reservations')
      .update({ deposit_session_id: session.id })
      .eq('id', reservation.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Erreur création session caution Stripe:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}
