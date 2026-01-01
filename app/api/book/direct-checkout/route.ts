import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { generateTokenWithHash } from '@/lib/token';

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
      customer_name,
      contact_phone,
      contact_email,
      price_total,
      deposit_amount,
      balance_amount = 0,
      security_deposit_amount, // Caution (sécurité matériel)
      address,
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

    // Utiliser l'adresse complète fournie ou construire à partir de city/postal_code
    const finalAddress = address || (city && postal_code ? `${city}, ${postal_code}` : (city || postal_code || null));
    const notes = JSON.stringify({
      flow: 'direct_solution',
      city: city || null,
      postal_code: postal_code || null,
    });

    // Calculer la caution selon le pack et le tier (si disponible)
    // Par défaut, utiliser les valeurs de base si security_deposit_amount n'est pas fourni
    const baseCautionAmounts: Record<string, number> = {
      conference: 700,
      soiree: 1100,
      mariage: 1600,
    };
    const securityDepositAmount = security_deposit_amount || baseCautionAmounts[pack_key] || 0;

    // ÉTAPE 1 : Appeler la fonction PostgreSQL atomique pour créer hold + réservation
    // Cette fonction utilise pg_advisory_xact_lock pour éviter les race conditions
    // Note: L'ordre des paramètres correspond à la signature de la fonction SQL
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('create_hold_for_checkout', {
      p_pack_key: pack_key,
      p_start_at: startAt.toISOString(),
      p_end_at: endAt.toISOString(),
      p_customer_email: customer_email,
      p_price_total: price_total,
      p_deposit_amount: deposit_amount, // Acompte 30%
      p_balance_amount: balance_amount,
      p_security_deposit_amount: securityDepositAmount, // Caution (sécurité matériel)
      p_address: finalAddress,
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

    // Mettre à jour la réservation avec le nom du client et l'adresse complète si fournis
    if (customer_name || finalAddress) {
      const updateData: any = {};
      if (customer_name) updateData.customer_name = customer_name;
      if (finalAddress) updateData.address = finalAddress;
      
      await supabaseAdmin
        .from('client_reservations')
        .update(updateData)
        .eq('id', reservation_id);
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

    // Valider et nettoyer l'email
    const emailToUse = customer_email?.trim() || null;
    if (!emailToUse || emailToUse === 'pending@stripe.com') {
      console.error('[DIRECT-CHECKOUT] ❌ Email invalide reçu:', customer_email);
      console.error('[DIRECT-CHECKOUT] ❌ Email après trim:', emailToUse);
      return NextResponse.json(
        { error: 'Email invalide ou manquant. Veuillez fournir un email valide.' },
        { status: 400 }
      );
    }

    // Générer un token public pour le checkout (AVANT de créer la session Stripe)
    const { token: checkoutToken, hash: checkoutTokenHash, expiresAt: checkoutTokenExpiresAt } = generateTokenWithHash(7);
    
    // Mettre à jour la réservation avec le token
    const { error: tokenUpdateError } = await supabaseAdmin
      .from('client_reservations')
      .update({
        public_token_hash: checkoutTokenHash,
        public_token_expires_at: checkoutTokenExpiresAt.toISOString(),
      })
      .eq('id', reservation_id);
    
    if (tokenUpdateError) {
      console.error('[DIRECT-CHECKOUT] ❌ Erreur mise à jour token:', tokenUpdateError);
      // Ne pas faire échouer la création de la session, le token sera généré dans le webhook
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acompte - Blocage de date',
              description: `Acompte de 30% pour ${packName} (${deposit_amount}€). Le solde restant sera demandé 1 jour avant votre événement.`,
            },
            unit_amount: Math.round(deposit_amount * 100), // En centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: emailToUse, // Email transmis à Stripe Checkout
      success_url: `${siteUrl}/book/success?reservation_id=${reservation_id}`,
      cancel_url: `${siteUrl}/book/${pack_key}?cancelled=true`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // Expire dans 30 minutes (minimum requis par Stripe, le hold expire après 10 min mais la session Stripe peut rester plus longtemps)
      metadata: {
        // MÉTADONNÉES OBLIGATOIRES pour le webhook
        type: 'client_reservation_deposit',
        flow: 'direct_solution',
        pack_key: pack_key,
        hold_id: hold_id,
        reservation_id: reservation_id,
        price_total: price_total.toString(),
        deposit_amount: deposit_amount.toString(),
        // Token pour le lien de checkout dans l'email (récupéré dans le webhook)
        checkout_token: checkoutToken,
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
    const { error: updateError } = await supabaseAdmin
      .from('client_reservations')
      .update({ stripe_session_id: session.id })
      .eq('id', reservation_id)
      .eq('status', 'AWAITING_PAYMENT'); // Seulement si encore en attente
    
    if (updateError) {
      console.error('[DIRECT-CHECKOUT] ❌ Erreur mise à jour session_id:', updateError);
    }

    return NextResponse.json({
      checkout_url: session.url,
      reservation_id,
      hold_id,
    });
  } catch (error) {
    console.error('[DIRECT-CHECKOUT] Erreur API:', error);
    
    // Logger les détails complets de l'erreur
    if (error instanceof Error) {
      console.error('[DIRECT-CHECKOUT] Message:', error.message);
      console.error('[DIRECT-CHECKOUT] Stack:', error.stack);
      console.error('[DIRECT-CHECKOUT] Name:', error.name);
    }
    
    // Gérer les erreurs spécifiques
    let errorMessage = 'Erreur serveur';
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Erreur Stripe spécifique
      if (error.message.includes('expires_at') && error.message.includes('30 minutes')) {
        errorMessage = 'Erreur de configuration du paiement. Veuillez réessayer.';
        statusCode = 500;
      }
      // Autres erreurs Stripe
      else if (error.message.includes('Stripe') || error.message.includes('stripe') || (error as any).type === 'StripeInvalidRequestError') {
        errorMessage = 'Erreur lors de la création de la session de paiement. Veuillez réessayer.';
        statusCode = 500;
      }
      // Erreur Supabase
      else if (error.message.includes('Supabase') || error.message.includes('supabase') || error.message.includes('database')) {
        errorMessage = 'Erreur de connexion à la base de données. Veuillez réessayer.';
        statusCode = 500;
      }
      // Autres erreurs
      else {
        errorMessage = error.message || 'Erreur serveur';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        // Ne pas exposer le stack en production, mais utile pour le debug
        ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { stack: error.stack } : {})
      },
      { status: statusCode }
    );
  }
}
