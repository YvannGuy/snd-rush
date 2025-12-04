import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Désactiver le body parsing pour Stripe webhook
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error('❌ Stripe signature manquante');
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET manquante dans les variables d\'environnement');
    return NextResponse.json(
      { error: 'Configuration webhook manquante' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('❌ Erreur vérification signature Stripe:', err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  console.log('✅ Webhook Stripe reçu:', event.type);

  // Gérer les différents types d'événements
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('✅ Paiement réussi - Session ID:', session.id);
      
      // Ici vous pouvez :
      // 1. Créer une commande dans votre base de données
      // 2. Envoyer un email de confirmation
      // 3. Mettre à jour le stock
      // 4. Créer une réservation dans Supabase
      
      try {
        // Exemple : créer une réservation dans Supabase
        // const { createClient } = require('@supabase/supabase-js');
        // const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
        
        // Pour chaque item dans la session
        // await supabase.from('reservations').insert({
        //   session_id: session.id,
        //   customer_email: session.customer_email,
        //   amount_total: session.amount_total,
        //   status: 'CONFIRMED',
        //   ...
        // });

        console.log('✅ Commande traitée avec succès pour la session:', session.id);
      } catch (error) {
        console.error('❌ Erreur lors du traitement de la commande:', error);
        // Ne pas retourner d'erreur pour éviter que Stripe réessaie indéfiniment
        // Vous pouvez logger l'erreur et la traiter manuellement
      }
      break;
    }

    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('✅ Paiement asynchrone réussi - Session ID:', session.id);
      // Traiter le paiement asynchrone (ex: virement bancaire)
      break;
    }

    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('❌ Paiement asynchrone échoué - Session ID:', session.id);
      // Notifier le client que le paiement a échoué
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('✅ PaymentIntent réussi:', paymentIntent.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('❌ PaymentIntent échoué:', paymentIntent.id);
      break;
    }

    default:
      console.log(`⚠️ Événement non géré: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

