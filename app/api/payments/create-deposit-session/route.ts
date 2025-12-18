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
    const depositParam = searchParams.get('deposit');
    const reservationId = searchParams.get('reservation_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id requis' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    // Récupérer la session principale pour obtenir le customer
    const mainSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!mainSession.customer) {
      // Créer un customer si nécessaire
      const customer = await stripe.customers.create({
        email: mainSession.customer_email || undefined,
      });
      mainSession.customer = customer.id;
    }

    const customerId = typeof mainSession.customer === 'string' 
      ? mainSession.customer 
      : mainSession.customer.id;

    const depositAmount = depositParam ? parseInt(depositParam, 10) : 0;

    if (depositAmount <= 0) {
      // Pas de caution, rediriger directement vers le dashboard
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success&reservation_id=${reservationId || ''}`
      );
    }

    // Créer la session Stripe Checkout pour la caution
    const depositSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Autorisation de caution: €${(depositAmount / 100).toFixed(2)}`,
              description: 'Cette autorisation de caution sert à garantir votre location d\'équipement sono et vidéo.',
            },
            unit_amount: depositAmount, // Déjà en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual', // Autorisation sans débit immédiat
        metadata: {
          type: 'deposit',
          reservationId: reservationId || '',
          mainSessionId: sessionId,
        },
      },
      custom_text: {
        submit: {
          message:
            "Cette autorisation de caution sert à garantir votre location d'équipement sono et vidéo. " +
            "Le montant n'est pas débité immédiatement, il reste simplement bloqué. " +
            "Après l'événement et la vérification du matériel, 95 % des cautions sont libérées sans frais. " +
            "En cas de dommages, une expertise sera réalisée sous 48 heures pour évaluer les réparations nécessaires. " +
            "Selon l'ampleur des dégâts, le montant correspondant sera déduit de la caution.",
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?deposit=success&session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationId || ''}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?deposit=cancelled&reservation_id=${reservationId || ''}`,
      metadata: {
        type: 'deposit',
        reservationId: reservationId || '',
        mainSessionId: sessionId,
      },
    });

    // Rediriger directement vers Stripe Checkout pour la caution
    if (!depositSession.url) {
      return NextResponse.json({ error: 'Erreur création session caution' }, { status: 500 });
    }

    return NextResponse.redirect(depositSession.url);
  } catch (error: any) {
    console.error('❌ Erreur création session caution:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}
