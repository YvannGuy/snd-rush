import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { ReservationDraft } from '@/types/chat';
import { computeBasePackPrice, computeDepositAmountEur } from '@/lib/pricing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2025-08-27.basil' as any }) : null;

/**
 * Endpoint pour créer une réservation + Stripe checkout (acompte 30%)
 * 
 * Input: packKey, startAt, endAt, address, phone, customerEmail, customerName
 * Output: { checkoutUrl, reservationId }
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Configuration Stripe manquante' }, { status: 500 });
    }

    const body = await req.json();
    const {
      packKey,
      startAt,
      endAt,
      address,
      phone,
      customerEmail,
      customerName,
    } = body;

    // Validations
    if (!packKey || !['conference', 'soiree', 'mariage'].includes(packKey)) {
      return NextResponse.json({ error: 'packKey invalide' }, { status: 400 });
    }

    if (!startAt || !endAt) {
      return NextResponse.json({ error: 'startAt et endAt sont requis' }, { status: 400 });
    }

    if (!address || !phone) {
      return NextResponse.json({ error: 'address et phone sont requis' }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'customerEmail est requis' }, { status: 400 });
    }

    // Calculer le prix de base du pack
    const basePackPrice = computeBasePackPrice(packKey, startAt, endAt);
    const depositAmount = computeDepositAmountEur(basePackPrice); // 30% en euros

    // Calculer les dates de paiement (solde J-1, caution J-2)
    const startDate = new Date(startAt);
    const balanceDueDate = new Date(startDate);
    balanceDueDate.setDate(balanceDueDate.getDate() - 1);
    balanceDueDate.setHours(9, 0, 0, 0);
    
    const depositRequestDate = new Date(startDate);
    depositRequestDate.setDate(depositRequestDate.getDate() - 2);
    depositRequestDate.setHours(9, 0, 0, 0);

    // Calculer le montant du solde (70% du total)
    const balanceAmount = Math.round((basePackPrice * 0.7) * 100) / 100;

    // 1. Upsert client_reservations (status AWAITING_PAYMENT)
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('client_reservations')
      .upsert({
        pack_key: packKey,
        start_at: startAt,
        end_at: endAt,
        address: address,
        customer_phone: phone,
        customer_email: customerEmail,
        customer_name: customerName || null,
        status: 'AWAITING_PAYMENT',
        source: 'chat',
        base_pack_price: basePackPrice,
        extras_total: 0,
        price_total: basePackPrice,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
        balance_due_at: balanceDueDate.toISOString(),
        deposit_requested_at: depositRequestDate.toISOString(),
        chat_context: {
          flow: 'simplified',
          step: 'deposit_checkout',
        },
      }, {
        onConflict: 'customer_email,start_at', // Éviter doublons
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (reservationError || !reservation) {
      console.error('[CREATE DEPOSIT] Erreur création réservation:', reservationError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation', details: reservationError?.message },
        { status: 500 }
      );
    }

    // 2. Créer Stripe checkout session pour acompte 30%
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard?reservation=${reservation.id}&payment=success`;
    const cancelUrl = `${baseUrl}/dashboard?reservation=${reservation.id}&payment=cancelled`;

    const packNames: Record<string, string> = {
      conference: 'Pack Conférence',
      soiree: 'Pack Soirée',
      mariage: 'Pack Mariage',
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${packNames[packKey] || packKey} - Acompte 30%`,
              description: `Acompte pour réservation du ${new Date(startAt).toLocaleDateString('fr-FR')}`,
            },
            unit_amount: Math.round(depositAmount * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        reservation_id: reservation.id,
        type: 'client_reservation_deposit',
        pack_key: packKey,
        paymentType: 'deposit',
      },
    });

    // 3. Mettre à jour la réservation avec stripe_session_id
    await supabaseAdmin
      .from('client_reservations')
      .update({ stripe_session_id: session.id })
      .eq('id', reservation.id);

    return NextResponse.json({
      checkoutUrl: session.url,
      reservationId: reservation.id,
      depositAmount,
    });
  } catch (error: any) {
    console.error('[CREATE DEPOSIT] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
