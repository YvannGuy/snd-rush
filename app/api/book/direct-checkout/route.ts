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

/**
 * POST /api/book/direct-checkout
 * Flow "solution clé en main" : crée atomiquement un hold + réservation et ouvre Stripe Checkout
 * 
 * Utilise la fonction PostgreSQL atomique create_hold_for_checkout pour éviter les race conditions.
 * Le hold n'est créé QUE lorsque l'utilisateur clique sur "Payer l'acompte".
 * 
 * Body:
 * {
 *   pack_key: 'conference' | 'soiree' | 'mariage',
 *   start_at: string (ISO),
 *   end_at: string (ISO),
 *   customer_email: string,
 *   contact_phone?: string,
 *   contact_email?: string,
 *   price_total: number,
 *   deposit_amount: number,
 *   balance_amount?: number,
 *   city?: string,
 *   postal_code?: string,
 *   final_items?: jsonb,
 *   source?: string (default: 'direct_solution')
 * }
 * 
 * Retourne:
 * {
 *   checkout_url: string,
 *   reservation_id: string,
 *   hold_id: string
 * }
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
    const {
      pack_key,
      start_at,
      end_at,
      customer_email,
      contact_phone,
      contact_email,
      price_total,
      deposit_amount,
      balance_amount = 0,
      city,
      postal_code,
      final_items,
      source = 'direct_solution',
    } = body;

    // Validations
    if (!pack_key || !['conference', 'soiree', 'mariage'].includes(pack_key)) {
      return NextResponse.json({ error: 'pack_key invalide' }, { status: 400 });
    }

    if (!start_at || !end_at) {
      return NextResponse.json({ error: 'start_at et end_at sont requis' }, { status: 400 });
    }

    if (!customer_email) {
      return NextResponse.json({ error: 'customer_email est requis' }, { status: 400 });
    }

    if (!price_total || price_total <= 0) {
      return NextResponse.json({ error: 'price_total invalide' }, { status: 400 });
    }

    if (!deposit_amount || deposit_amount <= 0) {
      return NextResponse.json({ error: 'deposit_amount invalide' }, { status: 400 });
    }

    const startAt = new Date(start_at);
    const endAt = new Date(end_at);

    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
    }

    if (endAt <= startAt) {
      return NextResponse.json({ error: 'end_at doit être après start_at' }, { status: 400 });
    }

    // Construire l'adresse si disponible
    const address = city && postal_code ? `${city}, ${postal_code}` : (city || postal_code || null);
    const notes = JSON.stringify({
      flow: 'direct_solution',
      city: city || null,
      postal_code: postal_code || null,
    });

    // ÉTAPE 1 : Appeler la fonction PostgreSQL atomique pour créer hold + réservation
    // Cette fonction utilise pg_advisory_xact_lock pour éviter les race conditions
    // Note: L'ordre des paramètres correspond à la signature de la fonction SQL
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('create_hold_for_checkout', {
      p_pack_key: pack_key,
      p_start_at: startAt.toISOString(),
      p_end_at: endAt.toISOString(),
      p_customer_email: customer_email,
      p_price_total: price_total,
      p_deposit_amount: deposit_amount,
      p_balance_amount: balance_amount,
      p_address: address,
      p_notes: notes,
      p_final_items: final_items || null,
      p_source: source,
      p_chat_context: null,
      p_contact_phone: contact_phone || null,
      p_contact_email: contact_email || null,
    });

    if (rpcError) {
      console.error('[DIRECT-CHECKOUT] Erreur RPC create_hold_for_checkout:', rpcError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du hold', details: rpcError.message },
        { status: 500 }
      );
    }

    // Vérifier le résultat de la fonction (result est un jsonb retourné par PostgreSQL)
    if (!result || typeof result !== 'object' || !result.ok) {
      const reason = (result as any)?.reason || 'UNKNOWN_ERROR';
      const statusCode = reason === 'SLOT_HELD' || reason === 'SLOT_BOOKED' ? 409 : 400;
      const errorMessage = 
        reason === 'SLOT_HELD' ? 'Créneau temporairement indisponible (en cours de réservation)'
        : reason === 'SLOT_BOOKED' ? 'Ce créneau est déjà réservé'
        : reason === 'INVALID_PACK_KEY' ? 'Pack invalide'
        : reason === 'INVALID_DATES' ? 'Dates invalides'
        : reason === 'INVALID_PRICE' ? 'Prix invalide'
        : 'Erreur lors de la création du hold';

      return NextResponse.json(
        { error: errorMessage, reason },
        { status: statusCode }
      );
    }

    const { hold_id, reservation_id } = result as { ok: true; hold_id: string; reservation_id: string; expires_at: string };

    if (!hold_id || !reservation_id) {
      console.error('[DIRECT-CHECKOUT] IDs manquants dans le résultat RPC:', result);
      return NextResponse.json(
        { error: 'Erreur lors de la création du hold', details: 'IDs manquants' },
        { status: 500 }
      );
    }

    // Vérifier si une session Stripe existe déjà pour cette réservation (idempotency)
    const { data: existingReservation } = await supabaseAdmin
      .from('client_reservations')
      .select('stripe_session_id')
      .eq('id', reservation_id)
      .single();

    if (existingReservation?.stripe_session_id) {
      // Récupérer la session existante
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(existingReservation.stripe_session_id);
        if (existingSession && existingSession.url) {
          return NextResponse.json({
            checkout_url: existingSession.url,
            reservation_id,
            hold_id,
          });
        }
      } catch (stripeError) {
        // Si la session n'existe plus, continuer pour en créer une nouvelle
        console.warn('[DIRECT-CHECKOUT] Session Stripe existante invalide, création d\'une nouvelle');
      }
    }

    // ÉTAPE 2 : Créer la session Stripe Checkout avec métadonnées OBLIGATOIRES
    const packNames: Record<string, string> = {
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage'
    };
    const packName = packNames[pack_key] || pack_key;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acompte - Blocage de date',
              description: `Acompte de 30% pour ${packName} (${deposit_amount}€). Le solde restant sera demandé 5 jours avant votre événement.`,
            },
            unit_amount: Math.round(deposit_amount * 100), // En centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customer_email,
      success_url: `${siteUrl}/dashboard?payment=success&reservation_id=${reservation_id}`,
      cancel_url: `${siteUrl}/book/${pack_key}?cancelled=true`,
      expires_at: Math.floor(Date.now() / 1000) + (10 * 60), // Expire dans 10 minutes (même durée que le hold)
      metadata: {
        // MÉTADONNÉES OBLIGATOIRES pour le webhook
        type: 'client_reservation_deposit',
        flow: 'direct_solution',
        pack_key: pack_key,
        hold_id: hold_id,
        reservation_id: reservation_id,
        price_total: price_total.toString(),
        deposit_amount: deposit_amount.toString(),
      },
      payment_intent_data: {
        metadata: {
          type: 'client_reservation_deposit',
          flow: 'direct_solution',
          pack_key: pack_key,
          hold_id: hold_id,
          reservation_id: reservation_id,
        },
      },
    });

    // Mettre à jour la réservation avec le session_id
    await supabaseAdmin
      .from('client_reservations')
      .update({ stripe_session_id: session.id })
      .eq('id', reservation_id)
      .eq('status', 'AWAITING_PAYMENT'); // Seulement si encore en attente

    return NextResponse.json({
      checkout_url: session.url,
      reservation_id,
      hold_id,
    });
  } catch (error) {
    console.error('[DIRECT-CHECKOUT] Erreur API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
