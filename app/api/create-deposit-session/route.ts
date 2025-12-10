import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return NextResponse.json(
        { success: false, error: 'URL de base manquante' },
        { status: 500 }
      );
    }

    // Récupérer les paramètres depuis l'URL
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');
    const depositParam = searchParams.get('deposit');
    const reservationId = searchParams.get('reservationId');

    if (!sessionId || !depositParam) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants (session_id ou deposit)' },
        { status: 400 }
      );
    }

    // Convertir le montant de la caution (déjà en centimes depuis l'URL)
    const depositAmount = parseInt(depositParam, 10);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      // Si la caution est 0 ou invalide, rediriger directement vers le dashboard
      return NextResponse.redirect(
        new URL('/dashboard', process.env.NEXT_PUBLIC_BASE_URL!)
      );
    }

    // Récupérer la session Stripe du paiement principal pour obtenir le customer_id
    const mainSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent'],
    });

    if (!mainSession) {
      return NextResponse.json(
        { success: false, error: 'Session Stripe introuvable' },
        { status: 404 }
      );
    }

    // Récupérer le customer_id (peut être un string ou un objet Customer)
    let customerId: string | null = null;
    if (typeof mainSession.customer === 'string') {
      customerId = mainSession.customer;
    } else if (mainSession.customer && typeof mainSession.customer === 'object') {
      customerId = mainSession.customer.id;
    }

    // Si pas de customer_id, créer un customer à partir de l'email
    if (!customerId && mainSession.customer_email) {
      const customer = await stripe.customers.create({
        email: mainSession.customer_email,
      });
      customerId = customer.id;
    }

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Impossible de récupérer ou créer le client Stripe' },
        { status: 500 }
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?deposit=success&session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationId || ''}&clear_cart=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier?deposit=cancelled`,
      // IMPORTANT: Les métadonnées doivent être au niveau de la session, pas seulement dans payment_intent_data
      metadata: {
        type: 'deposit',
        reservationId: reservationId || '',
        mainSessionId: sessionId,
      },
    });

    // Rediriger directement vers Stripe Checkout pour la caution
    if (depositSession.url) {
      return NextResponse.redirect(depositSession.url);
    }

    return NextResponse.json(
      { success: false, error: 'Impossible de créer la session de caution' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Erreur création session caution:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
