import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY manquante');
      return NextResponse.json(
        { success: false, error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error('NEXT_PUBLIC_BASE_URL manquante');
      return NextResponse.json(
        { success: false, error: 'URL de base manquante' },
        { status: 500 }
      );
    }

    const body = await req.json();
    
    // Support pour deux formats : ancien (pack seul) et nouveau (panier complet)
    const { items, total, deliveryFee, deliveryOption, amount, packName, customerEmail, customerName } = body;

    // Format nouveau : panier complet avec items
    if (items && Array.isArray(items)) {
      const lineItems = items.map((item: { name: string; quantity: number; price: number }) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price, // Déjà en centimes
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier/cancel`,
        metadata: {
          type: 'cart',
          deliveryOption: deliveryOption || 'paris',
          deliveryFee: deliveryFee?.toString() || '0',
        },
        // Permettre les webhooks pour vérifier le paiement côté serveur
        payment_intent_data: {
          metadata: {
            type: 'cart',
            deliveryOption: deliveryOption || 'paris',
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        sessionId: session.id,
        url: session.url 
      });
    }

    // Format ancien : pack seul (rétrocompatibilité)
    if (!amount || !packName || !customerEmail || !customerName) {
      console.error('Champs manquants:', { amount, packName, customerEmail, customerName });
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Acompte ${packName}`,
              description: `Acompte de 30% pour le ${packName}`,
            },
            unit_amount: amount * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/cancel`,
      customer_email: customerEmail,
      metadata: {
        packName,
        customerName,
        type: 'deposit'
      }
    });

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Erreur Stripe:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
