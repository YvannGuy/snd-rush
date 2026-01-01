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
 * API pour créer une session Stripe pour le paiement du solde (70%)
 * Appelée automatiquement J-5 ou manuellement par l'admin
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
    const { reservation_id, token, customer_email } = body; // token optionnel pour paiement public, customer_email pour utilisateurs non connectés

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

    // Vérifier que l'acompte a été payé
    if (!reservation.deposit_paid_at) {
      return NextResponse.json({ error: 'L\'acompte doit être payé avant de payer le solde' }, { status: 400 });
    }

    // Vérifier que le solde n'a pas déjà été payé
    if (reservation.balance_paid_at) {
      return NextResponse.json({ error: 'Le solde a déjà été payé' }, { status: 400 });
    }

    // Vérifier le token si fourni (pour paiement public)
    if (token && reservation.public_token_hash) {
      if (!verifyToken(token, reservation.public_token_hash)) {
        return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
      }
    }

    // Calculer le montant du solde (70% du total)
    const balanceAmount = reservation.balance_amount 
      ? Math.round(parseFloat(reservation.balance_amount.toString()) * 100)
      : Math.round(parseFloat(reservation.price_total.toString()) * 0.7 * 100);

    // Créer la session Stripe pour le solde
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Solde restant - Votre événement',
              description: `Solde de 70% pour votre événement (${balanceAmount / 100}€). Le solde est demandé 1 jour avant votre événement.`,
            },
            unit_amount: balanceAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success&reservation_id=${reservation.id}&type=balance`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
      customer_email: customer_email || reservation.customer_email || undefined, // Priorité à l'email fourni dans la requête
      metadata: {
        type: 'client_reservation_balance',
        reservation_id: reservation.id,
        pack_key: reservation.pack_key,
        price_total: reservation.price_total.toString(),
        balance_amount: (balanceAmount / 100).toString(),
      },
    });

    // Mettre à jour la réservation avec le session_id du solde
    await supabaseAdmin
      .from('client_reservations')
      .update({ balance_session_id: session.id })
      .eq('id', reservation.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Erreur création session solde Stripe:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}
