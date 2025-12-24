import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getBasePack, generateCustomerSummary } from '@/lib/packs/basePacks';

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
 * Nouveau flow "solution clé en main" : crée un hold, une réservation et ouvre Stripe Checkout directement
 * 
 * Body:
 * {
 *   pack_key: 'conference' | 'soiree' | 'mariage',
 *   start_at: string (ISO),
 *   end_at: string (ISO),
 *   city?: string,
 *   postal_code?: string,
 *   delivery_installation: boolean
 * }
 * 
 * Retourne:
 * {
 *   checkout_url: string
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
      city,
      postal_code,
      delivery_installation = true,
      price_override = null, // Prix ajusté selon le tier (optionnel)
    } = body;

    // Validations
    if (!pack_key || !['conference', 'soiree', 'mariage'].includes(pack_key)) {
      return NextResponse.json({ error: 'pack_key invalide' }, { status: 400 });
    }

    if (!start_at || !end_at) {
      return NextResponse.json({ error: 'start_at et end_at sont requis' }, { status: 400 });
    }

    const startAt = new Date(start_at);
    const endAt = new Date(end_at);

    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
    }

    if (endAt <= startAt) {
      return NextResponse.json({ error: 'end_at doit être après start_at' }, { status: 400 });
    }

    // Récupérer le pack de base
    const basePack = getBasePack(pack_key);
    if (!basePack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 });
    }

    // ÉTAPE 1 : Créer un HOLD de 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { data: hold, error: holdError } = await supabaseAdmin
      .from('reservation_holds')
      .insert({
        pack_key: pack_key,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'ACTIVE',
        source: 'direct_solution',
      })
      .select()
      .single();

    if (holdError || !hold) {
      console.error('[DIRECT-CHECKOUT] Erreur création hold:', holdError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du hold', details: holdError?.message },
        { status: 500 }
      );
    }

    // ÉTAPE 2 : Créer la réservation client_reservations
    const finalItems = basePack.defaultItems;
    const basePackPrice = basePack.basePrice;
    const extrasTotal = 0; // Pas d'extras pour le flow direct
    // Utiliser le prix ajusté si fourni, sinon le prix de base
    const priceTotal = price_override && typeof price_override === 'number' && price_override > 0 
      ? price_override 
      : basePackPrice;
    const depositAmount = Math.round(priceTotal * 0.3); // 30% d'acompte

    // Construire l'adresse si disponible
    const address = city && postal_code ? `${city}, ${postal_code}` : (city || postal_code || null);

    // Générer le résumé client
    const customerSummary = generateCustomerSummary(pack_key, finalItems);

    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('client_reservations')
      .insert({
        pack_key: pack_key,
        status: 'AWAITING_PAYMENT',
        price_total: priceTotal,
        deposit_amount: depositAmount,
        base_pack_price: basePackPrice,
        extras_total: extrasTotal,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        address: address,
        notes: JSON.stringify({
          flow: 'direct_solution',
          delivery_installation: delivery_installation,
          city: city || null,
          postal_code: postal_code || null,
        }),
        final_items: finalItems,
        customer_summary: customerSummary,
        source: 'direct_solution',
      })
      .select()
      .single();

    if (reservationError || !reservation) {
      console.error('[DIRECT-CHECKOUT] Erreur création réservation:', reservationError);
      // Nettoyer le hold en cas d'erreur
      await supabaseAdmin
        .from('reservation_holds')
        .delete()
        .eq('id', hold.id);
      
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation', details: reservationError?.message },
        { status: 500 }
      );
    }

    // ÉTAPE 3 : Créer la session Stripe Checkout avec métadonnées OBLIGATOIRES
    const packNames: Record<string, string> = {
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage'
    };
    const packName = packNames[pack_key] || pack_key;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acompte - Blocage de date',
              description: `Acompte de 30% pour ${packName} (${depositAmount}€). Le solde restant sera demandé 5 jours avant votre événement.`,
            },
            unit_amount: depositAmount * 100, // En centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success&reservation_id=${reservation.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/book/${pack_key}?cancelled=true`,
      metadata: {
        // MÉTADONNÉES OBLIGATOIRES pour le nouveau flow
        type: 'client_reservation_deposit', // Type attendu par le webhook
        flow: 'direct_solution', // Identifiant du nouveau flow
        pack_key: pack_key,
        hold_id: hold.id,
        deposit: 'true',
        reservation_id: reservation.id,
        price_total: priceTotal.toString(),
        deposit_amount: depositAmount.toString(),
      },
      payment_intent_data: {
        metadata: {
          type: 'client_reservation_deposit',
          flow: 'direct_solution',
          pack_key: pack_key,
          hold_id: hold.id,
          reservation_id: reservation.id,
        },
      },
    });

    // Mettre à jour la réservation avec le session_id
    await supabaseAdmin
      .from('client_reservations')
      .update({ stripe_session_id: session.id })
      .eq('id', reservation.id);

    return NextResponse.json({
      checkout_url: session.url,
      reservation_id: reservation.id,
      hold_id: hold.id,
    });
  } catch (error) {
    console.error('[DIRECT-CHECKOUT] Erreur API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
